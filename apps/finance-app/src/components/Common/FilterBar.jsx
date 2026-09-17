import React from 'react';
import { Calendar, ChevronDown, FileSpreadsheet, Printer, Search } from 'lucide-react';

export default function FilterBar({
  dateRangeLabel = 'This Financial Year',
  dateRange = '01/04/2026 To 31/03/2027',
  onDateRangeChange,
  firmLabel = 'All Firms',
  userLabel = 'All Users',
  onExportExcel,
  onPrint,
  searchTerm,
  onSearchChange,
  searchPlaceholder = 'Search in transactions...'
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-3 border-b border-white/5 text-xs text-slate-300">
      {/* Left Filter Options */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-slate-400 font-medium">Filter by :</span>

        {/* Date Preset Dropdown */}
        <div 
          onClick={onDateRangeChange}
          className="relative inline-flex items-center bg-[#18182c] border border-white/10 rounded-lg px-3 py-1.5 cursor-pointer hover:border-purple-500/50 transition-colors"
        >
          <span>{dateRangeLabel}</span>
          <ChevronDown size={14} className="ml-1.5 text-slate-400" />
        </div>

        {/* Date Range Display */}
        <div className="inline-flex items-center gap-1.5 bg-[#18182c] border border-white/10 rounded-lg px-3 py-1.5 text-slate-300">
          <Calendar size={13} className="text-purple-400" />
          <span>{dateRange}</span>
        </div>

        {/* Firm Filter */}
        <div className="inline-flex items-center bg-[#18182c] border border-white/10 rounded-lg px-3 py-1.5 cursor-pointer hover:border-purple-500/50 transition-colors">
          <span>{firmLabel}</span>
          <ChevronDown size={14} className="ml-1.5 text-slate-400" />
        </div>

        {/* User Filter */}
        <div className="inline-flex items-center bg-[#18182c] border border-white/10 rounded-lg px-3 py-1.5 cursor-pointer hover:border-purple-500/50 transition-colors">
          <span>{userLabel}</span>
          <ChevronDown size={14} className="ml-1.5 text-slate-400" />
        </div>

        {/* Search within view */}
        {onSearchChange && (
          <div className="relative inline-flex items-center ml-2">
            <Search size={13} className="absolute left-2.5 text-slate-500" />
            <input
              type="text"
              value={searchTerm || ''}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="bg-[#18182c] border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors w-48 sm:w-60"
            />
          </div>
        )}
      </div>

      {/* Right Action Icons (Excel & Print) */}
      <div className="flex items-center gap-3">
        {onExportExcel && (
          <button
            onClick={onExportExcel}
            className="flex items-center gap-1 text-slate-400 hover:text-emerald-400 transition-colors px-2 py-1 rounded"
            title="Export Excel Report"
          >
            <FileSpreadsheet size={15} className="text-emerald-500" />
            <span className="text-[11px] font-medium">Excel Report</span>
          </button>
        )}
        {onPrint && (
          <button
            onClick={onPrint}
            className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors px-2 py-1 rounded"
            title="Print View"
          >
            <Printer size={15} />
            <span className="text-[11px] font-medium">Print</span>
          </button>
        )}
      </div>
    </div>
  );
}
