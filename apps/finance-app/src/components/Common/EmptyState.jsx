import React from 'react';
import { FileText, Plus } from 'lucide-react';

export default function EmptyState({
  title = 'No records found',
  description = 'Add your first record or adjust your filters.',
  buttonText,
  onButtonClick,
  icon: Icon = FileText
}) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center px-4">
      {/* Visual illustration ring */}
      <div className="w-24 h-24 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-6 shadow-xl">
        <Icon size={40} className="text-purple-400" />
      </div>

      {title && (
        <h3 className="text-sm font-semibold text-slate-200 mb-1">
          {title}
        </h3>
      )}

      <p className="text-sm font-medium text-slate-300 max-w-md mb-2 leading-relaxed">
        {description}
      </p>

      {buttonText && onButtonClick && (
        <button
          onClick={onButtonClick}
          className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs shadow-lg transition-transform active:scale-95"
        >
          <Plus size={15} />
          <span>{buttonText}</span>
        </button>
      )}
    </div>
  );
}
