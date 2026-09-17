import React from 'react';

const STUDIO_SERVICES = [
  { id: '1', name: 'Commercial Color Grading (Studio Session)', rate: 15000, unit: 'HRS', gst: 18 },
  { id: '2', name: 'Feature Film / Long Format Grading', rate: 120000, unit: 'PROJECT', gst: 18 },
  { id: '3', name: 'Assistant Colorist Support & Prep', rate: 3500, unit: 'HRS', gst: 18 },
  { id: '4', name: 'Conform & Online Finishing', rate: 4500, unit: 'HRS', gst: 18 },
  { id: '5', name: 'DCP Mastering & QC Validation', rate: 15000, unit: 'PROJECT', gst: 18 }
];

export default function Items() {
  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-[#080810] text-[#f0f0ff]">
      <div className="flex items-center justify-between pb-4 border-b border-white/5">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Services & Pricing Catalogue</h1>
          <p className="text-xs text-slate-400 mt-1">Standardized rates for grading, conform, and deliverables</p>
        </div>
      </div>

      <div className="bg-[#111122] border border-white/10 rounded-2xl overflow-hidden shadow-lg">
        <table className="w-full text-xs text-left">
          <thead>
            <tr className="bg-[#16162d] text-slate-400 font-semibold border-b border-white/10">
              <th className="py-3 px-4">Service Name</th>
              <th className="py-3 px-4">Unit</th>
              <th className="py-3 px-4 text-right">Standard Rate (INR)</th>
              <th className="py-3 px-4 text-center">Tax Regime</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {STUDIO_SERVICES.map(srv => (
              <tr key={srv.id} className="hover:bg-white/[0.02]">
                <td className="py-3 px-4 font-semibold text-white">{srv.name}</td>
                <td className="py-3 px-4 text-slate-400">{srv.unit}</td>
                <td className="py-3 px-4 text-right font-mono font-bold text-purple-300">
                  ₹{srv.rate.toLocaleString('en-IN')}
                </td>
                <td className="py-3 px-4 text-center">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300">
                    GST {srv.gst}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
