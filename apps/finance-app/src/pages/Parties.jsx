import React, { useState, useEffect } from 'react';
import { Phone, Mail } from 'lucide-react';
import { subscribeToOpsProjects, extractPartiesFromProjects } from '../services/opsAppBridge';

export default function Parties() {
  const [parties, setParties] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const unsub = subscribeToOpsProjects((projects) => {
      const extracted = extractPartiesFromProjects(projects);
      setParties(extracted);
    });
    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, []);

  const filtered = parties.filter(p =>
    (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.gstin || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-[#080810] text-[#f0f0ff]">
      <div className="flex items-center justify-between pb-4 border-b border-white/5">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Parties (Clients & Vendors)</h1>
          <p className="text-xs text-slate-400 mt-1">Live customer master linked to Studio Tunnel projects</p>
        </div>

        <div className="w-72">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search party by name or GST..."
            className="w-full bg-[#141424] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((party) => (
          <div key={party.id} className="bg-[#111122] border border-white/10 rounded-2xl p-5 shadow-lg space-y-3">
            <div className="flex items-start justify-between">
              <h3 className="text-sm font-bold text-white leading-tight">{party.name}</h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300">
                Customer
              </span>
            </div>

            <div className="space-y-1.5 text-xs text-slate-400">
              {party.phone && (
                <div className="flex items-center gap-2">
                  <Phone size={12} className="text-purple-400" />
                  <span>{party.phone}</span>
                </div>
              )}
              {party.email && (
                <div className="flex items-center gap-2">
                  <Mail size={12} className="text-purple-400" />
                  <span>{party.email}</span>
                </div>
              )}
              {party.gstin && (
                <div className="text-[11px] font-mono text-slate-300 pt-1">
                  GSTIN: <span className="font-bold text-white">{party.gstin}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
