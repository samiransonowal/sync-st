/**
 * TUNNEL AI SERVICE — Phase 1: Local RAG Engine
 * ─────────────────────────────────────────────────────────────────────────────
 * Pure client-side retrieval and answer synthesis. No AI model required.
 * Works fully offline, works in PWA mode, zero cost, zero latency.
 *
 * Phase 2 upgrade path: replace synthesizeAnswer() with a call to the
 * GCP Cloud Function proxy (tunnelAiProxy) that sends the retrieved
 * context to Gemini and returns a natural language answer.
 *
 * Architecture:
 *   queryKnowledgeBase(question)
 *     → tokenize & normalize query
 *     → score all articles using multi-signal BM25-like scoring
 *     → return top 3-5 articles + synthesized answer
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { TUNNEL_KB } from '../data/tunnelKnowledgeDatabase.js';

// ── Studio-specific abbreviation & slang normalization ────────────────────────
const STUDIO_ALIASES = {
  'z:': 'color01 Z: raw trims storage pool',
  'z drive': 'color01 Z: raw trims',
  'color01': 'color01 Z: raw trims storage pool',
  'o:': 'opt_med O: optimised media',
  'o drive': 'opt_med O: optimised media',
  'opt_med': 'opt_med O: optimised media shared pool',
  'opt med': 'opt_med O: optimised media shared pool',
  'optimized media': 'opt_med optimised media',
  'optimised media': 'opt_med optimised media',
  'y:': 'output Y: renders delivery masters',
  'y drive': 'output Y: renders',
  'output': 'output Y: renders delivery masters',
  'i:': 'cache I: local scratch resolve',
  'cache': 'cache I: local scratch resolve',
  'i drive': 'cache I: local scratch',
  'nas': 'truenas storage server pool',
  'san': 'storage pool server',
  'color01': 'color01 raw trims pool',
  'trims': 'raw camera trims ingest color01',
  'raw': 'raw camera trims ingest',
  'pre clip': 'pre-clip group pre-clip CST',
  'pre-clip': 'pre-clip group pre-clip CST CST-only',
  'post clip': 'post-clip group post-clip look',
  'post-clip': 'post-clip group post-clip look texture CST out',
  'dwg': 'DWG DaVinci Wide Gamut working space HDR',
  'log c': 'LogC camera color space',
  'logc': 'LogC camera color space',
  's-log3': 'S-Log3 camera color space',
  'slog': 'S-Log3 camera color space',
  'v1': 'V1 video track editorial source',
  'v2': 'V2 video track VFX plate sent',
  'v3': 'V3 video track VFX received',
  'v4': 'V4 video track titles burn-ins overlays',
  'green marker': 'green marker VFX shot in-progress',
  'red marker': 'red marker conform issue matte attention',
  'blue marker': 'blue marker client note revision Frame.io',
  'yellow marker': 'yellow marker colorist flag revisit',
  'cyan marker': 'cyan marker QC flag technical',
  'orange clip': 'orange clip flagged uncertain',
  'chocolate clip': 'chocolate clip offline missing media',
  'teal clip': 'teal clip locked approved',
  'nr node': 'NR noise reduction node 01',
  'node 01': 'NR noise reduction first node',
  'node tree': 'fixed node tree clip level canonical structure',
  't blend': 'T BLEND texture blend last node clip level',
  'prores': 'ProRes 4444 XQ archive master format',
  'pq': 'PQ Rec.2020 HDR master output space',
  'rec709': 'Rec.709 Gamma 2.4 SDR',
  'sdr': 'SDR Rec.709 Gamma 2.4 standard dynamic range',
  'hdr': 'HDR PQ Rec.2020 high dynamic range',
  'imf': 'IMF IMP J2K MXF Hotstar Netflix delivery format',
  'dcp': 'DCP theatrical delivery format',
  'photon': 'Photon IMF validation tool QC',
  'frame.io': 'Frame.io client review notes revision',
  'xml log': 'xml-log.md multi-XML conform log',
  'xml': 'XML timeline conform relink diff',
  'notes.md': 'notes.md project notes exceptions deviations',
  'hotstar': 'Hotstar Disney+ delivery IMF App2',
  'netflix': 'Netflix delivery IMF App2e',
  'proposal': 'PROPOSAL pending ratification team consensus',
  'canonical': 'canonical agreed documented enforced',
  'deprecated': 'DEPRECATED no longer in use removal',
};

const STOPWORDS = new Set([
  'a', 'an', 'the', 'is', 'it', 'in', 'on', 'at', 'to', 'for',
  'of', 'and', 'or', 'but', 'with', 'how', 'what', 'where', 'when',
  'why', 'do', 'does', 'should', 'can', 'be', 'are', 'was', 'were',
  'my', 'our', 'their', 'this', 'that', 'which', 'who', 'i', 'we',
  'me', 'us', 'tell', 'about', 'get', 'put', 'go', 'have', 'has',
  'which', 'does', 'need', 'want', 'know', 'give',
]);

// ── Tokenizer & Normalizer ────────────────────────────────────────────────────
function tokenize(text) {
  if (!text || typeof text !== 'string') return [];
  
  let normalized = text.toLowerCase().trim();

  // Apply studio alias expansions (check full phrases first)
  const sortedAliases = Object.keys(STUDIO_ALIASES).sort((a, b) => b.length - a.length);
  for (const alias of sortedAliases) {
    if (normalized.includes(alias)) {
      normalized = normalized.replace(new RegExp(alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), STUDIO_ALIASES[alias]);
    }
  }

  return normalized
    .replace(/[^\w\s.:/-]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 1 && !STOPWORDS.has(t));
}

// ── Multi-Signal Scorer ───────────────────────────────────────────────────────
function scoreArticle(article, queryTokens) {
  if (!queryTokens.length) return 0;

  // Flatten each searchable field into lowercase token arrays
  const titleTokens = tokenize(article.title);
  const tagTokens = (article.tags || []).flatMap(t => tokenize(t));
  const summaryTokens = tokenize(article.summary);
  const rulesTokens = (article.canonicalRules || []).flatMap(r => tokenize(r));
  const contentTokens = tokenize(article.rawContent || '');

  const hit = (fieldTokens, weight) => {
    const fieldSet = new Set(fieldTokens);
    return queryTokens.reduce((acc, qt) => {
      // Exact token match
      if (fieldSet.has(qt)) return acc + weight;
      // Partial / substring match (lower weight)
      const partialHit = fieldTokens.some(ft => ft.includes(qt) || qt.includes(ft));
      if (partialHit) return acc + weight * 0.4;
      return acc;
    }, 0);
  };

  let score = 0;
  score += hit(titleTokens, 3.0);
  score += hit(tagTokens, 2.5);
  score += hit(rulesTokens, 2.0);
  score += hit(summaryTokens, 1.5);
  score += hit(contentTokens, 1.0);

  // Bonus: entire query is covered by the article category
  const categoryHit = tokenize(article.category).some(ct => queryTokens.includes(ct));
  if (categoryHit) score += 0.5;

  return score;
}

// ── Retrieval ─────────────────────────────────────────────────────────────────
export function retrieveArticles(question, topK = 4) {
  const queryTokens = tokenize(question);
  if (!queryTokens.length) return [];

  const scored = TUNNEL_KB.map(article => ({
    article,
    score: scoreArticle(article, queryTokens),
  }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  return scored;
}

// ── Local Answer Synthesis ────────────────────────────────────────────────────
function synthesizeAnswer(question, scoredArticles) {
  if (!scoredArticles.length) {
    return {
      answer: null,
      sources: [],
      confidence: 'none',
    };
  }

  const best = scoredArticles[0].article;
  const confidence = scoredArticles[0].score > 5 ? 'high' : scoredArticles[0].score > 2.5 ? 'medium' : 'low';

  // Build a structured answer from the top article's canonical rules
  const ruleLines = best.canonicalRules && best.canonicalRules.length
    ? best.canonicalRules.map(r => `• ${r}`).join('\n')
    : null;

  const answerParts = [];

  if (best.summary) {
    answerParts.push(best.summary);
  }

  if (ruleLines) {
    answerParts.push('\n\n**Key rules:**\n' + ruleLines);
  }

  // Include supporting context from 2nd result if confidence is low
  if (confidence === 'low' && scoredArticles[1]) {
    const second = scoredArticles[1].article;
    if (second.summary) {
      answerParts.push(`\n\n**Also see:** ${second.title} — ${second.summary}`);
    }
  }

  const sources = scoredArticles.slice(0, 3).map(({ article }) => ({
    id: article.id,
    title: article.title,
    chapterCode: article.chapterCode,
    chapterTitle: article.chapterTitle,
    category: article.category,
  }));

  return {
    answer: answerParts.join(''),
    sources,
    confidence,
    quickRef: best.quickRef || null,
  };
}

// ── Main Query Function ───────────────────────────────────────────────────────
/**
 * queryKnowledgeBase(question)
 *
 * Phase 1: Pure local search & synthesis (no network, no API key needed).
 * Phase 2: Replace synthesizeAnswer() call below with a fetch() to the
 *           GCP Cloud Function tunnelAiProxy, passing:
 *           { question, context: scoredArticles.map(a => a.article.rawContent) }
 *
 * @param {string} question - The user's natural language question
 * @returns {Promise<{answer: string|null, sources: Array, confidence: string, quickRef: object|null, unanswerable: boolean}>}
 */
