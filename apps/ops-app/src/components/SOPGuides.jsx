import React, { useState } from 'react';
import { BookOpen, ShieldAlert, Timer, Activity, AlertCircle, Crown, Briefcase, HeartHandshake, EyeOff, Zap, PhoneOff, MessageCircle, Monitor, Layers, CheckCircle2, Volume2, HardDrive, Clock, ChevronDown, ChevronRight, FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import guideMd from '../../README/guide.md?raw';
import startMd from '../../README/start.md?raw';
import techStackMd from '../../README/tech-stack.md?raw';
import deployMd from '../../README/deploy.md?raw';
import credMd from '../../README/cred.md?raw';

const shiftData = [
  { name: 'Yash Soni', studio: 'Studio 01', color: 'studio01', left: 27.08, width: 37.5, label: '11:30A — 8:30P' },
  { name: 'Sujith Vijayan', studio: 'Studio 02', color: 'studio02', left: 29.17, width: 37.5, label: '12:00P — 9:00P' },
  { name: 'Manoj Sahu', studio: 'Studio 03', color: 'studio03', left: 22.92, width: 37.5, label: '10:30A — 7:30P' },
  { name: 'Samiran Sonowal', studio: 'Studio 03', color: 'studio03', left: 43.75, width: 37.5, label: '3:30P — 12:30A' },
  { name: 'Conformist 1', studio: 'Conform', color: 'conform', left: 20.83, width: 37.5, label: '10:00A — 7:00P' },
  { name: 'Conformist 2', studio: 'Conform', color: 'conform', left: 58.33, width: 37.5, label: '7:00P — 4:00A' },
  { name: 'Asst. Colorists', studio: 'Shared / Dedicated', color: 'assist', left: 20.83, width: 37.5, label: 'Various 9-hr shifts' },
  { name: 'Line Producers', studio: 'Operations', color: 'operations', left: 27.08, width: 37.5, label: '11:30A — 8:30P' },
];

const timelineHours = ['5A','6A','7A','8A','9A','10A','11A','12P','1P','2P','3P','4P','5P','6P','7P','8P','9P','10P','11P','12A','1A','2A','3A','4A'];

const barColors = {
  studio01: 'bg-indigo-500/[.35] border border-indigo-500/50',
  studio02: 'bg-emerald-500/[.30] border border-emerald-500/[.45]',
  studio03: 'bg-amber-500/[.30] border border-amber-500/[.45]',
  conform: 'bg-cyan-400/[.25] border border-cyan-400/40',
  assist: 'bg-purple-500/[.30] border border-purple-500/[.45]',
  operations: 'bg-rose-500/[.25] border border-rose-500/40',
};

const legendItems = [
  { label: 'Studio 01', color: 'bg-indigo-500/50' },
  { label: 'Studio 02', color: 'bg-emerald-500/50' },
  { label: 'Studio 03', color: 'bg-amber-500/50' },
  { label: 'Conform', color: 'bg-cyan-400/[.45]' },
  { label: 'Assist', color: 'bg-purple-500/50' },
  { label: 'Operations', color: 'bg-rose-500/[.45]' },
];

// Generate grid lines: 24 hour lines + 24 half-hour lines
const gridLines = [];
for (let i = 0; i <= 24; i++) {
  gridLines.push({ pct: (i / 24) * 100, type: 'hour' });
  if (i < 24) gridLines.push({ pct: ((i + 0.5) / 24) * 100, type: 'half' });
}

const mdComponents = {
  h1: ({node, ...props}) => <h3 className="text-xl font-black text-white uppercase tracking-widest mt-6 mb-4" {...props} />,
  h2: ({node, ...props}) => <h4 className="text-lg font-black text-indigo-400 uppercase tracking-widest mt-8 mb-4 border-b border-slate-800 pb-2 flex items-center gap-2" {...props} />,
  h3: ({node, ...props}) => <h5 className="text-md font-bold text-emerald-400 mt-6 mb-2 uppercase tracking-wider text-xs" {...props} />,
  h4: ({node, ...props}) => <h6 className="text-sm font-bold text-slate-200 mt-4 mb-2" {...props} />,
  p: ({node, ...props}) => <p className="text-sm text-slate-400 leading-relaxed mb-4" {...props} />,
  ul: ({node, ...props}) => <ul className="list-disc pl-5 space-y-2 mb-6 text-sm text-slate-400" {...props} />,
  ol: ({node, ...props}) => <ol className="list-decimal pl-5 space-y-2 mb-6 text-sm text-slate-400" {...props} />,
  li: ({node, ...props}) => <li className="pl-1" {...props} />,
  a: ({node, ...props}) => <a className="text-indigo-400 hover:text-indigo-300 font-bold underline decoration-indigo-500/30 underline-offset-4" {...props} />,
  code: ({node, inline, className, children, ...props}) => {
    return inline ? (
      <code className="bg-slate-800/80 px-1.5 py-0.5 rounded text-indigo-300 font-mono text-xs border border-slate-700/50" {...props}>{children}</code>
    ) : (
      <div className="bg-slate-900/60 p-5 rounded-2xl font-mono text-xs border border-slate-800 mb-6 overflow-x-auto text-emerald-400 shadow-inner">
        <code {...props}>{children}</code>
      </div>
    )
  },
  strong: ({node, ...props}) => <strong className="text-slate-200 font-bold" {...props} />,
  blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-indigo-500/50 pl-5 py-2 mb-6 italic text-slate-500 bg-slate-900/30 rounded-r-xl" {...props} />,
  table: ({node, ...props}) => (
    <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl overflow-hidden mb-6 mt-4 w-full overflow-x-auto">
      <table className="w-full text-left text-xs whitespace-nowrap" {...props} />
    </div>
  ),
  thead: ({node, ...props}) => <thead className="bg-slate-800/50 text-slate-500 font-black uppercase tracking-widest text-[10px]" {...props} />,
  th: ({node, ...props}) => <th className="px-6 py-4" {...props} />,
  tbody: ({node, ...props}) => <tbody className="divide-y divide-slate-800/50" {...props} />,
  tr: ({node, ...props}) => <tr className="hover:bg-slate-800/20 transition-colors" {...props} />,
  td: ({node, ...props}) => <td className="px-6 py-4 text-slate-300 font-medium" {...props} />,
  hr: ({node, ...props}) => <hr className="border-slate-800 my-8 border-dashed" {...props} />
};

const SOPGuides = () => {
  return (
    <div className="animate-in fade-in space-y-8">
      <header>
        <h2 className="text-2xl md:text-3xl font-black text-white flex items-center">
          <BookOpen className="mr-3 text-indigo-400" /> Studio Guidebook & SOP
        </h2>
        <p className="text-slate-400 font-medium text-sm md:text-base">Complete Standard Operating Procedures for Cineloom Postworks Private Limited.</p>
      </header>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-10 shadow-xl space-y-12 text-slate-300">

        <section>
          <div className="flex items-center mb-4">
            <div className="p-3 bg-indigo-500/10 rounded-xl mr-4 shrink-0">
              <ShieldAlert className="text-indigo-400" size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-white uppercase tracking-widest">Introduction</h3>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Core Environment Rules</p>
            </div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 italic font-medium">
            "Studio Tunnel is a creative environment. This SOP defines expected behavior, especially when clients or external collaborators are present in the studio or on virtual sessions. Everyone represents Tunnel, regardless of role or seniority. Clients should feel calm, confident, and taken care of the moment they step into the studio. If an action compromises that feeling, it does not belong in the studio."
          </div>
        </section>

        <section>
          <h3 className="text-lg font-black text-white uppercase tracking-widest mb-4 border-b border-slate-800 pb-2">1. Studio Layout</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700"><p className="font-bold text-white mb-1">STUDIO 01</p><p className="text-xs text-slate-400 uppercase tracking-widest">GRADE - HDR + SDR + 5.1</p></div>
            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700"><p className="font-bold text-white mb-1">STUDIO 02</p><p className="text-xs text-slate-400 uppercase tracking-widest">GRADE - SDR + Stereo</p></div>
            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700"><p className="font-bold text-white mb-1">STUDIO 03</p><p className="text-xs text-slate-400 uppercase tracking-widest">MASTERING & GRADE - SDR + HDR + Stereo</p></div>
            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700"><p className="font-bold text-white mb-1">ASSIST STUDIO</p><p className="text-xs text-slate-400 uppercase tracking-widest">COLOR GRADE - ASSIST 1 + ASSIST 2 / CONFORM 2</p></div>
            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700"><p className="font-bold text-white mb-1">DATA & CONFORM</p><p className="text-xs text-slate-400 uppercase tracking-widest">CONFORM 1</p></div>
          </div>
          <p className="mt-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Note: A maximum of 6 individuals can function simultaneously across 2 Grade Studios, 1 Multipurpose Room, 2 Assist Systems, and 1 Conform System.</p>
        </section>

        <section>
          <h3 className="text-lg font-black text-white uppercase tracking-widest mb-4 border-b border-slate-800 pb-2">2. Working Hours & Shifts</h3>

          {/* Timeline Container */}
          <div className="bg-slate-800/30 border border-slate-700/50 rounded-3xl p-6 md:p-8 overflow-x-auto custom-scrollbar relative">

            {/* Hour Header */}
            <div className="flex pl-[180px] md:pl-[200px] mb-1">
              {timelineHours.map(h => (
                <span key={h} className="flex-1 min-w-[40px] text-left text-[9px] font-extrabold text-slate-600 uppercase tracking-wider">{h}</span>
              ))}
            </div>

            {/* Rows with grid overlay */}
            <div className="relative">
              {/* Grid lines overlay */}
              <div className="absolute inset-0 left-[180px] md:left-[200px] pointer-events-none" style={{ zIndex: 0 }}>
                {gridLines.map((g, i) => (
                  <div
                    key={i}
                    className={`absolute top-0 bottom-0 w-px ${g.type === 'hour' ? 'bg-slate-700/40' : 'bg-slate-800/50'}`}
                    style={{ left: `${g.pct}%` }}
                  />
                ))}
              </div>

              {/* Shift rows */}
              {shiftData.map((s, idx) => (
                <div key={idx} className="flex items-center mb-1 min-h-[36px]">
                  <div className="w-[180px] md:w-[200px] shrink-0 pr-4">
                    <div className="text-xs font-bold text-slate-200">{s.name}</div>
                    <div className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">{s.studio}</div>
                  </div>
                  <div className="flex-1 relative h-[32px] bg-slate-950/30 rounded-lg">
                    <div
                      className={`absolute h-full rounded-md flex items-center justify-center text-[9px] font-extrabold text-white/80 tracking-wide transition-all hover:brightness-125 hover:scale-y-105 ${barColors[s.color]}`}
                      style={{ left: `${s.left}%`, width: `${s.width}%`, zIndex: 2 }}
                    >
                      {s.label}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 mt-5 pt-4 border-t border-slate-800/60">
              {legendItems.map(l => (
                <div key={l.label} className="flex items-center gap-1.5 text-[9px] font-extrabold text-slate-500 uppercase tracking-widest">
                  <div className={`w-3 h-3 rounded-sm ${l.color}`} />
                  {l.label}
                </div>
              ))}
            </div>
          </div>

          {/* Quick Notes */}
          <div className="mt-4 flex flex-wrap gap-3">
            {[
              { text: '8/9 Hour Shifts' },
              { text: '24x7 Open (Watchman → Pantry handoff)' },
              { text: 'Server Downtime: 5:00 – 9:00 AM', alert: true },
              { text: 'Reach Studio 15 mins before shift' },
            ].map((n, i) => (
              <div key={i} className="flex items-center gap-2 bg-slate-800/30 border border-slate-700/50 px-4 py-2.5 rounded-xl text-[10px] font-extrabold text-slate-400 uppercase tracking-wider hover:border-slate-600 transition-colors">
                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${n.alert ? 'bg-rose-500' : 'bg-indigo-500'}`} />
                {n.text}
              </div>
            ))}
          </div>
        </section>

        <section>
          <h3 className="text-lg font-black text-white uppercase tracking-widest mb-8 border-b border-slate-800 pb-2">3. Task Allocation</h3>

          <div className="space-y-12">
            {/* Senior Leadership Group */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-amber-500/10 rounded-lg">
                  <Crown className="text-amber-500" size={20} />
                </div>
                <h4 className="font-black text-white uppercase tracking-widest text-sm">Senior Leadership</h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  {
                    name: 'Yash Soni',
                    role: 'CEO',
                    tags: ['Color Grade', 'Creative Dev', 'Leadership', 'Public Facing', 'Technical Stability', 'AI Development'],
                    color: 'amber'
                  },
                  {
                    name: 'Samiran Sonowal',
                    role: 'COO',
                    tags: ['Operations', 'Finance', 'Accounts', 'HR', 'Color Grade', 'Client Satisfaction'],
                    color: 'amber'
                  },
                  {
                    name: 'Sujith Vijayan',
                    role: 'Sr. Colorist',
                    tags: ['Color Grade', 'Problem Solving', 'Work Logs', 'Work Allocation'],
                    color: 'indigo'
                  },
                  {
                    name: 'Manoj Sahu',
                    role: 'HOD - Grade',
                    tags: ['Assist Yash', 'Guide Assistants', 'Creative/Tech Dev', 'Resource Allocation'],
                    color: 'indigo'
                  }
                ].map((person) => (
                  <div key={person.name} className="bg-slate-800/40 border border-slate-700/50 p-6 rounded-2xl hover:bg-slate-800/60 transition-all border-l-4 border-l-amber-500/50">
                    <div className="flex justify-between items-start mb-2">
                      <h5 className="text-white font-bold text-lg leading-tight">{person.name}</h5>
                      <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-${person.color}-500/10 text-${person.color}-400 border border-${person.color}-500/20`}>
                        {person.role}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-4">
                      {person.tags.map(tag => (
                        <span key={tag} className="text-[10px] font-bold text-slate-400 bg-slate-900/50 px-2 py-1 rounded-md border border-slate-700/30">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Production & Support Group */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-indigo-500/10 rounded-lg">
                  <Briefcase className="text-indigo-400" size={20} />
                </div>
                <h4 className="font-black text-white uppercase tracking-widest text-sm">Production & Assistance</h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  {
                    role: 'Line Producer',
                    desc: 'Bookings, Work Logs, Problem Solving, Work Allocation, Resource Allocation, QC.',
                    tags: ['Logistics', 'QC', 'Client Liaison']
                  },
                  {
                    role: 'Assistant Colorist',
                    desc: 'Primary Colorist support, Technical balance, Delivery, Work Logs, Archival.',
                    tags: ['Technical', 'Support', 'Firesync']
                  },
                  {
                    role: 'All Leads / HODs',
                    desc: 'Cross-departmental Quality Control and standard project delivery enforcement.',
                    tags: ['Leadership', 'Quality Control']
                  }
                ].map((item) => (
                  <div key={item.role} className="bg-slate-800/20 border border-slate-800/50 p-6 rounded-2xl hover:border-indigo-500/30 transition-all group">
                    <h5 className="text-indigo-400 font-bold text-sm uppercase tracking-widest mb-3">{item.role}</h5>
                    <p className="text-slate-400 text-sm leading-relaxed mb-4">{item.desc}</p>
                    <div className="flex flex-wrap gap-2">
                      {item.tags.map(tag => (
                        <span key={tag} className="text-[10px] font-black text-indigo-300/60 uppercase tracking-widest">#{tag}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-black text-white uppercase tracking-widest mb-8 border-b border-slate-800 pb-2">4. General Conduct & Client Presence</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-slate-800/40 border border-slate-700/50 p-6 rounded-2xl hover:bg-slate-800/60 transition-all">
              <div className="bg-rose-500/10 w-fit p-3 rounded-xl mb-4">
                <HeartHandshake className="text-rose-400" size={24} />
              </div>
              <h4 className="font-bold text-white mb-2">Professional Behavior</h4>
              <ul className="text-slate-400 text-sm space-y-1.5 list-disc list-inside marker:text-rose-500/50">
                <li>Maintain a calm, respectful demeanor.</li>
                <li>No shouting or aggressive tones.</li>
                <li>Disagreements must be handled privately.</li>
                <li><span className="text-rose-400/80 font-bold italic">Humor is welcome, sarcasm is not.</span></li>
              </ul>
            </div>

            <div className="bg-slate-800/40 border border-slate-700/50 p-6 rounded-2xl hover:bg-slate-800/60 transition-all border-b-4 border-b-indigo-500/50">
              <div className="bg-indigo-500/10 w-fit p-3 rounded-xl mb-4">
                <EyeOff className="text-indigo-400" size={24} />
              </div>
              <h4 className="font-bold text-white mb-2">Client Presence Mode</h4>
              <ul className="text-slate-400 text-sm space-y-1.5 list-disc list-inside marker:text-indigo-500/50">
                <li>Maintain low-volume conversations.</li>
                <li>Always use <span className="text-indigo-400 font-bold">Team Chat</span> for coordination.</li>
                <li>Assistants must not contradict leads in front of clients.</li>
                <li>Internal technical panic is strictly prohibited.</li>
              </ul>
            </div>

            <div className="bg-slate-800/40 border border-slate-700/50 p-6 rounded-2xl hover:bg-slate-800/60 transition-all">
              <div className="bg-emerald-500/10 w-fit p-3 rounded-xl mb-4">
                <Zap className="text-emerald-400" size={24} />
              </div>
              <h4 className="font-bold text-white mb-2">Handling Pressure</h4>
              <ul className="text-slate-400 text-sm space-y-1.5 list-disc list-inside marker:text-emerald-500/50">
                <li>Do not react emotionally or assign blame publicly.</li>
                <li>Inform leads discreetly if something breaks.</li>
                <li>Keep a calm behavior to build trust.</li>
                <li><span className="text-emerald-400/80 font-bold">Panic erodes trust instantly.</span></li>
              </ul>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-2xl flex items-start gap-4 group hover:border-slate-700 transition-all">
              <div className="p-2 bg-slate-700 rounded-lg group-hover:bg-slate-600 transition-colors">
                <PhoneOff className="text-slate-300" size={20} />
              </div>
              <div>
                <span className="font-black text-white text-xs uppercase tracking-widest block mb-1">Phones & Food</span>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  Phones on silent. No loud calls. Eating should be discreet. Maintain a clean pantry environment.
                </p>
              </div>
            </div>

            <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-2xl flex items-start gap-4 group hover:border-slate-700 transition-all">
              <div className="p-2 bg-slate-700 rounded-lg group-hover:bg-slate-600 transition-colors">
                <MessageCircle className="text-slate-300" size={20} />
              </div>
              <div>
                <span className="font-black text-white text-xs uppercase tracking-widest block mb-1">Communication</span>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  Use "Day-to-Day" WhatsApp group. Line Producer is the primary PoC. All technical logs via Email.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-black text-white uppercase tracking-widest mb-4 border-b border-slate-800 pb-2">5. Conform Workflow</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-800/50 p-5 rounded-2xl border border-slate-700">
              <h4 className="font-bold text-white mb-3 flex items-center"><Timer size={16} className="mr-2 text-indigo-400" /> Short Format</h4>
              <ul className="list-disc list-inside space-y-1 text-slate-400 text-sm">
                <li>2 timelines to be prepared - with and without attributes.</li>
                <li>Trims with 50 frame handles.</li>
                <li>During trimming, copy footage, don't transcode unless requested.</li>
                <li>Once TRIMS are ready, import footage back to TRIMS folder and remove RAW.</li>
                <li>Double check Color Space Management. Use Presets.</li>
              </ul>
            </div>
            <div className="bg-slate-800/50 p-5 rounded-2xl border border-slate-700">
              <h4 className="font-bold text-white mb-3 flex items-center"><Activity size={16} className="mr-2 text-indigo-400" /> Long Format</h4>
              <ul className="list-disc list-inside space-y-1 text-slate-400 text-sm">
                <li>Only to be executed at night. Trim with 5/10 frame handles.</li>
                <li>Ensure beginning, middle, and end frame matches offline.</li>
                <li>Sizing to be matched. Avoid dynamic sizing (mark YELLOW).</li>
                <li>Conform issues (mark RED), VFX Scans (TEAL), Final VFX (GREEN), Old VFX (ORANGE).</li>
              </ul>
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-black text-white uppercase tracking-widest mb-8 border-b border-slate-800 pb-2">6. Assist Workflow</h3>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Commercials & TVC Card */}
            <div className="bg-slate-800/40 border border-slate-700/50 rounded-3xl p-8 hover:border-indigo-500/30 transition-all group overflow-hidden relative">
              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-indigo-500/10 rounded-2xl group-hover:bg-indigo-500/20 transition-colors">
                  <Monitor className="text-indigo-400" size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-white text-lg">Commercials & TVC</h4>
                  <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">High Pressure Protocol</span>
                </div>
              </div>

              <div className="space-y-6">
                {[
                  { title: 'The "Ready-to-Grade" Rule', text: 'Double-check conform against offline before Colorist enters.' },
                  { title: 'Technical Balancing', text: 'Transform to Rec.709 and balance exposure. No RAW Log images for clients.' },
                  { title: 'Hero Identification', text: 'Mark "Packshot" and "Key Brand Moment" with markers.' },
                  { title: 'Advanced Tools', text: 'Use Magic Mask sparingly. Cache/Render in place immediately.' },
                  { title: 'The Safety Rule', text: 'Track Power Windows 50 frames beyond clip edges for extensions.' },
                  { title: 'Delivery', text: '50 Frame handles. ProRes 4444/XQ. Strict Source File naming.' }
                ].map((item, idx) => (
                  <div key={idx} className="flex gap-4 group/item">
                    <span className="text-indigo-500/40 font-black text-xs mt-1 shrink-0">{String(idx + 1).padStart(2, '0')}</span>
                    <div>
                      <h5 className="text-white font-bold text-sm mb-1 group-hover/item:text-indigo-300 transition-colors">{item.title}</h5>
                      <p className="text-slate-400 text-xs leading-relaxed">{item.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Long-Format Projects Card */}
            <div className="bg-slate-800/40 border border-slate-700/50 rounded-3xl p-8 hover:border-emerald-500/30 transition-all group overflow-hidden relative">
              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-emerald-500/10 rounded-2xl group-hover:bg-emerald-500/20 transition-colors">
                  <Layers className="text-emerald-400" size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-white text-lg">Long-Format Projects</h4>
                  <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">Feature Focus</span>
                </div>
              </div>

              <div className="space-y-6">
                {[
                  { title: 'Philosophy', text: "Respect DoP's intent. Enhance, don't overwrite. Keep contrast." },
                  { title: 'Organization', text: 'Group by scene. Identify and grade "Hero" shot first.' },
                  { title: 'Look Management', text: 'Apply global look at Timeline/Group level. Fixed node trees.' },
                  { title: 'Balancing', text: 'Exposure first, color second. Watch scopes and cut transitions.' },
                  { title: 'Housekeeping', text: 'Keep render cache clean. Version up timelines daily.' }
                ].map((item, idx) => (
                  <div key={idx} className="flex gap-4 group/item">
                    <span className="text-emerald-500/40 font-black text-xs mt-1 shrink-0">{String(idx + 1).padStart(2, '0')}</span>
                    <div>
                      <h5 className="text-white font-bold text-sm mb-1 group-hover/item:text-emerald-300 transition-colors">{item.title}</h5>
                      <p className="text-slate-400 text-xs leading-relaxed">{item.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-black text-white uppercase tracking-widest mb-8 border-b border-slate-800 pb-2">7. Mastering & Deliverables</h3>

          <div className="bg-red-500/5 border border-red-500/20 p-6 rounded-3xl mb-10 group hover:bg-red-500/10 transition-colors">
            <div className="flex items-center gap-3 mb-2">
              <AlertCircle size={20} className="text-red-400 group-hover:scale-110 transition-transform" />
              <p className="text-sm font-black text-red-400 uppercase tracking-widest">Strict Protocol: Zero Margin for Error</p>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed">
              All final mastering tasks, timeline approvals, and render triggers must be routed through
              <span className="text-white font-bold ml-1">Samiran Sonowal</span> and
              <span className="text-white font-bold ml-1">Jay Dantara</span>.
              No master is to be delivered without direct sign-off.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-800/40 border border-slate-700/50 p-6 rounded-2xl md:col-span-2 flex flex-col md:flex-row gap-6 items-start">
              <div className="p-3 bg-indigo-500/10 rounded-xl">
                <CheckCircle2 className="text-indigo-400" size={24} />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-white mb-3">Pre-Mastering Checks</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-3">
                  {[
                    'Verify VFX via Difference blend',
                    'Consistent Output Blanking',
                    'Check Gamut Mapping',
                    'Verify 2-pop head/tail sync',
                    'Verify Audio Patching',
                    'No PTZR gaps'
                  ].map((check, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-tight">
                      <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                      {check}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-slate-800/40 border border-slate-700/50 p-6 rounded-2xl">
              <div className="flex items-center gap-3 mb-4">
                <Volume2 className="text-indigo-400" size={20} />
                <h4 className="font-bold text-white">Audio Channel Mapping</h4>
              </div>
              <div className="space-y-4">
                <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800/50">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] block mb-1">Stereo</span>
                  <p className="text-xs text-slate-300 font-bold underline decoration-indigo-500/30 underline-offset-4">Ch 1 Left + Right interleaved</p>
                </div>
                <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800/50">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] block mb-1">5.1 Surround (SMPTE)</span>
                  <p className="text-xs text-indigo-100 font-bold leading-relaxed">
                    L, R, C, LFE, Ls, Rs <br />
                    <span className="text-[10px] text-slate-500 font-medium block mt-1 italic tracking-normal">ProTools/Film order: L, C, R, Ls, Rs, LFE</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/40 border border-slate-700/50 p-6 rounded-2xl">
              <div className="flex items-center gap-3 mb-4">
                <HardDrive className="text-indigo-400" size={20} />
                <h4 className="font-bold text-white">Formats</h4>
              </div>
              <div className="space-y-8">
                {[
                  { label: 'DCP (Digital Cinema Package)', items: ['Theatrical Distribution', 'DCI XYZ Color Space', 'Strict ISDCF naming convention', 'Encrypted or Unencrypted'] },
                  { label: 'IMF (Interoperable Master Format)', items: ['OTT / Streaming (Netflix, Prime)', 'IMP Packages / CPLs', 'Spot Fixes: Supplemental Packages'] },
                  { label: 'DSM/DCDM (Digital Source Master - Archival Master)', items: ['Alpha Capable Formats Preferred', '16-bit EXR (HALF) - PIZ Compression', 'ProRes 4444 XQ', 'Textless Elements Reel at Tail'] }
                ].map(f => (
                  <div key={f.label} className="group/row">
                    <h5 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <div className="w-1.5 h-[2px] bg-indigo-500/50 rounded-full" />
                      {f.label}
                    </h5>
                    <ul className="space-y-1.5 ml-[3px] border-l border-slate-800/80 pl-4 py-0.5">
                      {f.items.map((item, idx) => (
                        <li key={idx} className="text-[11px] text-slate-400 font-bold group-hover/row:text-slate-300 transition-colors list-none relative flex items-center gap-2">
                          <div className="w-1 h-1 bg-slate-700 rounded-sm shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-black text-white uppercase tracking-widest mb-4 border-b border-slate-800 pb-2">8. Project Lifecycle</h3>
          <div className="flex flex-wrap gap-3">
            {['Project Intake', 'Internal briefing', 'Media prep', 'Creative execution', 'Client review', 'Revisions', 'Final delivery', 'Archival'].map((step, idx) => (
              <div key={idx} className="bg-slate-800 border border-slate-700 px-4 py-2 rounded-lg flex items-center">
                <span className="text-indigo-400 font-black mr-2">0{idx + 1}</span>
                <span className="text-xs font-bold text-white uppercase tracking-widest">{step}</span>
              </div>
            ))}
          </div>
        </section>

        <section id="app-guides" className="pt-8 border-t border-slate-800">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-indigo-500/10 rounded-xl shrink-0">
              <FileText className="text-indigo-400" size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-white uppercase tracking-widest leading-none">Tunnel Task Management Web App Guides</h3>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2">Technical Documentation & Internal Manuals</p>
            </div>
          </div>

          <div className="space-y-4">
            <DocumentationItem
              title="1. Application Philosophy & Logic"
              subtitle="Core pillars and workflow logic of the Tunnel system"
            >
              <div className="markdown-body">
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>{guideMd}</ReactMarkdown>
              </div>
            </DocumentationItem>

            <DocumentationItem
               title="2. Studio Tunnel: Quick Start & Troubleshooting"
               subtitle="Environment initialization and common fixes"
            >
               <div className="markdown-body">
                 <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>{startMd}</ReactMarkdown>
               </div>
            </DocumentationItem>

            <DocumentationItem
               title="3. Tech Stack (Developer Reference)"
               subtitle="Frameworks, libraries, and integration logic"
            >
               <div className="markdown-body">
                 <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>{techStackMd}</ReactMarkdown>
               </div>
            </DocumentationItem>

            <DocumentationItem
               title="4. Mandatory Firebase Deployment Workflow"
               subtitle="Strict stability sequence: Build → Preview → Promote"
            >
               <div className="markdown-body">
                 <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>{deployMd}</ReactMarkdown>
               </div>
            </DocumentationItem>

            <DocumentationItem
               title="5. Project Credentials & Ownership"
               subtitle="Identity mapping and deployment permissions"
            >
               <div className="markdown-body">
                 <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>{credMd}</ReactMarkdown>
               </div>
            </DocumentationItem>
          </div>
        </section>

      </div>
    </div>
  );
};

const DocumentationItem = ({ title, subtitle, children }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`bg-slate-800/30 border transition-all duration-300 rounded-3xl overflow-hidden ${isOpen ? 'border-slate-700 ring-1 ring-slate-700/50 shadow-2xl bg-slate-800/50' : 'border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-6 md:px-8 md:py-7 flex items-center justify-between group/btn text-left"
      >
        <div className="flex items-center gap-4">
          <div className={`p-2 rounded-lg transition-colors ${isOpen ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400 group-hover/btn:bg-slate-700'}`}>
            <FileText size={18} />
          </div>
          <div>
            <h4 className={`font-black uppercase tracking-widest text-sm transition-colors ${isOpen ? 'text-white' : 'text-slate-300 group-hover/btn:text-white'}`}>{title}</h4>
            {subtitle && <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">{subtitle}</p>}
          </div>
        </div>
        <div className={`transition-transform duration-300 ${isOpen ? 'rotate-180 text-white' : 'text-slate-400 group-hover/btn:text-white'}`}>
          <ChevronDown size={20} />
        </div>
      </button>

      {isOpen && (
        <div className="px-6 pb-8 md:px-8 md:pb-10 animate-in slide-in-from-top-2 duration-300">
          <div className="h-px bg-slate-800/60 mb-8 mx-0" />
          {children}
        </div>
      )}
    </div>
  );
};

export default SOPGuides;
