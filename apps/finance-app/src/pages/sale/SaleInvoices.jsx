import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, ChevronDown, Settings, Printer, Share2, 
  Trash2, CheckCircle2, ArrowUpDown, CloudUpload, RefreshCw
} from 'lucide-react';
import SummaryCard from '../../components/Common/SummaryCard';
import FilterBar from '../../components/Common/FilterBar';
import StatusBadge from '../../components/Common/StatusBadge';
import StatusBar from '../../components/Layout/StatusBar';
import InvoicePrintModal from '../../components/Common/InvoicePrintModal';
import { subscribeToInvoices, deleteInvoice, saveBulkInvoices } from '../../services/firestore';
import VYAPAR_MIGRATED_INVOICES from '../../data/vyapar_invoices_migrated.json';

export default function SaleInvoices({ onAddSale, onSelectInvoice }) {
  const [invoices, setInvoices] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState(null);
  const [activePrintInvoice, setActivePrintInvoice] = useState(null);

  useEffect(() => {
    const unsub = subscribeToInvoices((data) => {
      if (data && data.length > 0) {
        // Merge with migrated invoices, prioritizing Firestore records
        const firestoreMap = new Map(data.map(d => [String(d.invoice_number), d]));
        const merged = [...data];

        VYAPAR_MIGRATED_INVOICES.forEach(mig => {
          if (!firestoreMap.has(String(mig.invoice_number))) {
            merged.push(mig);
          }
        });

        merged.sort((a, b) => Number(b.invoice_number) - Number(a.invoice_number));
        setInvoices(merged);
      } else {
        // Default to all 156 real invoices from Vyapar
        setInvoices(VYAPAR_MIGRATED_INVOICES);
      }
    });

    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, []);

  const handleSyncToFirestore = async () => {
    try {
      setIsSyncing(true);
      setSyncStatus('Syncing 156 Vyapar invoices to Firebase Firestore...');
      const count = await saveBulkInvoices(VYAPAR_MIGRATED_INVOICES);
      setSyncStatus(`Successfully synchronized ${count} invoices to live Firestore!`);
      setTimeout(() => setSyncStatus(null), 5000);
    } catch (err) {
      console.error('Sync error:', err);
      setSyncStatus('Error syncing invoices: ' + err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const q = searchTerm.toLowerCase();
      const num = String(inv.invoice_number || '').toLowerCase();
      const party = String(inv.customer_name || '').toLowerCase();
      const colorist = String(inv.colorist || '').toLowerCase();
      return num.includes(q) || party.includes(q) || colorist.includes(q);
    });
  }, [invoices, searchTerm]);

  const totalAmount = useMemo(() => {
    return filteredInvoices.reduce((sum, i) => sum + (Number(i.invoice_total) || 0), 0);
  }, [filteredInvoices]);

  const totalReceived = useMemo(() => {
    return filteredInvoices.reduce((sum, i) => sum + (Number(i.amount_received) || 0), 0);
  }, [filteredInvoices]);

  const totalBalance = useMemo(() => {
    return filteredInvoices.reduce((sum, i) => sum + (Number(i.pending_balance) || Number(i.invoice_total) || 0), 0);
  }, [filteredInvoices]);

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this invoice?')) {
      await deleteInvoice(id);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#080810]">
      {/* ── Content Header (Title + Actions) ── */}
      <div className="px-6 py-4 flex items-center justify-between border-b border-white/5 no-print">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-white tracking-tight">Sale Invoices</h1>
          <ChevronDown size={16} className="text-slate-400 cursor-pointer" />
          <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
            {invoices.length} Invoices
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Permanent Cloud Sync Action */}
          <button
            onClick={handleSyncToFirestore}
            disabled={isSyncing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#18182c] hover:bg-[#22223e] text-purple-300 border border-purple-500/30 rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
            title="Permanently write all Vyapar invoices to Firestore collection"
          >
            {isSyncing ? <RefreshCw size={13} className="animate-spin" /> : <CloudUpload size={13} />}
            <span>Sync All to Firestore</span>
          </button>

          <button
            onClick={onAddSale}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition-all shadow-lg active:scale-95"
          >
            <Plus size={14} />
            <span>Add Sale</span>
          </button>

          <button className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors">
            <Settings size={16} />
          </button>
        </div>
      </div>

      {/* Sync Notification Banner */}
      {syncStatus && (
        <div className="mx-6 mt-3 px-4 py-2 bg-purple-500/15 border border-purple-500/30 rounded-xl text-xs text-purple-200 flex items-center gap-2">
          <CheckCircle2 size={14} className="text-purple-400 shrink-0" />
          <span>{syncStatus}</span>
        </div>
      )}

      {/* ── Filter Bar ── */}
      <div className="px-6">
        <FilterBar
          dateRangeLabel="This Financial Year"
          dateRange="01/04/2026 To 31/03/2027"
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Search by invoice #, client, or colorist..."
          onPrint={() => window.print()}
          onExportExcel={() => alert('Excel export ready.')}
        />
      </div>

      {/* ── Summary Card Widget (Screenshot 5 Match) ── */}
      <div className="px-6 py-4 no-print">
        <SummaryCard
          title="Total Sales Amount"
          amount={totalAmount}
          trend="100%"
          trendDirection="up"
          leftSubLabel="Received"
          leftSubValue={totalReceived}
          rightSubLabel="Balance"
          rightSubValue={totalBalance}
        />
      </div>

      {/* ── Transactions Table (All 156 Invoices) ── */}
      <div className="flex-1 overflow-y-auto px-6 pb-4">
        <div className="flex items-center justify-between text-xs font-bold text-slate-300 mb-2">
          <span>Transactions ({filteredInvoices.length})</span>
          {searchTerm && (
            <span className="text-slate-500 text-[11px] font-normal">
              Showing matching results for "{searchTerm}"
            </span>
          )}
        </div>

        <div className="bg-[#101020] border border-white/10 rounded-xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-[#16162d] text-slate-400 font-medium border-b border-white/10">
                  <th className="py-2.5 px-4 w-28">
                    <div className="flex items-center gap-1">
                      <span>Date</span>
                      <ArrowUpDown size={11} className="text-slate-500" />
                    </div>
                  </th>
                  <th className="py-2.5 px-3 w-24">
                    <div className="flex items-center gap-1">
                      <span>Invoice no</span>
                      <ArrowUpDown size={11} className="text-slate-500" />
                    </div>
                  </th>
                  <th className="py-2.5 px-4 min-w-[200px]">
                    <div className="flex items-center gap-1">
                      <span>Party Name</span>
                      <ArrowUpDown size={11} className="text-slate-500" />
                    </div>
                  </th>
                  <th className="py-2.5 px-3 w-28">Transaction</th>
                  <th className="py-2.5 px-4 w-36">Payment Type</th>
                  <th className="py-2.5 px-3 w-28 text-right">Amount</th>
                  <th className="py-2.5 px-3 w-28 text-right">Balance</th>
                  <th className="py-2.5 px-3 w-28 text-center">Status</th>
                  <th className="py-2.5 px-3 w-24 text-center">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/5">
                {filteredInvoices.map((inv) => (
                  <tr 
                    key={inv.id} 
                    onClick={() => onSelectInvoice && onSelectInvoice(inv)}
                    className="hover:bg-white/[0.03] transition-colors cursor-pointer group"
                  >
                    {/* Date */}
                    <td className="py-2.5 px-4 text-slate-300 font-mono">
                      {inv.invoice_date || '07/09/2026'}
                    </td>

                    {/* Invoice Number */}
                    <td className="py-2.5 px-3 font-bold text-white font-mono">
                      {inv.invoice_number}
                    </td>

                    {/* Party Name */}
                    <td className="py-2.5 px-4">
                      <div className="font-semibold text-slate-200">{inv.customer_name}</div>
                      {inv.colorist && (
                        <div className="text-[10px] text-purple-400 font-medium">
                          Colorist: {inv.colorist}
                        </div>
                      )}
                    </td>

                    {/* Transaction */}
                    <td className="py-2.5 px-3 text-slate-400">
                      Sale
                    </td>

                    {/* Payment Type */}
                    <td className="py-2.5 px-4 text-slate-400 truncate max-w-[140px]">
                      {inv.payment_type || 'CINELOOM POSTWORKS PVT LTD'}
                    </td>

                    {/* Amount */}
                    <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-200">
                      ₹ {Number(inv.invoice_total || 0).toLocaleString('en-IN')}
                    </td>

                    {/* Balance */}
                    <td className="py-2.5 px-3 text-right font-mono font-semibold text-rose-400">
                      ₹ {Number(inv.pending_balance || inv.invoice_total || 0).toLocaleString('en-IN')}
                    </td>

                    {/* Status with TDS Indicator */}
                    <td className="py-2.5 px-3 text-center">
                      <StatusBadge status={inv.status || 'Unpaid'} tdsStatus={inv.tds_status} />
                    </td>

                    {/* Action Icons */}
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-2 text-slate-400">
                        <button 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            setActivePrintInvoice(inv); 
                          }} 
                          className="hover:text-white p-0.5" 
                          title="Print / Download PDF"
                        >
                          <Printer size={13} />
                        </button>
                        <button 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            setActivePrintInvoice(inv);
                          }} 
                          className="hover:text-sky-400 p-0.5" 
                          title="Share / Download PDF"
                        >
                          <Share2 size={13} />
                        </button>
                        <button 
                          onClick={(e) => handleDelete(e, inv.id)} 
                          className="hover:text-rose-400 p-0.5" 
                          title="Delete"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Fixed Footer StatusBar ── */}
      <StatusBar totalAmount={totalAmount} balance={totalBalance} />

      {/* ── Invoice Print & Download Modal ── */}
      {activePrintInvoice && (
        <InvoicePrintModal
          invoice={activePrintInvoice}
          onClose={() => setActivePrintInvoice(null)}
        />
      )}
    </div>
  );
}
