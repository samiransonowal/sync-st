import React, { useState } from 'react';
import {
  Home, Users, Package, ShoppingCart, Landmark, BookOpen,
  BarChart3, Settings, ChevronDown, ChevronRight, Search, Plus, FileText
} from 'lucide-react';

export default function Sidebar({
  activeTab,
  onSelectTab,
  onQuickAddSale,
  firmName = 'CINELOOM POSTWORKS PRIVATE LIMITED'
}) {
  const [isSaleOpen, setIsSaleOpen] = useState(true);
  const [isPurchaseOpen, setIsPurchaseOpen] = useState(false);

  const saleSubItems = [
    { id: 'sale_invoices', label: 'Sale Invoices', hasPlus: true },
    { id: 'estimates', label: 'Estimate/ Quotation', hasPlus: true },
    { id: 'proforma', label: 'Proforma Invoice', hasPlus: true },
    { id: 'payment_in', label: 'Payment-In', hasPlus: true },
    { id: 'sale_order', label: 'Sale Order', hasPlus: true },
    { id: 'delivery_challan', label: 'Delivery Challan', hasPlus: true },
    { id: 'credit_note', label: 'Sale Return/ Credit Note', hasPlus: true },
    { id: 'pos', label: 'Vyapar POS', badge: 'NEW' }
  ];

  const purchaseSubItems = [
    { id: 'purchase_bills', label: 'Purchase Bills', hasPlus: true },
    { id: 'payment_out', label: 'Payment-Out', hasPlus: true },
    { id: 'expenses', label: 'Expenses', hasPlus: true },
    { id: 'purchase_order', label: 'Purchase Order', hasPlus: true },
    { id: 'debit_note', label: 'Purchase Return/ Dr. Note', hasPlus: true }
  ];

  return (
    <aside className="w-56 bg-[#0c0c16] border-r border-white/10 flex flex-col h-full select-none no-print">
      {/* Quick Search Shortcut */}
      <div className="p-3">
        <button
          onClick={() => {}}
          className="w-full bg-[#18182c] hover:bg-[#20203a] border border-white/10 text-slate-400 hover:text-slate-200 rounded-lg px-3 py-2 flex items-center gap-2 text-xs transition-colors"
        >
          <Search size={13} className="text-slate-500" />
          <span>Open Anything (CMD+F)</span>
        </button>
      </div>

      {/* Nav List (Scrollable) */}
      <nav className="flex-1 overflow-y-auto px-2 space-y-0.5 text-xs">
        {/* Home / Dashboard */}
        <button
          onClick={() => onSelectTab('dashboard')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'dashboard'
              ? 'bg-purple-600/20 text-purple-300 font-semibold border-l-2 border-purple-500'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
          }`}
        >
          <Home size={15} />
          <span>Home</span>
        </button>

        {/* Parties */}
        <button
          onClick={() => onSelectTab('parties')}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'parties'
              ? 'bg-purple-600/20 text-purple-300 font-semibold border-l-2 border-purple-500'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
          }`}
        >
          <div className="flex items-center gap-3">
            <Users size={15} />
            <span>Parties</span>
          </div>
          <ChevronRight size={13} className="text-slate-500" />
        </button>

        {/* Items */}
        <button
          onClick={() => onSelectTab('items')}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'items'
              ? 'bg-purple-600/20 text-purple-300 font-semibold border-l-2 border-purple-500'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
          }`}
        >
          <div className="flex items-center gap-3">
            <Package size={15} />
            <span>Items</span>
          </div>
          <Plus size={13} className="text-slate-500" />
        </button>

        {/* SALE (Expandable Group) */}
        <div>
          <button
            onClick={() => setIsSaleOpen(!isSaleOpen)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-slate-300 font-medium hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-3">
              <FileText size={15} className="text-purple-400" />
              <span>Sale</span>
            </div>
            {isSaleOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>

          {isSaleOpen && (
            <div className="pl-6 pr-1 py-1 space-y-0.5 border-l border-white/5 ml-4 my-0.5">
              {saleSubItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-[11px] transition-colors ${
                    activeTab === item.id
                      ? 'bg-purple-600/25 text-purple-200 font-bold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`}
                >
                  <span className="truncate">{item.label}</span>
                  {item.hasPlus && (
                    <span 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (item.id === 'sale_invoices') onQuickAddSale();
                        else onSelectTab(item.id);
                      }}
                      className="text-slate-500 hover:text-purple-400 p-0.5"
                    >
                      <Plus size={11} />
                    </span>
                  )}
                  {item.badge && (
                    <span className="text-[9px] px-1 py-0.2 rounded bg-sky-500/20 text-sky-300 font-bold">
                      {item.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* PURCHASE & EXPENSE (Expandable Group) */}
        <div>
          <button
            onClick={() => setIsPurchaseOpen(!isPurchaseOpen)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-slate-300 font-medium hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-3">
              <ShoppingCart size={15} className="text-sky-400" />
              <span>Purchase & Expense</span>
            </div>
            {isPurchaseOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>

          {isPurchaseOpen && (
            <div className="pl-6 pr-1 py-1 space-y-0.5 border-l border-white/5 ml-4 my-0.5">
              {purchaseSubItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-[11px] transition-colors ${
                    activeTab === item.id
                      ? 'bg-sky-600/25 text-sky-200 font-bold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`}
                >
                  <span className="truncate">{item.label}</span>
                  {item.hasPlus && (
                    <span className="text-slate-500 hover:text-sky-400 p-0.5">
                      <Plus size={11} />
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Cash & Bank */}
        <button
          onClick={() => onSelectTab('cash_bank')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'cash_bank'
              ? 'bg-purple-600/20 text-purple-300 font-semibold border-l-2 border-purple-500'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
          }`}
        >
          <Landmark size={15} />
          <span>Cash & Bank</span>
        </button>

        {/* Accounting */}
        <button
          onClick={() => onSelectTab('accounting')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'accounting'
              ? 'bg-purple-600/20 text-purple-300 font-semibold border-l-2 border-purple-500'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
          }`}
        >
          <BookOpen size={15} />
          <span>Accounting</span>
        </button>

        {/* Reports */}
        <button
          onClick={() => onSelectTab('reports')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'reports'
              ? 'bg-purple-600/20 text-purple-300 font-semibold border-l-2 border-purple-500'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
          }`}
        >
          <BarChart3 size={15} />
          <span>Reports</span>
        </button>

        {/* Settings */}
        <button
          onClick={() => onSelectTab('settings')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'settings'
              ? 'bg-purple-600/20 text-purple-300 font-semibold border-l-2 border-purple-500'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
          }`}
        >
          <Settings size={15} />
          <span>Settings</span>
        </button>
      </nav>

      {/* Bottom Firm Card (exactly matching screenshot) */}
      <div className="p-2 border-t border-white/10 bg-[#090912]">
        <div className="flex items-center gap-2.5 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer text-left">
          <div className="w-8 h-8 rounded bg-gradient-to-br from-purple-600 to-indigo-800 flex items-center justify-center font-bold text-xs text-white uppercase shrink-0">
            CP
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-bold text-white truncate leading-tight">
              {firmName}
            </div>
            <div className="text-[9px] text-slate-400 truncate">
              Studio Tunnel
            </div>
          </div>
          <ChevronRight size={13} className="text-slate-500 shrink-0" />
        </div>
      </div>
    </aside>
  );
}
