import React from 'react';
import { Shield } from 'lucide-react';

export default function Settings() {
  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-[#080810] text-[#f0f0ff] max-w-4xl">
      <div className="pb-4 border-b border-white/5">
        <h1 className="text-2xl font-bold text-white tracking-tight">Comptroller Settings</h1>
        <p className="text-xs text-slate-400 mt-1">Corporate entity details, GST setup, and bank account mapping</p>
      </div>

      <div className="bg-[#111122] border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Shield size={16} className="text-purple-400" />
          <span>Corporate Legal Entity</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-slate-400 mb-1">Company Registered Name</label>
            <input
              type="text"
              readOnly
              value="CINELOOM POSTWORKS PRIVATE LIMITED"
              className="w-full bg-[#18182e] border border-white/10 rounded-lg p-2.5 text-white font-semibold"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Operating Brand</label>
            <input
              type="text"
              readOnly
              value="Studio Tunnel"
              className="w-full bg-[#18182e] border border-white/10 rounded-lg p-2.5 text-white font-semibold"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1">GSTIN</label>
            <input
              type="text"
              readOnly
              value="27AABCC1234F1Z5"
              className="w-full bg-[#18182e] border border-white/10 rounded-lg p-2.5 text-purple-300 font-mono font-bold"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1">PAN</label>
            <input
              type="text"
              readOnly
              value="AABCC1234F"
              className="w-full bg-[#18182e] border border-white/10 rounded-lg p-2.5 text-purple-300 font-mono font-bold"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
