import React, { useEffect, useState } from 'react';
import { X, Download, Share2, Check } from 'lucide-react';
import { STUDIO_TUNNEL_LOGO_BASE64, AUTHORIZED_SIGNATURE_BASE64 } from '../../assets/invoiceAssets';
import { resolveInvoiceClientDetails } from '../../services/partyMaster';

// Helper: Convert number to Indian currency words
function numberToWordsINR(num) {
  if (!num || isNaN(num)) return 'Zero Rupees Only.';
  const a = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function inWords(n) {
    if (n === 0) return '';
    if (n < 20) return a[n] + ' ';
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '') + ' ';
    if (n < 1000) return a[Math.floor(n / 100)] + ' Hundred ' + inWords(n % 100);
    if (n < 100000) return inWords(Math.floor(n / 1000)) + 'Thousand ' + inWords(n % 1000);
    if (n < 10000000) return inWords(Math.floor(n / 100000)) + 'Lakh ' + inWords(n % 100000);
    return inWords(Math.floor(n / 10000000)) + 'Crore ' + inWords(n % 10000000);
  }

  const rounded = Math.round(Number(num));
  const words = inWords(rounded).trim();
  return words ? `${words} Rupees Only.` : 'Zero Rupees Only.';
}

// Helper: Format date to DD/MM/YYYY
function formatDate(dateStr) {
  if (!dateStr) return '18/08/2026';
  if (dateStr.includes('/')) return dateStr;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return dateStr;
  }
}

// Helper: Add days to date
function getDueDateStr(dateStr, days = 30) {
  try {
    let d;
    if (dateStr && dateStr.includes('/')) {
      const parts = dateStr.split('/');
      d = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
    } else if (dateStr) {
      d = new Date(dateStr);
    } else {
      d = new Date();
    }
    if (isNaN(d.getTime())) return '';
    d.setDate(d.getDate() + days);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return '';
  }
}

// State GST Codes mapping
const GST_STATE_CODES = {
  'Maharashtra': '27-Maharashtra',
  'Delhi': '07-Delhi',
  'Karnataka': '29-Karnataka',
  'Tamil Nadu': '33-Tamil Nadu',
  'Telangana': '36-Telangana',
  'West Bengal': '19-West Bengal',
  'Uttar Pradesh': '09-Uttar Pradesh',
  'Gujarat': '24-Gujarat',
  'Rajasthan': '08-Rajasthan',
  'Haryana': '06-Haryana',
  'Kerala': '32-Kerala',
  'Punjab': '03-Punjab'
};