export async function queryKnowledgeBase(question) {
  if (!question || question.trim().length < 3) {
    return { unanswerable: true, answer: null, sources: [], confidence: 'none', quickRef: null };
  }

  // ── Phase 2 hook: if GEMINI_PROXY_URL is configured, use it ──────────────
  // const GEMINI_PROXY_URL = import.meta.env.VITE_TUNNEL_AI_PROXY_URL;
  // if (GEMINI_PROXY_URL) {
  //   const scoredArticles = retrieveArticles(question, 4);
  //   const context = scoredArticles.map(a => a.article.rawContent).join('\n\n---\n\n');
  //   const res = await fetch(GEMINI_PROXY_URL, {
  //     method: 'POST',
  //     headers: { 'Content-Type': 'application/json' },
  //     body: JSON.stringify({ question, context }),
  //   });
  //   const data = await res.json();
  //   return { answer: data.answer, sources: scoredArticles.map(a => ({...})), confidence: 'high', quickRef: null, unanswerable: false };
  // }
  // ─────────────────────────────────────────────────────────────────────────

  const scoredArticles = retrieveArticles(question, 4);

  if (!scoredArticles.length) {
    return {
      unanswerable: true,
      answer: "This isn't documented in The Tunnel Book yet. Check with Samiran or the lead colorist — and if the answer is something that should be here, propose it via the #debrief channel.",
      sources: [],
      confidence: 'none',
      quickRef: null,
    };
  }

  const { answer, sources, confidence, quickRef } = synthesizeAnswer(question, scoredArticles);

  return {
    unanswerable: false,
    answer,
    sources,
    confidence,
    quickRef,
  };
}

// ── Category Filter ───────────────────────────────────────────────────────────
export function filterByCategory(categoryId) {
  if (!categoryId || categoryId === 'all') return TUNNEL_KB;
  return TUNNEL_KB.filter(a => a.category === categoryId);
}

// ── Full-text Search Filter (for search bar) ──────────────────────────────────
export function searchKnowledgeBase(query) {
  if (!query || query.trim().length < 2) return TUNNEL_KB;
  const q = query.toLowerCase();
  return TUNNEL_KB.filter(article =>
    article.title.toLowerCase().includes(q) ||
    article.summary.toLowerCase().includes(q) ||
    (article.tags || []).some(t => t.toLowerCase().includes(q)) ||
    (article.canonicalRules || []).some(r => r.toLowerCase().includes(q)) ||
    article.chapterTitle.toLowerCase().includes(q) ||
    article.category.toLowerCase().includes(q)
  );
}
