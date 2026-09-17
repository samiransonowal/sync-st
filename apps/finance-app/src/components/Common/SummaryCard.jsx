import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function SummaryCard({
  title = 'Total Sales Amount',
  amount = 0,
  trend = '100%',
  trendDirection = 'up', // 'up' | 'down'
  trendSubtext = '',
  leftSubLabel = 'Received',
  leftSubValue = 0,
  rightSubLabel = 'Balance',
  rightSubValue = 0
}) {
  const isUp = trendDirection === 'up';

  const formatCurrency = (val) => {
    return '₹ ' + Number(val || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  return (
    <div className="bg-[#121222] border border-white/10 rounded-xl p-4 shadow-lg min-w-[280px] max-w-sm">
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className="text-xs font-medium text-slate-400">{title}</span>
        {trend && (
          <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[11px] font-bold ${
            isUp ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'
          }`}>
            {trend}
            {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          </span>
        )}
      </div>

      <div className="text-2xl font-bold text-white tracking-tight my-1">
        {formatCurrency(amount)}
      </div>

      <div className="flex items-center gap-4 mt-2 text-xs text-slate-400 pt-2 border-t border-white/5">
        <div>
          <span>{leftSubLabel}: </span>
          <span className="font-semibold text-slate-200">{formatCurrency(leftSubValue)}</span>
        </div>
        {rightSubLabel && (
          <div>
            <span>{rightSubLabel}: </span>
            <span className="font-semibold text-slate-200">{formatCurrency(rightSubValue)}</span>
          </div>
        )}
      </div>

      {trendSubtext && (
        <div className="text-[10px] text-slate-500 mt-1">
          {trendSubtext}
        </div>
      )}
    </div>
  );
}