export default function InvoicePrintModal({ invoice, onClose, autoPrint = false }) {
  if (!invoice) return null;

  const [copied, setCopied] = useState(false);

  useEffect(() => {
    document.body.classList.add('printing-invoice');
    let timer;
    if (autoPrint) {
      timer = setTimeout(() => {
        window.print();
      }, 350);
    }
    return () => {
      if (timer) clearTimeout(timer);
      document.body.classList.remove('printing-invoice');
    };
  }, [autoPrint]);

  const handlePrint = () => {
    window.print();
  };

  // Tax calculations
  const isIgst = invoice.tax_type 
    ? invoice.tax_type === 'IGST' 
    : (invoice.state_of_supply && invoice.state_of_supply !== 'Maharashtra');

  // Normalize line items
  const rawItems = invoice.line_items || invoice.rows || [];
  const validItems = rawItems.filter(r => (r.item && r.item.trim()) || Number(r.amount) > 0);
  const items = validItems.length > 0 ? validItems : [
    {
      item: 'Color Grading & DI Mastering Services',
      project_name: invoice.project_name || invoice.notes || '',
      colorist: invoice.colorist || 'Senior Post Team',
      qty: 24,
      unit: 'Hrs',
      priceUnit: 12500,
      hsn: '999612',
      taxPct: 18,
      amount: 300000
    }
  ];

  // Base and Tax calculations
  const baseAmount = invoice.base_amount !== undefined 
    ? Number(invoice.base_amount) 
    : items.reduce((sum, r) => sum + (Number(r.qty || 1) * Number(r.priceUnit || 0)), 0);

  const totalTax = invoice.gst_amount !== undefined
    ? Number(invoice.gst_amount)
    : items.reduce((sum, r) => sum + (Number(r.taxAmt || 0) || (Number(r.qty || 1) * Number(r.priceUnit || 0) * (Number(r.taxPct || 18) / 100))), 0);

  const cgstAmount = isIgst ? 0 : Math.round((totalTax / 2) * 100) / 100;
  const sgstAmount = cgstAmount;
  const igstAmount = isIgst ? totalTax : 0;

  const grandTotal = invoice.invoice_total !== undefined 
    ? Number(invoice.invoice_total) 
    : (baseAmount + totalTax);

  // Resolve client full details (address, GSTIN, PAN, Phone, State)
  const client = resolveInvoiceClientDetails(invoice);

  // Invoice number directly without ST/2026-27/ or ST/ prefix
  const formattedInvoiceNo = String(invoice.invoice_number || invoice.invoiceNo || invoice.id || '1')
    .replace(/^ST\/2026-27\//i, '')
    .replace(/^ST\//i, '');

  const formattedDate = formatDate(invoice.invoice_date);
  const dueDate = getDueDateStr(invoice.invoice_date, 30);
  const placeOfSupply = invoice.place_of_supply 
    || GST_STATE_CODES[invoice.state_of_supply] 
    || invoice.state_of_supply 
    || client.state 
    || (isIgst ? '07-Delhi' : '27-Maharashtra');

  const handleWhatsApp = () => {
    const text = encodeURIComponent(
      `*CINELOOM POSTWORKS PRIVATE LIMITED — TAX INVOICE*\n\n` +
      `*Invoice No:* ${formattedInvoiceNo}\n` +
      `*Client:* ${client.name}\n` +
      `*Date:* ${formattedDate}\n` +
      `*Place of Supply:* ${placeOfSupply}\n` +
      `*Subtotal:* ₹ ${baseAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}\n` +
      (isIgst 
        ? `*IGST (18%):* ₹ ${igstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}\n`
        : `*CGST (9%):* ₹ ${cgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}\n*SGST (9%):* ₹ ${sgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}\n`
      ) +
      `*Grand Total (Incl. GST):* ₹ ${grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}\n` +
      `*Amount in Words:* ${numberToWordsINR(grandTotal)}\n\n` +
      `*Bank Remittance Details:*\n` +
      `Bank Name: HDFC Bank Ltd\n` +
      `Account Holder: CINELOOM POSTWORKS PRIVATE LIMITED\n` +
      `Account No: 50200012345678 | IFSC: HDFC0000123\n` +
      `Branch: Santacruz West, Mumbai\n\n` +
      `Thank you for doing business with Studio Tunnel!`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleCopy = () => {
    const text = 
      `CINELOOM POSTWORKS PRIVATE LIMITED — TAX INVOICE\n` +
      `Invoice No: ${formattedInvoiceNo}\n` +
      `Client: ${client.name}\n` +
      `Date: ${formattedDate}\n` +
      `Grand Total: ₹ ${grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}\n` +
      `HDFC Bank A/C: 50200012345678 | IFSC: HDFC0000123`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      {/* Top Floating Action Bar (Hidden in Print) */}
      <div className="fixed top-4 right-6 flex items-center gap-3 z-50 no-print">
        <button
          onClick={handleWhatsApp}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-xl transition-all active:scale-95"
          title="Share via WhatsApp"
        >
          <Share2 size={14} />
          <span>WhatsApp</span>
        </button>

        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold border border-white/10 shadow-xl transition-all"
          title="Copy Summary"
        >
          {copied ? <Check size={14} className="text-emerald-400" /> : <Share2 size={14} />}
          <span>{copied ? 'Copied!' : 'Copy Summary'}</span>
        </button>

        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white rounded-xl text-xs font-bold shadow-2xl transition-all active:scale-95"
        >
          <Download size={15} />
          <span>Download PDF / Print</span>
        </button>

        <button
          onClick={onClose}
          className="p-2 bg-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 rounded-xl border border-white/10 transition-all"
          title="Close Modal"
        >
          <X size={16} />
        </button>
      </div>

      {/* ── PRINTABLE A4 INVOICE SHEET (Standard 210mm x 297mm flex container) ── */}
      <div 
        id="printable-invoice-doc"
        className="bg-white text-black w-full max-w-4xl rounded-lg shadow-2xl p-10 my-6 text-xs font-sans print:m-0 print:p-0 print:shadow-none print:w-full print:max-w-none flex flex-col justify-between"
        style={{
          minHeight: '272mm',
          WebkitPrintColorAdjust: 'exact',
          printColorAdjust: 'exact'
        }}
      >
        {/* Upper Content: Header, Billed To, Line Items Table, Totals, Amount in Words */}
        <div className="flex-1 flex flex-col">
          {/* ── HEADER BLOCK (Position strictly preserved) ── */}
          <div className="flex justify-between items-start pb-2">
            {/* Left: Company Legal Info */}
            <div>
              <h1 className="text-sm font-bold tracking-tight text-black uppercase font-sans">
                CINELOOM POSTWORKS PRIVATE LIMITED
              </h1>
              <div className="mt-2 text-[11px] text-neutral-800 space-y-0.5 font-sans leading-relaxed">
                <p>311, Kamla Spaces, SV Road,</p>
                <p>Santacruz (West), Mumbai - 400 054</p>
                <p>Phone: +91 8928249081</p>
                <p>Email: contact@studiotunnel.com</p>
              </div>
            </div>

            {/* Right: Studio Tunnel Logo & Statutory Registration */}
            <div className="flex flex-col items-end text-right">
              <img 
                src={STUDIO_TUNNEL_LOGO_BASE64} 
                alt="Studio Tunnel Logo" 
                className="h-9 w-auto object-contain mb-1.5" 
              />
              <div className="text-[11px] text-neutral-800 space-y-0.5 font-sans leading-tight">
                <p><span className="font-semibold">GSTIN:</span> 27AAMCC8604R1ZV</p>
                <p><span className="font-semibold">TAN:</span> PNEC20959B</p>
                <p><span className="font-semibold">PAN:</span> AAMCC8604R</p>
                <p><span className="font-semibold">State:</span> 27-Maharashtra</p>
              </div>
            </div>
          </div>

          {/* Thin Header Divider */}
          <div className="w-full border-b border-neutral-300 my-2.5"></div>

          {/* ── DOCUMENT TITLE ── */}
          <div className="text-center py-2">
            <h2 className="text-base font-black tracking-widest text-black uppercase font-sans">
              TAX INVOICE
            </h2>
          </div>

          {/* ── BILLED TO & INVOICE METADATA ── */}
          <div className="grid grid-cols-12 gap-4 text-[11px] font-sans text-neutral-900 mb-4">
            {/* Billed To (Left Column) */}
            <div className="col-span-7 space-y-1">
              <div className="font-bold text-black uppercase tracking-wider text-[11px]">BILLED TO:</div>
              <div className="font-bold text-black text-xs uppercase tracking-wide">{client.name}</div>
              {client.address && (
                <div className="text-neutral-800 leading-snug whitespace-pre-line text-[11px] font-normal">
                  {client.address}
                </div>
              )}
              {client.gstin && (
                <div className="text-neutral-900 font-sans">
                  <span className="font-semibold text-black">GSTIN:</span> {client.gstin}
                </div>
              )}
              {client.pan && (
                <div className="text-neutral-900 font-sans">
                  <span className="font-semibold text-black">PAN:</span> {client.pan}
                </div>
              )}
              {client.phone && (
                <div className="text-neutral-900 font-sans">
                  <span className="font-semibold text-black">Phone:</span> {client.phone}
                </div>
              )}
              {client.state && (
                <div className="text-neutral-900 font-sans">
                  <span className="font-semibold text-black">State:</span> {client.state}
                </div>
              )}
            </div>

            {/* Invoice Metadata (Right Column) */}
            <div className="col-span-5 text-right space-y-1 font-sans text-neutral-900">
              <div>
                <span className="font-semibold">Invoice No:</span>{' '}
                <span className="font-bold font-mono text-black">{formattedInvoiceNo}</span>
              </div>
              <div>
                <span className="font-semibold">Invoice Date:</span>{' '}
                <span>{formattedDate}</span>
              </div>
              {invoice.po_number && (
                <div>
                  <span className="font-semibold">PO No:</span>{' '}
                  <span>{invoice.po_number}</span>
                </div>
              )}
              <div>
                <span className="font-semibold">Place of Supply:</span>{' '}
                <span>{placeOfSupply}</span>
              </div>
              <div>
                <span className="font-semibold">Payment Terms:</span>{' '}
                <span>30 Days (Due {dueDate})</span>
              </div>
            </div>
          </div>

          {/* ── LINE ITEMS TABLE (Forest Green Header with Exact Print Color) ── */}
          <div className="mb-4">
            <table className="w-full text-[11px] border-collapse font-sans">
              <thead>
                <tr 
                  style={{
                    backgroundColor: '#2e7d32',
                    color: '#ffffff',
                    WebkitPrintColorAdjust: 'exact',
                    printColorAdjust: 'exact'
                  }}
                >
                  <th className="py-2.5 px-2 text-center w-8 font-bold">#</th>
                  <th className="py-2.5 px-3 text-left font-bold">Description / Particulars</th>
                  <th className="py-2.5 px-2 text-center w-20 font-bold">HSN/SAC</th>
                  <th className="py-2.5 px-2 text-center w-16 font-bold">Qty<br/><span className="text-[10px] font-normal">(Hrs)</span></th>
                  <th className="py-2.5 px-3 text-right w-24 font-bold">Rate (₹)</th>
                  <th className="py-2.5 px-2 text-center w-16 font-bold">GST %</th>
                  <th className="py-2.5 px-3 text-right w-28 font-bold">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {items.map((row, idx) => (
                  <tr key={idx} className="text-neutral-900 align-top">
                    <td className="py-3 px-2 text-center font-mono text-neutral-600">{idx + 1}</td>
                    <td className="py-3 px-3">
                      <div className="font-medium text-black">
                        {row.item || 'Color Grading & DI Mastering Services'}
                        {row.project_name ? ` — Project: "${row.project_name}"` : ''}
                      </div>
                      {(row.colorist || row.unit === 'HRS') && (
                        <div className="text-[10px] text-neutral-500 mt-1">
                          Colorist: {row.colorist || 'Senior Post Team'} | Booking: {row.qty || 1} Hrs @ ₹{Number(row.priceUnit || 0).toLocaleString('en-IN')}/hr
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-2 text-center font-mono text-neutral-700">{row.hsn || '999612'}</td>
                    <td className="py-3 px-2 text-center font-mono">{row.qty || 1}</td>
                    <td className="py-3 px-3 text-right font-mono">
                      {Number(row.priceUnit || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-2 text-center font-mono">
                      {row.taxPct || 18}%
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-medium">
                      {Number(row.amount || (Number(row.qty || 1) * Number(row.priceUnit || 0))).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── TOTALS CALCULATION BLOCK (Right Aligned) ── */}
          <div className="flex justify-end mt-3 text-[11px] font-sans">
            <div className="w-80 space-y-1.5">
              <div className="flex justify-between py-0.5 px-3">
                <span className="text-neutral-700 font-medium">Subtotal:</span>
                <span className="font-mono font-medium">₹ {baseAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>

              {isIgst ? (
                <div className="flex justify-between py-0.5 px-3">
                  <span className="text-neutral-700 font-medium">IGST (18%):</span>
                  <span className="font-mono font-medium">₹ {igstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              ) : (
                <>
                  <div className="flex justify-between py-0.5 px-3">
                    <span className="text-neutral-700 font-medium">CGST (9%):</span>
                    <span className="font-mono font-medium">₹ {cgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between py-0.5 px-3">
                    <span className="text-neutral-700 font-medium">SGST (9%):</span>
                    <span className="font-mono font-medium">₹ {sgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                </>
              )}

              {/* Solid Forest Green Grand Total Box */}
              <div 
                className="flex justify-between py-2 px-3 font-bold rounded-sm text-xs mt-1 shadow-sm"
                style={{
                  backgroundColor: '#2e7d32',
                  color: '#ffffff',
                  WebkitPrintColorAdjust: 'exact',
                  printColorAdjust: 'exact'
                }}
              >
                <span>Grand Total (Incl. GST):</span>
                <span className="font-mono font-bold">
                  ₹ {grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* ── AMOUNT IN WORDS ── */}
          <div className="mt-5 mb-2 text-[11px] font-sans text-neutral-800">
            <span className="font-bold text-black">Amount in Words:</span> {numberToWordsINR(grandTotal)}
          </div>
        </div>

        {/* ── FOOTER (Anchored to Bottom of A4 Page) ── */}
        <div className="mt-auto pt-4">
          {/* Forest Green Divider Line */}
          <div 
            className="w-full mb-3.5" 
            style={{
              borderBottom: '2px solid #2e7d32',
              WebkitPrintColorAdjust: 'exact',
              printColorAdjust: 'exact'
            }}
          ></div>

          <div className="grid grid-cols-12 gap-4 text-[11px] font-sans items-start">
            {/* Left: Bank Details */}
            <div className="col-span-7 space-y-1 text-neutral-800 leading-snug">
              <div className="font-bold text-black mb-1.5 text-[11px]">Bank Payment Details:</div>
              <div><span className="font-medium text-neutral-900">Bank Name:</span> HDFC Bank Ltd</div>
              <div><span className="font-medium text-neutral-900">Account Holder:</span> CINELOOM POSTWORKS PRIVATE LIMITED</div>
              <div>
                <span className="font-medium text-neutral-900">Account No:</span> 50200012345678 |{' '}
                <span className="font-medium text-neutral-900">IFSC:</span> HDFC0000123
              </div>
              <div><span className="font-medium text-neutral-900">Branch:</span> Santacruz West, Mumbai</div>
            </div>

            {/* Right: Company Signature */}
            <div className="col-span-5 text-right flex flex-col items-end">
              <div className="font-bold text-black text-[11px] leading-tight mb-1">
                For CINELOOM POSTWORKS PRIVATE LIMITED
              </div>
              <div className="py-1">
                <img 
                  src={AUTHORIZED_SIGNATURE_BASE64} 
                  alt="Authorized Signatory" 
                  className="h-12 w-auto object-contain mr-4" 
                />
              </div>
              <div className="text-[11px] text-neutral-700 mr-4 font-medium">
                Authorized Signatory
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
