import React, { useState } from 'react';
import { Bell, Check, Copy, ExternalLink, Smartphone, Sparkles, X, ShieldAlert, Video, MessageSquare } from 'lucide-react';
import { getUserNtfyTopic, NTFY_TOPICS, sendDirectUserAlert, sendNtfyNotification } from '../services/ntfy';

export const NtfyModal = ({ isOpen, onClose, currentUserProfile, showToast }) => {
  const [copiedKey, setCopiedKey] = useState(null);
  const [testing, setTesting] = useState(false);

  if (!isOpen || !currentUserProfile) return null;

  const personalTopic = getUserNtfyTopic(currentUserProfile.id);
  const personalUrl = `https://ntfy.sh/${personalTopic}`;

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    if (showToast) showToast('Copied ntfy link to clipboard!', 'success');
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleSendTest = async (topic, label) => {
    setTesting(true);
    try {
      await sendNtfyNotification({
        topic,
        title: `🔔 Test Alert: ${label}`,
        message: `Hello ${currentUserProfile.name}! Your ntfy push notification connection is working 100%.`,
        tags: 'tada,bell,rocket',
        priority: 'high',
      });
      if (showToast) showToast(`Test notification sent to ${topic}!`, 'success');
    } catch (e) {
      if (showToast) showToast('Failed to send test notification.', 'error');
    } finally {
      setTesting(false);
    }
  };

  const CHANNELS = [
    {
      id: 'personal',
      title: '👤 My Personal Channel',
      desc: 'Task assignments, handover alerts & personal mentions',
      topic: personalTopic,
      badge: 'Personal',
      badgeColor: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
    },
    {
      id: 'qc',
      title: '🎬 Line Producer & QC Feed',
      desc: 'Artist video render submissions, revision links & WhatsApp briefs',
      topic: NTFY_TOPICS.QC,
      badge: 'Production / QC',
      badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/30'
    },
    {
      id: 'ops',
      title: '📅 Studio Bookings & Operations',
      desc: 'Session scheduling, room allocations & milestone sign-offs',
      topic: NTFY_TOPICS.OPS,
      badge: 'Operations',
      badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
    },
    {
      id: 'team',
      title: '💬 Team Chat & Announcements',
      desc: 'Studio-wide communications & live crew chatter',
      topic: NTFY_TOPICS.TEAM,
      badge: 'Team',
      badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/30'
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 md:p-8 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
              <Bell size={24} className="animate-bounce" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white">Push Notifications Setup (ntfy)</h3>
              <p className="text-slate-400 text-xs mt-0.5">Receive instantaneous lock-screen push alerts on your phone or desktop.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 md:p-8 overflow-y-auto space-y-6 custom-scrollbar">
          {/* Quick Setup Instructions */}
          <div className="bg-gradient-to-br from-indigo-950/40 to-slate-950/60 border border-indigo-500/20 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-indigo-300 flex items-center gap-2">
                <Smartphone size={16} /> 3-Step Setup for Mobile & Desktop
              </span>
              <span className="text-[10px] font-bold bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full">
                Free · No Login Required
              </span>
            </div>
            <ol className="text-xs text-slate-300 space-y-2 list-decimal list-inside font-medium leading-relaxed">
              <li>
                Download the free <strong className="text-white">ntfy</strong> app on{' '}
                <a href="https://apps.apple.com/app/ntfy/id1625396347" target="_blank" rel="noreferrer" className="text-indigo-400 underline font-bold hover:text-indigo-300">iOS App Store</a>{' '}
                or <a href="https://play.google.com/store/apps/details?id=io.heckel.ntfy" target="_blank" rel="noreferrer" className="text-indigo-400 underline font-bold hover:text-indigo-300">Google Play Store</a>.
              </li>
              <li>
                Tap <strong className="text-white">+ (Subscribe)</strong> and enter your topic name below.
              </li>
              <li>
                You will instantly receive background push notifications whenever tasks, renders, or QC items are assigned to you!
              </li>
            </ol>
          </div>

          {/* Channels List */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Available Studio Topics</h4>
            {CHANNELS.map((ch) => {
              const channelUrl = `https://ntfy.sh/${ch.topic}`;
              const isCopied = copiedKey === ch.id;

              return (
                <div key={ch.id} className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-700 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-black text-white">{ch.title}</span>
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${ch.badgeColor}`}>
                        {ch.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">{ch.desc}</p>
                    <code className="text-xs font-mono font-bold text-indigo-400 bg-slate-900 px-2 py-0.5 rounded inline-block mt-1">
                      {ch.topic}
                    </code>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    <button
                      onClick={() => copyToClipboard(channelUrl, ch.id)}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border border-slate-700"
                      title="Copy URL"
                    >
                      {isCopied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                      <span>{isCopied ? 'Copied' : 'Copy Link'}</span>
                    </button>
                    <a
                      href={channelUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-2 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border border-indigo-500/30"
                      title="Open Web Channel"
                    >
                      <ExternalLink size={14} />
                      <span>Open</span>
                    </a>
                    <button
                      disabled={testing}
                      onClick={() => handleSendTest(ch.topic, ch.title)}
                      className="px-3 py-2 bg-emerald-950/30 hover:bg-emerald-600 text-emerald-400 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border border-emerald-500/30"
                      title="Send Test Push"
                    >
                      <Sparkles size={14} />
                      <span>Test</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-800 flex items-center justify-between bg-slate-950/40">
          <span className="text-[11px] text-slate-500 font-medium">
            Active User: <strong className="text-white">{currentUserProfile.name}</strong> ({currentUserProfile.role})
          </span>
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
