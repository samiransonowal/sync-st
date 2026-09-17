import React from 'react';

export default function StatusBar({ totalAmount = 0, balance = 0 }) {
  const formatCurrency = (val) => {
    return '₹ ' + Number(val || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  return (
    <div className="flex items-center justify-between px-6 py-3 bg-[#0d0d18] border-t border-white/10 text-xs font-semibold text-slate-300">
      <div>
        <span>Total Amount: </span>
        <span className="text-emerald-400 font-bold ml-1">{formatCurrency(totalAmount)}</span>
      </div>

      <div>
        <span>Balance: </span>
        <span className="text-rose-400 font-bold ml-1">{formatCurrency(balance)}</span>
      </div>
    </div>
  );
}
