export const SUBMISSION_VERSIONS = [
  { id: 'v01', label: 'v01 — First Review Cut' },
  { id: 'v02', label: 'v02 — Revision Pass' },
  { id: 'v03', label: 'v03 — Final Color Master' },
  { id: 'clean', label: 'Clean Feed / Textless Master' },
  { id: 'social_916', label: 'Social Cutdown (9:16 Vertical)' },
  { id: 'social_11', label: 'Social Cutdown (1:1 Square)' },
  { id: 'conform', label: 'Conform / Online Assembly Pass' },
  { id: 'custom', label: 'Custom Version' }
];

export const WHATSAPP_TEMPLATES = [
  {
    id: 'first_cut',
    title: '🎬 First Review Cut',
    description: 'Standard polite greeting for initial grade/conform review with timecode request.',
    format: ({ projectName, versionTag, artistName, link, notes }) => 
`🎬 *STUDIO TUNNEL — WORK REVIEW*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 *Project:* ${projectName}
🎞️ *Version:* ${versionTag || 'v01 Review'}
🎨 *Lead Artist:* ${artistName}

🔗 *Review Link:*
${link}

${notes ? `📝 *Notes / Scope:*\n${notes}\n\n` : ''}Kindly review and share your timecoded feedback / approval.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
_Delivered via Studio Tunnel Operations Pipeline_`
  },
  {
    id: 'revision_pass',
    title: '🔄 Revision Pass',
    description: 'Highlights updated version with specific client notes addressed.',
    format: ({ projectName, versionTag, artistName, link, notes }) => 
`🔄 *STUDIO TUNNEL — UPDATED CUT / REVISION*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 *Project:* ${projectName}
🎞️ *Version:* ${versionTag || 'v02 Revision'}
🎨 *Lead Artist:* ${artistName}

🔗 *Review Link:*
${link}

${notes ? `✨ *Changes Addressed:*\n${notes}\n\n` : ''}Please inspect the updated pass and let us know if we're good to lock for final masters.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
_Studio Tunnel Operations Team_`
  },
  {
    id: 'final_master',
    title: '🏆 Final Color Master Delivery',
    description: 'Formal delivery template for final high-res graded ProRes/DCP masters and deliverables.',
    format: ({ projectName, versionTag, artistName, link, notes }) => 
`🏆 *STUDIO TUNNEL — FINAL MASTER DELIVERY*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 *Project:* ${projectName}
🎞️ *Deliverable:* ${versionTag || 'Final Master Package'}
🎨 *Colorist / Online:* ${artistName}

📦 *Master Download Link:*
${link}

${notes ? `📋 *Delivery Specs / Notes:*\n${notes}\n\n` : ''}✅ Color grading & mastering locked and rendered to client delivery specs.
Thank you for collaborating with Studio Tunnel!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━`
  },
  {
    id: 'clean_feed',
    title: '📐 Clean Feed / Textless Master',
    description: 'Delivery text for textless background plates, clean graphics, and localization deliverables.',
    format: ({ projectName, versionTag, artistName, link, notes }) => 
`📐 *STUDIO TUNNEL — CLEAN FEED DELIVERABLES*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 *Project:* ${projectName}
🎞️ *Asset:* Clean Textless Master Plates
🎨 *Artist:* ${artistName}

🔗 *Download Link:*
${link}

${notes ? `📝 *Notes:*\n${notes}\n\n` : ''}Includes full uninterrupted clean background passes for localization / packaging.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━`
  },
  {
    id: 'social_cutdowns',
    title: '📱 Social Cutdowns (9:16 / 1:1)',
    description: 'Delivery template for social media cutdowns, reels, and vertical adaptations.',
    format: ({ projectName, versionTag, artistName, link, notes }) => 
`📱 *STUDIO TUNNEL — SOCIAL MEDIA CUTDOWNS*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 *Project:* ${projectName}
🎞️ *Format:* ${versionTag || 'Social Cutdown Package (9:16 / 1:1)'}
🎨 *Artist:* ${artistName}

🔗 *Download / Review Link:*
${link}

${notes ? `📝 *Notes:*\n${notes}\n\n` : ''}Framed, graded, and optimized for social distribution channels.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━`
  },
  {
    id: 'quick_check',
    title: '⚡ Quick Mobile / Director Check',
    description: 'Short and concise message for instant phone check by director or producer.',
    format: ({ projectName, versionTag, artistName, link, notes }) => 
`⚡ *Studio Tunnel Quick Preview:*
*${projectName}* (${versionTag || 'Latest Cut'}) by *${artistName}*

🔗 Link: ${link}
${notes ? `Notes: ${notes}` : ''}

Let us know your quick thoughts!`
  }
];
