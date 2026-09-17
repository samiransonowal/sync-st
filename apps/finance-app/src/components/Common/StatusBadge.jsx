import React from 'react';

export default function StatusBadge({ status, tdsStatus }) {
  const norm = (status || 'unpaid').toLowerCase();

  let badgeColor = 'text-slate-400 bg-slate-800/60 border-slate-700';
  let label = status || 'Draft';

  if (norm === 'paid' || norm === 'used') {
    badgeColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    label = norm === 'used' ? 'Used' : 'Paid';
  } else if (norm === 'unpaid') {
    badgeColor = 'text-rose-400 bg-rose-500/10 border-rose-500/30';
    label = 'Unpaid';
  } else if (norm === 'partial') {
    badgeColor = 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    label = 'Partial';
  } else if (norm === 'open') {
    badgeColor = 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    label = 'Open';
  } else if (norm === 'converted') {
    badgeColor = 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30';
    label = 'Converted';
  }

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${badgeColor}`}>
        {label}
      </span>
      {tdsStatus === 'TDS_NOT_DEDUCTED' && (
        <span 
          title="Client did not deduct TDS on this payment" 
          className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 cursor-help"
        >
          ⚠️ No TDS
        </span>
      )}
    </div>
  );
}
