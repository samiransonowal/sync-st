import React, { useState, useRef, useEffect, useCallback } from 'react';
import { BookOpen, Search, Sparkles, Send, X, ChevronDown, FileText, Database, Tag, ExternalLink, CheckCircle2, AlertCircle, Lightbulb, RotateCcw, MessageCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { TUNNEL_KB, CATEGORIES, SUGGESTED_PROMPTS } from '../data/tunnelKnowledgeDatabase.js';
import { queryKnowledgeBase, searchKnowledgeBase, filterByCategory } from '../services/tunnelAiService.js';

// ─────────────────────────────────────────────────────────────────────────────
// MARKDOWN RENDERER COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────
const mdComponents = {
  h1: ({ node, ...props }) => <h3 className="text-xl font-black text-white uppercase tracking-widest mt-6 mb-4" {...props} />,
  h2: ({ node, ...props }) => <h4 className="text-lg font-black text-indigo-400 uppercase tracking-widest mt-8 mb-4 border-b border-slate-800 pb-2" {...props} />,
  h3: ({ node, ...props }) => <h5 className="text-md font-bold text-emerald-400 mt-6 mb-2 uppercase tracking-wider text-xs" {...props} />,
  h4: ({ node, ...props }) => <h6 className="text-sm font-bold text-slate-200 mt-4 mb-2" {...props} />,
  p: ({ node, ...props }) => <p className="text-sm text-slate-400 leading-relaxed mb-4" {...props} />,
  ul: ({ node, ...props }) => <ul className="list-disc pl-5 space-y-2 mb-6 text-sm text-slate-400" {...props} />,
  ol: ({ node, ...props }) => <ol className="list-decimal pl-5 space-y-2 mb-6 text-sm text-slate-400" {...props} />,
  li: ({ node, ...props }) => <li className="pl-1" {...props} />,
  a: ({ node, ...props }) => <a className="text-indigo-400 hover:text-indigo-300 font-bold underline decoration-indigo-500/30 underline-offset-4" {...props} />,
  code: ({ node, inline, className, children, ...props }) =>
    inline ? (
      <code className="bg-slate-800/80 px-1.5 py-0.5 rounded text-indigo-300 font-mono text-xs border border-slate-700/50" {...props}>{children}</code>
    ) : (
      <div className="bg-slate-900/60 p-5 rounded-2xl font-mono text-xs border border-slate-800 mb-6 overflow-x-auto text-emerald-400 shadow-inner">
        <code {...props}>{children}</code>
      </div>
    ),
  strong: ({ node, ...props }) => <strong className="text-slate-200 font-bold" {...props} />,
  blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-indigo-500/50 pl-5 py-2 mb-6 italic text-slate-500 bg-slate-900/30 rounded-r-xl" {...props} />,
  table: ({ node, ...props }) => (
    <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl overflow-hidden mb-6 mt-4 w-full overflow-x-auto">
      <table className="w-full text-left text-xs whitespace-nowrap" {...props} />
    </div>
  ),
  thead: ({ node, ...props }) => <thead className="bg-slate-800/50 text-slate-500 font-black uppercase tracking-widest text-[10px]" {...props} />,
  th: ({ node, ...props }) => <th className="px-6 py-4" {...props} />,
  tbody: ({ node, ...props }) => <tbody className="divide-y divide-slate-800/50" {...props} />,
  tr: ({ node, ...props }) => <tr className="hover:bg-slate-800/20 transition-colors" {...props} />,
  td: ({ node, ...props }) => <td className="px-6 py-4 text-slate-300 font-medium" {...props} />,
  hr: ({ node, ...props }) => <hr className="border-slate-800 my-8 border-dashed" {...props} />,
};

// ─────────────────────────────────────────────────────────────────────────────
// QUICK REFERENCE TABLE CARD
// ─────────────────────────────────────────────────────────────────────────────
const QuickRefCard = ({ quickRef }) => {
  if (!quickRef || quickRef.type !== 'table') return null;
  return (
    <div className="mt-4 bg-slate-900/60 border border-slate-700/50 rounded-2xl overflow-hidden">
      <div className="bg-slate-800/50 px-4 py-2.5">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Quick Reference</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs whitespace-nowrap">
          <thead>
            <tr className="border-b border-slate-800">
              {quickRef.headers.map((h, i) => (
                <th key={i} className="px-4 py-3 text-left text-slate-500 font-black uppercase tracking-widest text-[10px]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {quickRef.rows.map((row, ri) => (
              <tr key={ri} className="border-b border-slate-800/40 hover:bg-slate-800/20 transition-colors">
                {row.map((cell, ci) => (
                  <td key={ci} className={`px-4 py-3 ${ci === 0 ? 'text-white font-bold font-mono' : 'text-slate-300'}`}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// AI ANSWER CARD
// ─────────────────────────────────────────────────────────────────────────────
const AiAnswerCard = ({ answer, sources, confidence, quickRef, unanswerable, onJumpToArticle }) => {
  const confidenceConfig = {
    high: { color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30', label: 'High confidence', icon: CheckCircle2 },
    medium: { color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30', label: 'Medium confidence', icon: AlertCircle },
    low: { color: 'text-slate-400', bg: 'bg-slate-700/30 border-slate-700', label: 'Partial match', icon: Lightbulb },
    none: { color: 'text-slate-400', bg: 'bg-slate-800/50 border-slate-700', label: 'Not found', icon: AlertCircle },
  };
  const conf = confidenceConfig[confidence] || confidenceConfig.none;
  const ConfIcon = conf.icon;

  return (
    <div className="animate-in slide-in-from-top-2 duration-300 bg-slate-900/80 border border-slate-700/60 rounded-3xl overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-500/10 via-slate-900/0 to-transparent px-6 py-4 border-b border-slate-800/60 flex items-center gap-3">
        <div className="p-1.5 bg-indigo-500/20 rounded-lg">
          <Sparkles size={16} className="text-indigo-400" />
        </div>
        <span className="font-black text-white text-sm uppercase tracking-widest">Tunnel AI</span>
        <div className={`ml-auto flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest ${conf.color}`}>
          <ConfIcon size={11} />
          {conf.label}
        </div>
      </div>

      {/* Answer body */}
      <div className="px-6 py-5">
        {unanswerable ? (
          <p className="text-slate-400 text-sm leading-relaxed italic">{answer}</p>
        ) : (
          <div className="prose prose-sm max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>{answer}</ReactMarkdown>
          </div>
        )}

        {quickRef && !unanswerable && <QuickRefCard quickRef={quickRef} />}
      </div>

      {/* Sources */}
      {sources && sources.length > 0 && (
        <div className="px-6 py-4 border-t border-slate-800/60">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2.5">Sources</p>
          <div className="flex flex-wrap gap-2">
            {sources.map(source => (
              <button
                key={source.id}
                onClick={() => onJumpToArticle && onJumpToArticle(source.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/60 border border-slate-700/50 rounded-xl text-xs font-bold text-indigo-400 hover:text-indigo-300 hover:border-indigo-500/40 hover:bg-indigo-500/10 transition-all duration-200 group"
              >
                <FileText size={11} />
                <span>Ch.{source.chapterCode} — {source.title}</span>
                <ExternalLink size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// KNOWLEDGE ARTICLE CARD (in the browsing view)
// ─────────────────────────────────────────────────────────────────────────────
const ArticleCard = ({ article, highlight, id }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Auto-open if this is the jumped-to article
  useEffect(() => {
    if (highlight) {
      setIsOpen(true);
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [highlight, id]);

  const chapterBadgeColors = {
    '01': 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    '02': 'bg-violet-500/15 text-violet-400 border-violet-500/30',
    '03': 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    '04': 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    '05': 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
    '06': 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    '07': 'bg-orange-500/15 text-orange-400 border-orange-500/30',
    '10': 'bg-slate-500/15 text-slate-400 border-slate-500/30',
    '00': 'bg-slate-500/15 text-slate-400 border-slate-500/30',
    'SOP': 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
  };
  const badgeClass = chapterBadgeColors[article.chapterCode] || 'bg-slate-500/15 text-slate-400 border-slate-500/30';

  return (
    <div
      id={id}
      className={`bg-slate-800/30 border transition-all duration-300 rounded-3xl overflow-hidden ${
        isOpen
          ? 'border-slate-700 ring-1 ring-slate-700/50 shadow-2xl bg-slate-800/50'
          : highlight
          ? 'border-indigo-500/60 ring-1 ring-indigo-500/30 shadow-indigo-500/10 shadow-xl'
          : 'border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
      }`}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-5 md:px-7 md:py-6 flex items-start justify-between group/btn text-left gap-4"
      >
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <div className={`mt-0.5 flex-shrink-0 px-2.5 py-1 rounded-lg border text-[10px] font-black uppercase tracking-widest ${badgeClass}`}>
            {article.chapterCode === 'SOP' ? 'SOP' : `Ch.${article.chapterCode}`}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className={`font-black uppercase tracking-widest text-sm transition-colors leading-snug ${isOpen ? 'text-white' : 'text-slate-300 group-hover/btn:text-white'}`}>
              {article.title}
            </h4>
            {!isOpen && (
              <p className="text-slate-500 text-xs font-medium mt-1 line-clamp-2 leading-relaxed">{article.summary}</p>
            )}
          </div>
        </div>
        <div className={`flex-shrink-0 mt-1 transition-transform duration-300 ${isOpen ? 'rotate-180 text-white' : 'text-slate-400 group-hover/btn:text-white'}`}>
          <ChevronDown size={18} />
        </div>
      </button>

      {isOpen && (
        <div className="px-5 pb-7 md:px-7 md:pb-8 animate-in slide-in-from-top-2 duration-300">
          <div className="h-px bg-slate-800/60 mb-6" />

          {/* Summary */}
          <p className="text-slate-400 text-sm leading-relaxed mb-5">{article.summary}</p>

          {/* Canonical Rules */}
          {article.canonicalRules && article.canonicalRules.length > 0 && (
            <div className="mb-5">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Canonical Rules</p>
              <div className="space-y-2">
                {article.canonicalRules.map((rule, i) => (
                  <div key={i} className={`flex items-start gap-3 px-4 py-3 rounded-xl text-sm ${
                    rule.startsWith('[PROPOSAL]')
                      ? 'bg-amber-500/8 border border-amber-500/20 text-amber-300/80'
                      : 'bg-slate-800/50 border border-slate-700/40 text-slate-300'
                  }`}>
                    <span className="flex-shrink-0 mt-0.5">
                      {rule.startsWith('[PROPOSAL]') ? '⚠️' : '✦'}
                    </span>
                    <span className="leading-relaxed font-medium">{rule}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Reference Table */}
          <QuickRefCard quickRef={article.quickRef} />

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-1.5">
              {article.tags.slice(0, 12).map(tag => (
                <span key={tag} className="flex items-center gap-1 px-2 py-0.5 bg-slate-800/60 border border-slate-700/40 rounded-lg text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <Tag size={9} />
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Full Chapter Content */}
          {article.rawContent && (
            <details className="mt-6">
              <summary className="cursor-pointer text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-slate-300 transition-colors select-none flex items-center gap-2">
                <FileText size={12} />
                View Full Chapter Content
              </summary>
              <div className="mt-5 pl-2 border-l-2 border-slate-800">
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>{article.rawContent}</ReactMarkdown>
              </div>
            </details>
          )}
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN KNOWLEDGE BASE COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
const KnowledgeBase = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [highlightedArticleId, setHighlightedArticleId] = useState(null);
  const [conversationHistory, setConversationHistory] = useState([]);
  const aiInputRef = useRef(null);
  const aiSectionRef = useRef(null);

  // Derived: filtered articles
  const filteredArticles = (() => {
    let articles = searchQuery.trim().length >= 2
      ? searchKnowledgeBase(searchQuery)
      : filterByCategory(activeCategory);
    return articles;
  })();

  const handleAiSubmit = useCallback(async (question) => {
    const q = (question || aiQuestion).trim();
    if (!q || aiLoading) return;

    setAiLoading(true);
    setAiResult(null);
    setHighlightedArticleId(null);

    // Add to conversation history
    setConversationHistory(prev => [...prev, { role: 'user', text: q }]);

    try {
      const result = await queryKnowledgeBase(q);
      setAiResult(result);
      setConversationHistory(prev => [...prev, { role: 'ai', ...result }]);
    } catch (err) {
      setAiResult({
        unanswerable: true,
        answer: "Something went wrong. Please try again.",
        sources: [],
        confidence: 'none',
        quickRef: null,
      });
    } finally {
      setAiLoading(false);
      setAiQuestion('');
    }
  }, [aiQuestion, aiLoading]);

  const handleJumpToArticle = useCallback((articleId) => {
    setSearchQuery('');
    setActiveCategory('all');
    setHighlightedArticleId(articleId);
    // Scroll to article
    setTimeout(() => {
      const el = document.getElementById(`kb-article-${articleId}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }, []);

  const handleClearAi = () => {
    setAiResult(null);
    setAiQuestion('');
    setHighlightedArticleId(null);
    setConversationHistory([]);
    aiInputRef.current?.focus();
  };

  return (
    <div className="animate-in fade-in space-y-8">

      {/* ── PAGE HEADER ─────────────────────────────────────────────────────── */}
      <header className="flex flex-col sm:flex-row sm:items-end gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-white flex items-center gap-3">
            <BookOpen className="text-indigo-400 flex-shrink-0" />
            Knowledge Base &amp; SOPs
          </h2>
          <p className="text-slate-400 font-medium text-sm md:text-base mt-1">
            The Tunnel Book · Studio SOPs · Technical Manuals — powered by Tunnel AI
          </p>
        </div>
        <div className="sm:ml-auto flex items-center gap-3 flex-shrink-0">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
            <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">
              {TUNNEL_KB.length} Articles Indexed
            </span>
          </div>
        </div>
      </header>

      {/* ── TUNNEL AI ASSISTANT ─────────────────────────────────────────────── */}
      <div ref={aiSectionRef} className="bg-gradient-to-br from-indigo-500/10 via-slate-900/80 to-slate-900/80 border border-indigo-500/20 rounded-3xl p-6 md:p-8 shadow-xl">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 bg-indigo-500/20 rounded-xl">
            <Sparkles size={22} className="text-indigo-400" />
          </div>
          <div>
            <h3 className="font-black text-white uppercase tracking-widest text-base">Tunnel AI Assistant</h3>
            <p className="text-slate-500 text-xs font-medium mt-0.5">Ask any question about studio workflow, storage, colorist standards, delivery specs or SOPs.</p>
          </div>
          {aiResult && (
            <button
              onClick={handleClearAi}
              className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-slate-400 hover:text-white text-xs font-bold border border-slate-700 hover:border-slate-500 rounded-xl transition-all duration-200"
            >
              <RotateCcw size={12} />
              Clear
            </button>
          )}
        </div>

        {/* AI Input */}
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <MessageCircle size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            <input
              ref={aiInputRef}
              type="text"
              value={aiQuestion}
              onChange={e => setAiQuestion(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAiSubmit(); } }}
              placeholder="e.g. Where do raw camera trims go? What does a red marker mean?"
              className="w-full pl-10 pr-4 py-3.5 bg-slate-800/70 border border-slate-700 rounded-2xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all"
            />
          </div>
          <button
            onClick={() => handleAiSubmit()}
            disabled={!aiQuestion.trim() || aiLoading}
            className="flex items-center gap-2 px-5 py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed text-white font-black rounded-2xl transition-all duration-200 flex-shrink-0"
          >
            {aiLoading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Send size={16} />
            )}
            <span className="hidden sm:inline">Ask</span>
          </button>
        </div>

        {/* Suggested Prompts (shown when no result) */}
        {!aiResult && !aiLoading && (
          <div className="mt-4">
            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-3">Suggested questions</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_PROMPTS.map((p, i) => (
                <button
                  key={i}
                  onClick={() => { setAiQuestion(p.text); setTimeout(() => handleAiSubmit(p.text), 50); }}
                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-800/60 border border-slate-700/60 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:border-slate-500 hover:bg-slate-800 transition-all duration-200"
                >
                  <span>{p.icon}</span>
                  {p.text}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* AI Loading */}
        {aiLoading && (
          <div className="mt-5 flex items-center gap-3 text-slate-400 text-sm">
            <div className="w-4 h-4 border-2 border-indigo-500/40 border-t-indigo-400 rounded-full animate-spin" />
            <span className="font-medium">Searching The Tunnel Book…</span>
          </div>
        )}

        {/* AI Result */}
        {aiResult && !aiLoading && (
          <div className="mt-5">
            <AiAnswerCard {...aiResult} onJumpToArticle={handleJumpToArticle} />
          </div>
        )}
      </div>

      {/* ── SEARCH & CATEGORY FILTER ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setHighlightedArticleId(null); }}
            placeholder="Search articles, rules, tags, storage pools…"
            className="w-full pl-10 pr-10 py-3 bg-slate-900 border border-slate-800 rounded-2xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors">
              <X size={15} />
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => { setActiveCategory(cat.id); setSearchQuery(''); setHighlightedArticleId(null); }}
              className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 ${
                activeCategory === cat.id && !searchQuery
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800/60 border border-slate-700/60 text-slate-400 hover:text-white hover:border-slate-500'
              }`}
            >
              <span>{cat.icon}</span>
              <span className="hidden md:inline">{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── RESULTS COUNT ───────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">
          {searchQuery
            ? `${filteredArticles.length} result${filteredArticles.length !== 1 ? 's' : ''} for "${searchQuery}"`
            : `${filteredArticles.length} article${filteredArticles.length !== 1 ? 's' : ''}`
          }
        </p>
        {(searchQuery || activeCategory !== 'all') && (
          <button
            onClick={() => { setSearchQuery(''); setActiveCategory('all'); setHighlightedArticleId(null); }}
            className="text-xs font-bold text-slate-500 hover:text-indigo-400 transition-colors flex items-center gap-1.5"
          >
            <RotateCcw size={12} />
            Reset
          </button>
        )}
      </div>

      {/* ── ARTICLE LIST ────────────────────────────────────────────────────── */}
      {filteredArticles.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <Database size={40} className="mx-auto mb-4 opacity-30" />
          <p className="font-bold text-sm">No articles found for "<span className="text-slate-400">{searchQuery}</span>"</p>
          <p className="text-xs mt-1 font-medium">Try a different keyword or use Tunnel AI above to ask your question.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredArticles.map(article => (
            <ArticleCard
              key={article.id}
              id={`kb-article-${article.id}`}
              article={article}
              highlight={highlightedArticleId === article.id}
            />
          ))}
        </div>
      )}



    </div>
  );
};

export default KnowledgeBase;
// Backward-compat alias
export { KnowledgeBase as SOPGuides };
