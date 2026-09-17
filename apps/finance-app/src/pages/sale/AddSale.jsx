import React, { useState, useEffect } from 'react';
import { 
  Plus, X, Save, Settings, 
  FileText, Image as ImageIcon, Paperclip, Check, Trash2, ArrowLeft,
  Download
} from 'lucide-react';
import { saveInvoice, getNextInvoiceNumber } from '../../services/firestore';
import { subscribeToOpsProjects, extractPartiesFromProjects } from '../../services/opsAppBridge';
import { findParty, getAllParties } from '../../services/partyMaster';
import InvoicePrintModal from '../../components/Common/InvoicePrintModal';

export default function AddSale({ onSaveSuccess, onClose, initialData = null }) {
  // Tabs for multiple drafts
  const [activeTabId, setActiveTabId] = useState('tab_1');
  const [tabs, setTabs] = useState([{ id: 'tab_1', label: 'Sale #1' }]);

  // Live ops projects & compiled client master
  const [opsProjects, setOpsProjects] = useState([]);
  const [partiesList, setPartiesList] = useState(() => getAllParties());

  // Form State
  const [paymentType, setPaymentType] = useState('credit'); // 'credit' | 'cash'
  const [selectedParty, setSelectedParty] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [gstinNo, setGstinNo] = useState('');
  const [phoneNo, setPhoneNo] = useState('');
  const [panNo, setPanNo] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().slice(0, 10));
  const [stateOfSupply, setStateOfSupply] = useState('Maharashtra');

  // Tax Regime: GST (CGST + SGST) vs IGST
  const [taxType, setTaxType] = useState('GST'); // 'GST' | 'IGST'
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Terms & Attachments
  const [termsTitle, setTermsTitle] = useState('Sale Invoice');
  const [termsContent, setTermsContent] = useState('Thanks for doing business with us!');
  const [showDescription, setShowDescription] = useState(false);
  const [descriptionText, setDescriptionText] = useState('');

  // TDS & Round off
  const [tdsRate, setTdsRate] = useState('NONE'); // 'NONE' | '2%' | '10%'
  const [isRoundOff, setIsRoundOff] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState(null);

  // Line items state
  const [rows, setRows] = useState([
    {
      id: 1,
      item: 'Commercial Color Grading (Studio Session)',
      qty: 1,
      unit: 'HRS',
      priceMode: 'without_tax', // 'without_tax' | 'with_tax'
      priceUnit: 15000,
      discountPct: 0,
      discountAmt: 0,
      taxPct: 18,
      taxAmt: 2700,
      amount: 17700
    },
    {
      id: 2,
      item: '',
      qty: '',
      unit: 'NONE',
      priceMode: 'without_tax',
      priceUnit: '',
      discountPct: '',
      discountAmt: '',
      taxPct: 18,
      taxAmt: 0,
      amount: 0
    }
  ]);

  // Load next invoice number & subscribe to Ops projects
  useEffect(() => {
    let isMounted = true;
    getNextInvoiceNumber().then(num => {
      if (isMounted) setInvoiceNumber(String(num));
    });

    const unsubProjects = subscribeToOpsProjects((projects) => {
      if (isMounted) {
        setOpsProjects(projects);
        const extracted = extractPartiesFromProjects(projects);
        const masterList = getAllParties();
        const combinedMap = new Map();
        masterList.forEach(p => combinedMap.set(p.name.toLowerCase(), p));
        extracted.forEach(p => {
          const k = p.name.toLowerCase();
          if (!combinedMap.has(k)) {
            combinedMap.set(k, p);
          }
        });
        setPartiesList(Array.from(combinedMap.values()));
      }
    });

    return () => {
      isMounted = false;
      if (typeof unsubProjects === 'function') unsubProjects();
    };
  }, []);

  // Populate from initialData if passed (e.g. converting from Estimate or viewing Invoice)
  useEffect(() => {
    if (initialData) {
      const clientName = initialData.customer_name || initialData.client_name || '';
      if (clientName) setSelectedParty(clientName);
      if (initialData.billing_address) setBillingAddress(initialData.billing_address);
      else if (initialData.address) setBillingAddress(initialData.address);
      if (initialData.client_gstin) setGstinNo(initialData.client_gstin);
      else if (initialData.gstin) setGstinNo(initialData.gstin);
      if (initialData.phone) setPhoneNo(initialData.phone);
      if (initialData.pan) setPanNo(initialData.pan);
      if (initialData.state_of_supply) setStateOfSupply(initialData.state_of_supply);
      if (initialData.tax_type) setTaxType(initialData.tax_type);
      else if (initialData.state_of_supply && initialData.state_of_supply !== 'Maharashtra') setTaxType('IGST');

      // If address or GSTIN missing from initialData, try party master lookup
      if (clientName && (!initialData.billing_address && !initialData.address)) {
        const found = findParty(clientName);
        if (found) {
          if (found.address) setBillingAddress(found.address);
          if (!initialData.client_gstin && !initialData.gstin && found.gstin) setGstinNo(found.gstin);
          if (!initialData.pan && found.pan) setPanNo(found.pan);
          if (!initialData.phone && found.phone) setPhoneNo(found.phone);
        }
      }

      if (initialData.line_items && initialData.line_items.length > 0) {
        setRows(initialData.line_items);
      } else if (initialData.rows && initialData.rows.length > 0) {
        setRows(initialData.rows);
      }
    }
  }, [initialData]);

  // Handle client selection auto-fill
  const handleSelectParty = (name) => {
    setSelectedParty(name);
    const found = findParty(name) || partiesList.find(p => p.name.toLowerCase() === name.toLowerCase());
    if (found) {
      if (found.address) setBillingAddress(found.address);
      if (found.gstin) setGstinNo(found.gstin);
      if (found.pan) setPanNo(found.pan);
      if (found.phone) setPhoneNo(found.phone);
      if (found.state) {
        const cleanState = found.state.replace(/^\d+-/, '');
        setStateOfSupply(cleanState);
        if (cleanState !== 'Maharashtra') {
          setTaxType('IGST');
        } else {
          setTaxType('GST');
        }
      }
    }
  };

  // Row calculation engine
  const updateRow = (index, field, value) => {
    setRows(prevRows => {
      const next = [...prevRows];
      const r = { ...next[index], [field]: value };

      const qty = Number(r.qty) || 0;
      const price = Number(r.priceUnit) || 0;
      const rawSubtotal = qty * price;

      let discAmt = 0;
      if (field === 'discountPct') {
        const pct = Number(value) || 0;
        discAmt = (rawSubtotal * pct) / 100;
        r.discountAmt = discAmt ? Math.round(discAmt * 100) / 100 : 0;
      } else if (field === 'discountAmt') {
        discAmt = Number(value) || 0;
        r.discountPct = rawSubtotal > 0 ? Math.round((discAmt / rawSubtotal) * 100 * 100) / 100 : 0;
      } else {
        discAmt = Number(r.discountAmt) || 0;
      }

      const taxable = Math.max(0, rawSubtotal - discAmt);
      const taxRate = Number(r.taxPct) || 0;
      const taxAmount = (taxable * taxRate) / 100;

      r.taxAmt = Math.round(taxAmount * 100) / 100;
      r.amount = Math.round((taxable + taxAmount) * 100) / 100;

      next[index] = r;
      return next;
    });
  };

  const addRow = () => {
    setRows(prev => [
      ...prev,
      {
        id: Date.now(),
        item: '',
        qty: '',
        unit: 'NONE',
        priceMode: 'without_tax',
        priceUnit: '',
        discountPct: '',
        discountAmt: '',
        taxPct: 18,
        taxAmt: 0,
        amount: 0
      }
    ]);
  };

  const removeRow = (index) => {
    if (rows.length <= 1) return;
    setRows(prev => prev.filter((_, i) => i !== index));
  };

  // Aggregations
  const totalQty = rows.reduce((sum, r) => sum + (Number(r.qty) || 0), 0);
  const totalDiscount = rows.reduce((sum, r) => sum + (Number(r.discountAmt) || 0), 0);
  const totalTax = rows.reduce((sum, r) => sum + (Number(r.taxAmt) || 0), 0);
  const rawTotalAmount = rows.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

  // TDS calculation on base amount (without GST)
  const totalBaseAmount = rows.reduce((sum, r) => {
    const q = Number(r.qty) || 0;
    const p = Number(r.priceUnit) || 0;
    const d = Number(r.discountAmt) || 0;
    return sum + Math.max(0, (q * p) - d);
  }, 0);

  let tdsAmount = 0;
  if (tdsRate === '10%') {
    tdsAmount = Math.round(totalBaseAmount * 0.10);
  } else if (tdsRate === '2%') {
    tdsAmount = Math.round(totalBaseAmount * 0.02);
  }

  // Net payable after TDS
  let finalTotal = rawTotalAmount - tdsAmount;
  let roundOffDelta = 0;

  if (isRoundOff) {
    const rounded = Math.round(finalTotal);
    roundOffDelta = Math.round((rounded - finalTotal) * 100) / 100;
    finalTotal = rounded;
  }

  // Save handler
  const handleSave = async () => {
    if (!selectedParty.trim()) {
      alert('Please enter or select a Customer name.');
      return;
    }

    try {
      setIsSaving(true);
      const validRows = rows.filter(r => r.item.trim() || Number(r.amount) > 0);

      const invoicePayload = {
        invoice_number: invoiceNumber,
        invoice_date: invoiceDate,
        customer_name: selectedParty.trim(),
        billing_address: billingAddress.trim(),
        client_gstin: gstinNo.trim(),
        gstin: gstinNo.trim(),
        phone: phoneNo.trim(),
        pan: panNo.trim(),
        state_of_supply: stateOfSupply,
        tax_type: taxType, // 'GST' | 'IGST'
        payment_type: paymentType, // 'credit' or 'cash'
        line_items: validRows,
        base_amount: totalBaseAmount,
        discount_amount: totalDiscount,
        gst_amount: totalTax,
        cgst_amount: taxType === 'GST' ? Math.round((totalTax / 2) * 100) / 100 : 0,
        sgst_amount: taxType === 'GST' ? Math.round((totalTax / 2) * 100) / 100 : 0,
        igst_amount: taxType === 'IGST' ? totalTax : 0,
        invoice_total: rawTotalAmount,
        tds_rate: tdsRate,
        tds_amount: tdsAmount,
        tds_status: tdsRate === 'NONE' ? 'TDS_NOT_DEDUCTED' : 'TDS_DEDUCTED',
        round_off: roundOffDelta,
        net_payable: finalTotal,
        amount_received: paymentType === 'cash' ? finalTotal : 0,
        pending_balance: paymentType === 'cash' ? 0 : finalTotal,
        status: paymentType === 'cash' ? 'Paid' : 'Unpaid',
        terms_title: termsTitle,
        terms_content: termsContent,
        notes: descriptionText
      };

      await saveInvoice(invoicePayload);
      setSaveSuccessMessage(`Invoice #${invoiceNumber} successfully created!`);
      setTimeout(() => {
        if (onSaveSuccess) onSaveSuccess();
      }, 1000);
    } catch (err) {
      console.error('Failed to save invoice:', err);
      alert('Error saving invoice: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090913] text-[#f0f0ff] flex flex-col font-sans">
      {/* ── TOP CHROME BAR: Tabs & Controls ── */}
      <div className="bg-[#0e0e1a] border-b border-white/10 px-4 py-2 flex items-center justify-between">
        {/* Tab Strip */}
        <div className="flex items-center gap-1">
          {tabs.map(t => (
            <div
              key={t.id}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-t-lg text-xs font-semibold border-t-2 ${
                activeTabId === t.id
                  ? 'bg-[#151528] border-purple-500 text-white'
                  : 'bg-transparent border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>{t.label}</span>
              <button 
                onClick={onClose}
                className="text-slate-500 hover:text-rose-400"
              >
                <X size={13} />
              </button>
            </div>
          ))}

          {/* New Tab Button */}
          <button
            onClick={() => {
              const newId = `tab_${tabs.length + 1}`;
              setTabs(prev => [...prev, { id: newId, label: `Sale #${prev.length + 1}` }]);
              setActiveTabId(newId);
            }}
            className="w-6 h-6 rounded-full bg-purple-600/30 hover:bg-purple-600/50 text-purple-300 flex items-center justify-center ml-1 text-xs"
            title="Open another sale draft"
          >
            <Plus size={13} />
          </button>
        </div>

        {/* Action icons top-right */}
        <div className="flex items-center gap-3 text-slate-400">
          <button 
            onClick={handleSave} 
            disabled={isSaving}
            className="hover:text-purple-400 transition-colors p-1"
            title="Quick Save"
          >
            <Save size={16} />
          </button>
          <button className="hover:text-white transition-colors p-1" title="Settings">
            <Settings size={16} />
          </button>
          <button 
            onClick={onClose} 
            className="hover:text-rose-400 transition-colors p-1"
            title="Close"
          >
            <X size={17} />
          </button>
        </div>
      </div>

      {/* ── SALE TYPE TOGGLE (Credit vs Cash) ── */}
      <div className="px-6 py-2.5 bg-[#0b0b16] border-b border-white/5 flex items-center justify-between text-xs">
        <div className="flex items-center gap-4">
          <span className="text-sm font-bold text-white tracking-wide">Sale</span>

          {/* Vyapar style switch pill */}
          <div className="flex items-center gap-2 bg-[#17172b] p-1 rounded-full border border-white/10">
            <button
              onClick={() => setPaymentType('credit')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                paymentType === 'credit'
                  ? 'bg-purple-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Credit
            </button>
            <button
              onClick={() => setPaymentType('cash')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                paymentType === 'cash'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Cash
            </button>
          </div>
        </div>

        {saveSuccessMessage && (
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/30">
            <Check size={14} />
            <span>{saveSuccessMessage}</span>
          </div>
        )}
      </div>

      {/* ── MAIN FORM BODY ── */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
        {/* Header Grid: Customer details (left) & Invoice metadata (right) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-[#111122] border border-white/10 rounded-2xl p-5 shadow-lg">
          {/* Left Column: Customer & Info */}
          <div className="md:col-span-7 space-y-3">
            {/* Customer searchable dropdown */}
            <div>
              <label className="block text-[11px] font-semibold text-purple-300 uppercase tracking-wider mb-1">
                Customer <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={selectedParty}
                  onChange={(e) => handleSelectParty(e.target.value)}
                  placeholder="Select or enter customer name"
                  list="ops-customers-list"
                  className="w-full bg-[#18182e] border border-purple-500/40 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-400 transition-colors shadow-inner font-medium"
                />
                <datalist id="ops-customers-list">
                  {partiesList.map((p, idx) => (
                    <option key={idx} value={p.name}>
                      {p.gstin ? `GST: ${p.gstin}` : ''} {p.address ? `• ${p.address.slice(0, 30)}...` : ''}
                    </option>
                  ))}
                  {opsProjects.map((proj, idx) => (
                    <option key={`proj_${idx}`} value={proj.client_name || proj.client || ''}>
                      Project: {proj.project_name || proj.title || ''}
                    </option>
                  ))}
                </datalist>
              </div>
            </div>

            {/* Billing Address */}
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                Billing Address
              </label>
              <textarea
                rows={2}
                value={billingAddress}
                onChange={(e) => setBillingAddress(e.target.value)}
                placeholder="Registered billing address, street, city, state, pin..."
                className="w-full bg-[#18182e] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400 resize-none font-sans leading-relaxed"
              />
            </div>

            {/* GSTIN, PAN, Phone row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  GSTIN
                </label>
                <input
                  type="text"
                  value={gstinNo}
                  onChange={(e) => {
                    const val = e.target.value.toUpperCase();
                    setGstinNo(val);
                    if (val.length >= 2) {
                      const prefix = val.substring(0, 2);
                      if (prefix === '27') {
                        setStateOfSupply('Maharashtra');
                        setTaxType('GST');
                      } else {
                        setTaxType('IGST');
                      }
                    }
                    if (val.length === 15 && !panNo) {
                      setPanNo(val.substring(2, 12));
                    }
                  }}
                  placeholder="27AAMCC..."
                  className="w-full bg-[#18182e] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400 uppercase font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  PAN
                </label>
                <input
                  type="text"
                  value={panNo}
                  onChange={(e) => setPanNo(e.target.value.toUpperCase())}
                  placeholder="PAN number"
                  className="w-full bg-[#18182e] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400 uppercase font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Phone No.
                </label>
                <input
                  type="text"
                  value={phoneNo}
                  onChange={(e) => setPhoneNo(e.target.value)}
                  placeholder="Phone number"
                  className="w-full bg-[#18182e] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400"
                />
              </div>
            </div>
          </div>

          {/* Right Column: Invoice Metadata */}
          <div className="md:col-span-5 space-y-3 md:border-l md:border-white/5 md:pl-6">
            {/* Invoice Number */}
            <div className="flex items-center justify-between gap-4">
              <label className="text-xs text-slate-400 font-medium">Invoice Number</label>
              <input
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="w-36 bg-[#18182e] border border-white/10 rounded-lg px-3 py-1 text-xs text-right font-bold text-white focus:outline-none focus:border-purple-400"
              />
            </div>

            {/* Invoice Date */}
            <div className="flex items-center justify-between gap-4">
              <label className="text-xs text-slate-400 font-medium">Invoice Date</label>
              <div className="relative w-36">
                <input
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  className="w-full bg-[#18182e] border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-purple-400"
                />
              </div>
            </div>

            {/* State of Supply */}
            <div className="flex items-center justify-between gap-4">
              <label className="text-xs text-slate-400 font-medium">State of supply</label>
              <select
                value={stateOfSupply}
                onChange={(e) => {
                  const val = e.target.value;
                  setStateOfSupply(val);
                  if (val === 'Maharashtra') {
                    setTaxType('GST');
                  } else {
                    setTaxType('IGST');
                  }
                }}
                className="w-36 bg-[#18182e] border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-purple-400"
              >
                <option value="Maharashtra">Maharashtra (27)</option>
                <option value="Delhi">Delhi (07)</option>
                <option value="Karnataka">Karnataka (29)</option>
                <option value="Tamil Nadu">Tamil Nadu (33)</option>
                <option value="Telangana">Telangana (36)</option>
                <option value="West Bengal">West Bengal (19)</option>
                <option value="Other">Other State (IGST)</option>
              </select>
            </div>

            {/* Tax Regime Toggle: Both GST and IGST Options */}
            <div className="flex items-center justify-between gap-4 pt-2 border-t border-white/5">
              <div className="flex flex-col">
                <label className="text-xs text-purple-300 font-semibold">Tax Type</label>
                <span className="text-[10px] text-slate-500">
                  {taxType === 'GST' ? 'Intra-State: CGST (9%) + SGST (9%)' : 'Inter-State: Integrated GST (18%)'}
                </span>
              </div>
              <div className="flex items-center bg-[#18182e] p-0.5 rounded-lg border border-purple-500/30 shadow-inner">
                <button
                  type="button"
                  onClick={() => setTaxType('GST')}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                    taxType === 'GST'
                      ? 'bg-purple-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  GST (CGST+SGST)
                </button>
                <button
                  type="button"
                  onClick={() => setTaxType('IGST')}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                    taxType === 'IGST'
                      ? 'bg-purple-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  IGST
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── LINE ITEMS TABLE (Exact Vyapar Structure) ── */}
        <div className="bg-[#111122] border border-white/10 rounded-2xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-[#18182e] text-slate-300 font-semibold border-b border-white/10">
                  <th className="py-2.5 px-3 w-8 text-center">#</th>
                  <th className="py-2.5 px-3 min-w-[240px]">ITEM</th>
                  <th className="py-2.5 px-2 w-20 text-center">QTY</th>
                  <th className="py-2.5 px-2 w-24 text-center">UNIT</th>
                  <th className="py-2.5 px-2 w-32 text-center">
                    <div>PRICE/UNIT</div>
                    <div className="text-[10px] text-purple-400 font-normal">Without Tax ▼</div>
                  </th>
                  <th className="py-2 px-2 text-center border-l border-white/5" colSpan={2}>
                    <div>DISCOUNT</div>
                    <div className="grid grid-cols-2 text-[10px] text-slate-400 font-normal pt-0.5">
                      <span>%</span>
                      <span>AMOUNT</span>
                    </div>
                  </th>
                  <th className="py-2 px-2 text-center border-l border-white/5" colSpan={2}>
                    <div>{taxType === 'IGST' ? 'IGST' : 'GST'}</div>
                    <div className="grid grid-cols-2 text-[10px] text-slate-400 font-normal pt-0.5">
                      <span>%</span>
                      <span>AMOUNT</span>
                    </div>
                  </th>
                  <th className="py-2.5 px-3 w-32 text-right">AMOUNT</th>
                  <th className="py-2.5 px-2 w-8 text-center text-purple-400">⊕</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/5">
                {rows.map((row, idx) => (
                  <tr key={row.id} className="hover:bg-white/[0.02] transition-colors group">
                    {/* Index */}
                    <td className="py-2 px-3 text-center text-slate-500 font-mono">
                      {idx + 1}
                    </td>

                    {/* Item Description with suggestion from Ops items */}
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        value={row.item}
                        onChange={(e) => updateRow(idx, 'item', e.target.value)}
                        placeholder="Enter item or service name"
                        className="w-full bg-transparent border-b border-transparent focus:border-purple-400 px-1 py-1 text-white placeholder-slate-600 focus:outline-none"
                      />
                    </td>

                    {/* Qty */}
                    <td className="py-2 px-2 text-center">
                      <input
                        type="number"
                        value={row.qty}
                        onChange={(e) => updateRow(idx, 'qty', e.target.value)}
                        className="w-16 bg-[#17172b] border border-white/10 rounded px-1.5 py-1 text-center text-white focus:outline-none focus:border-purple-400"
                      />
                    </td>

                    {/* Unit */}
                    <td className="py-2 px-2 text-center">
                      <select
                        value={row.unit}
                        onChange={(e) => updateRow(idx, 'unit', e.target.value)}
                        className="bg-[#17172b] border border-white/10 rounded px-1.5 py-1 text-white text-[11px] focus:outline-none"
                      >
                        <option value="NONE">NONE</option>
                        <option value="HRS">HRS</option>
                        <option value="DAYS">DAYS</option>
                        <option value="PCS">PCS</option>
                        <option value="PROJECT">PROJECT</option>
                      </select>
                    </td>

                    {/* Price / Unit */}
                    <td className="py-2 px-2 text-center">
                      <input
                        type="number"
                        value={row.priceUnit}
                        onChange={(e) => updateRow(idx, 'priceUnit', e.target.value)}
                        placeholder="0.00"
                        className="w-24 bg-[#17172b] border border-white/10 rounded px-1.5 py-1 text-right text-white focus:outline-none focus:border-purple-400 font-mono"
                      />
                    </td>

                    {/* Discount % */}
                    <td className="py-2 px-1 text-center border-l border-white/5">
                      <input
                        type="number"
                        value={row.discountPct}
                        onChange={(e) => updateRow(idx, 'discountPct', e.target.value)}
                        placeholder="0"
                        className="w-12 bg-[#17172b] border border-white/10 rounded px-1 py-1 text-center text-white focus:outline-none focus:border-purple-400 text-[11px]"
                      />
                    </td>

                    {/* Discount Amount */}
                    <td className="py-2 px-1 text-center">
                      <input
                        type="number"
                        value={row.discountAmt}
                        onChange={(e) => updateRow(idx, 'discountAmt', e.target.value)}
                        placeholder="0"
                        className="w-16 bg-[#17172b] border border-white/10 rounded px-1 py-1 text-right text-white focus:outline-none focus:border-purple-400 text-[11px] font-mono"
                      />
                    </td>

                    {/* Tax % */}
                    <td className="py-2 px-1 text-center border-l border-white/5">
                      <select
                        value={row.taxPct}
                        onChange={(e) => updateRow(idx, 'taxPct', e.target.value)}
                        className="bg-[#17172b] border border-white/10 rounded px-1 py-1 text-white text-[11px] focus:outline-none"
                      >
                        <option value="0">0%</option>
                        <option value="5">{taxType === 'IGST' ? 'IGST 5%' : 'GST 5% (2.5%+2.5%)'}</option>
                        <option value="12">{taxType === 'IGST' ? 'IGST 12%' : 'GST 12% (6%+6%)'}</option>
                        <option value="18">{taxType === 'IGST' ? 'IGST 18%' : 'GST 18% (9%+9%)'}</option>
                        <option value="28">{taxType === 'IGST' ? 'IGST 28%' : 'GST 28% (14%+14%)'}</option>
                      </select>
                    </td>

                    {/* Tax Amount (Calculated) */}
                    <td className="py-2 px-1 text-right font-mono text-slate-300 pr-2">
                      {Number(row.taxAmt || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>

                    {/* Net Row Amount */}
                    <td className="py-2 px-3 text-right font-mono font-bold text-white">
                      {Number(row.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>

                    {/* Row Delete Icon */}
                    <td className="py-2 px-2 text-center">
                      <button
                        onClick={() => removeRow(idx)}
                        className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 transition-opacity"
                        title="Delete Row"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>

              {/* Table Footer Total Row */}
              <tfoot>
                <tr className="bg-[#151528] border-t border-white/10 font-bold text-slate-200">
                  <td colSpan={2} className="py-2.5 px-4">
                    <button
                      onClick={addRow}
                      className="inline-flex items-center gap-1 text-sky-400 hover:text-sky-300 font-bold transition-colors"
                    >
                      <Plus size={13} />
                      <span>ADD ROW</span>
                    </button>
                  </td>
                  <td className="py-2.5 px-2 text-center font-mono">{totalQty}</td>
                  <td colSpan={2} className="py-2.5 px-2 text-right uppercase tracking-wider text-slate-400 text-[10px]">
                    Total
                  </td>
                  <td colSpan={2} className="py-2.5 px-2 text-right font-mono pr-4 text-emerald-400">
                    ₹{totalDiscount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td colSpan={2} className="py-2.5 px-2 text-right font-mono pr-4 text-purple-300">
                    ₹{totalTax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-white text-sm">
                    ₹{rawTotalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* ── BOTTOM PANELS (Terms, Attachments, TDS & Net Total) ── */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          {/* Left Panel: Terms & Conditions (Col 1-4) */}
          <div className="md:col-span-4 bg-[#111122] border border-white/10 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">Terms & Conditions</span>
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 mb-1">Title</label>
              <select
                value={termsTitle}
                onChange={(e) => setTermsTitle(e.target.value)}
                className="w-full bg-[#18182e] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
              >
                <option value="Sale Invoice">Sale Invoice</option>
                <option value="Estimate">Estimate</option>
                <option value="General Terms">General Terms</option>
              </select>
            </div>

            <textarea
              rows={3}
              value={termsContent}
              onChange={(e) => setTermsContent(e.target.value)}
              className="w-full bg-[#18182e] border border-white/10 rounded-lg p-2.5 text-xs text-slate-300 focus:outline-none focus:border-purple-400"
            />
          </div>

          {/* Middle Buttons: Add Description / Add Image / Add Document (Col 5-7) */}
          <div className="md:col-span-3 space-y-2">
            <button
              onClick={() => setShowDescription(!showDescription)}
              className="w-full flex items-center gap-2 px-3 py-2 bg-[#18182e] hover:bg-[#20203a] border border-white/10 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
            >
              <FileText size={14} className="text-purple-400" />
              <span>+ ADD DESCRIPTION</span>
            </button>

            {showDescription && (
              <textarea
                rows={2}
                value={descriptionText}
                onChange={(e) => setDescriptionText(e.target.value)}
                placeholder="Internal notes or project reference..."
                className="w-full bg-[#18182e] border border-purple-500/40 rounded-xl p-2 text-xs text-white focus:outline-none"
              />
            )}

            <button
              onClick={() => alert('Document upload via Firebase Storage ready.')}
              className="w-full flex items-center gap-2 px-3 py-2 bg-[#18182e] hover:bg-[#20203a] border border-white/10 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
            >
              <ImageIcon size={14} className="text-sky-400" />
              <span>+ ADD IMAGE</span>
            </button>

            <button
              onClick={() => alert('PDF document attachment ready.')}
              className="w-full flex items-center gap-2 px-3 py-2 bg-[#18182e] hover:bg-[#20203a] border border-white/10 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
            >
              <Paperclip size={14} className="text-emerald-400" />
              <span>+ ADD DOCUMENT</span>
            </button>
          </div>

          {/* Right Panel: Tax Breakdown, TDS, Round Off & Grand Total (Col 8-12) */}
          <div className="md:col-span-5 bg-[#111122] border border-white/10 rounded-2xl p-5 space-y-3.5">
            {/* Taxable Base & Tax Breakdown */}
            <div className="space-y-1.5 text-xs pb-3 border-b border-white/10">
              <div className="flex items-center justify-between text-slate-400 text-[11px]">
                <span>Taxable Amount</span>
                <span className="font-mono font-medium text-slate-200">
                  ₹{totalBaseAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>

              {taxType === 'GST' ? (
                <>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Central GST (CGST 9%)</span>
                    <span className="font-mono text-purple-300">
                      + ₹{(Math.round((totalTax / 2) * 100) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">State GST (SGST 9%)</span>
                    <span className="font-mono text-purple-300">
                      + ₹{(Math.round((totalTax / 2) * 100) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Integrated GST (IGST 18%)</span>
                  <span className="font-mono text-purple-300">
                    + ₹{totalTax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300 pt-1 border-t border-white/5">
                <span>Total Tax ({taxType})</span>
                <span className="font-mono text-purple-200">
                  ₹{totalTax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* TDS Selector */}
            <div className="flex items-center justify-between gap-3 text-xs">
              <span className="font-bold text-slate-300">TDS (Tax Deducted at Source)</span>
              <div className="flex items-center gap-2">
                <select
                  value={tdsRate}
                  onChange={(e) => setTdsRate(e.target.value)}
                  className="bg-[#18182e] border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none"
                >
                  <option value="NONE">NONE</option>
                  <option value="2%">2% (194C)</option>
                  <option value="10%">10% (194J - Studio)</option>
                </select>
                <span className="w-20 text-right font-mono text-rose-400 font-bold">
                  {tdsAmount > 0 ? `- ₹${tdsAmount.toLocaleString('en-IN')}` : '0'}
                </span>
              </div>
            </div>

            {/* Round Off Toggle */}
            <div className="flex items-center justify-between text-xs pt-1 border-t border-white/5">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isRoundOff}
                  onChange={(e) => setIsRoundOff(e.target.checked)}
                  className="rounded text-purple-600 focus:ring-0 bg-[#18182e]"
                />
                <span className="text-slate-300">Round Off</span>
              </label>
              <span className="font-mono text-slate-400 text-xs">
                {roundOffDelta >= 0 ? `+${roundOffDelta}` : roundOffDelta}
              </span>
            </div>

            {/* Large Grand Total Box */}
            <div className="bg-[#18182e] border border-purple-500/30 rounded-xl p-3 flex items-center justify-between shadow-inner">
              <span className="text-sm font-bold text-purple-300 uppercase tracking-wide">Total</span>
              <span className="text-2xl font-black text-white font-mono tracking-tight">
                ₹{finalTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── FIXED BOTTOM ACTION BAR ── */}
      <div className="bg-[#0c0c16] border-t border-white/10 px-8 py-3 flex items-center justify-between no-print">
        <button
          onClick={onClose}
          className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Back to Transactions</span>
        </button>

        <div className="flex items-center gap-3">
          {/* Share & Download PDF Button */}
          <button
            onClick={() => setShowPrintModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#18182c] hover:bg-purple-900/40 border border-purple-500/40 text-purple-200 hover:text-white rounded-lg text-xs font-bold transition-all shadow active:scale-95"
            title="Download Invoice as PDF or Share"
          >
            <Download size={14} className="text-purple-400" />
            <span>Share / Download PDF</span>
          </button>

          {/* Save Button (Exact Vyapar Blue) */}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-8 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-lg text-xs font-extrabold tracking-wide transition-all shadow-lg active:scale-95 disabled:opacity-50"
          >
            {isSaving ? (
              <span>Saving...</span>
            ) : (
              <span><u>S</u>ave</span>
            )}
          </button>
        </div>
      </div>

      {/* ── INVOICE PRINT & PDF DOWNLOAD MODAL ── */}
      {showPrintModal && (
        <InvoicePrintModal
          invoice={{
            invoice_number: invoiceNumber || 'DRAFT',
            invoice_date: invoiceDate,
            customer_name: selectedParty || 'Customer Name',
            billing_address: billingAddress,
            client_gstin: gstinNo,
            gstin: gstinNo,
            phone: phoneNo,
            pan: panNo,
            state_of_supply: stateOfSupply,
            tax_type: taxType,
            payment_type: paymentType,
            line_items: rows.filter(r => r.item.trim() || Number(r.amount) > 0),
            base_amount: totalBaseAmount,
            discount_amount: totalDiscount,
            gst_amount: totalTax,
            cgst_amount: taxType === 'GST' ? Math.round((totalTax / 2) * 100) / 100 : 0,
            sgst_amount: taxType === 'GST' ? Math.round((totalTax / 2) * 100) / 100 : 0,
            igst_amount: taxType === 'IGST' ? totalTax : 0,
            invoice_total: rawTotalAmount,
            tds_rate: tdsRate,
            tds_amount: tdsAmount,
            round_off: roundOffDelta,
            net_payable: finalTotal,
            terms_title: termsTitle,
            terms_content: termsContent,
            notes: descriptionText
          }}
          onClose={() => setShowPrintModal(false)}
        />
      )}
    </div>
  );
}
