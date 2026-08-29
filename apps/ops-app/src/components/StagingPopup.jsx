import React from 'react';
import { X, Sparkles, AlertCircle, Terminal, HelpCircle, Activity, KanbanSquare, Calendar, Layers } from 'lucide-react';

export default function StagingPopup({ onClose }) {
  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-slate-900/90 border border-slate-800 rounded-[2.5rem] w-full max-w-2xl p-6 md:p-8 shadow-2xl relative overflow-hidden group">
        
        {/* Decorative background glow */}
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-all duration-700" />
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl group-hover:bg-rose-500/20 transition-all duration-700" />

        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-xl bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-white transition-all duration-200 border border-slate-700/50"
          aria-label="Close Announcement"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="flex items-center space-x-3 mb-6 relative">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 animate-pulse">
            <Sparkles size={24} />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-md">
              🧪 Staging Sandbox
            </span>
            <h3 className="text-2xl font-black text-white mt-2 tracking-tight">Active Staging Focus — v1.1.3</h3>
          </div>
        </div>

        {/* Description */}
        <p className="text-slate-400 font-medium text-sm md:text-base mb-6 leading-relaxed relative">
          Welcome to the dedicated Studio Tunnel sandbox environment. This project is completely decoupled from your production database, allowing safe, non-destructive testing of the following focus modules:
        </p>

        {/* Focus Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 relative">
          {/* Module 1 */}
          <div className="bg-slate-950/50 border border-slate-800/80 rounded-2xl p-4 flex items-start space-x-3 hover:border-slate-700 transition-colors">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <Activity size={16} />
            </div>
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-emerald-400 mb-1">Project Tracker</h4>
              <p className="text-[11px] text-slate-500 leading-normal">Interactive department hourly compiler, adjustable billing Cost Multipliers, and Invoice Copies.</p>
            </div>
          </div>

          {/* Module 2 */}
          <div className="bg-slate-950/50 border border-slate-800/80 rounded-2xl p-4 flex items-start space-x-3 hover:border-slate-700 transition-colors">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
              <Layers size={16} />
            </div>
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-indigo-400 mb-1">Historical Linker</h4>
              <p className="text-[11px] text-slate-500 leading-normal">Autoscan and manual search tools to bind unlinked past studio bookings directly to active projects.</p>
            </div>
          </div>

          {/* Module 3 */}
          <div className="bg-slate-950/50 border border-slate-800/80 rounded-2xl p-4 flex items-start space-x-3 hover:border-slate-700 transition-colors col-span-1 md:col-span-2">
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
              <Calendar size={16} />
            </div>
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-rose-400 mb-1">Studio Bookings</h4>
              <p className="text-[11px] text-slate-500 leading-normal">Decoupled project mapping via autocomplete <code>[Code] - [Name]</code> listings and high-contrast badges across week and month grids.</p>
            </div>
          </div>
        </div>

        {/* Footer info/actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-6 border-t border-slate-800 relative">
          <div className="flex items-center space-x-2 text-slate-500">
            <Terminal size={14} />
            <span className="text-[10px] font-bold uppercase tracking-wider font-mono">Environment: sandbox-tunnel</span>
          </div>
          <button 
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-600/15"
          >
            Acknowledge & Staging Proceed
          </button>
        </div>
      </div>
    </div>
  );
}
