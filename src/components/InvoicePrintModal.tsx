import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Invoice, WorkshopInfo } from '../types';
import { numberToFrenchWords, numberToArabicWords, formatDZD } from '../utils/numberToWords';
import { Printer, X, FileText, CheckCircle, AlertCircle } from 'lucide-react';

interface InvoicePrintModalProps {
  invoice: Invoice;
  workshop: WorkshopInfo;
  isOpen: boolean;
  onClose: () => void;
}

export const InvoicePrintModal: React.FC<InvoicePrintModalProps> = ({
  invoice,
  workshop,
  isOpen,
  onClose,
}) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      const qrData = workshop.qrLocationUrl || `https://maps.google.com/?q=${encodeURIComponent(workshop.address)}`;
      QRCode.toDataURL(qrData, {
        width: 140,
        margin: 1,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      })
        .then((url) => setQrCodeUrl(url))
        .catch((err) => console.error('Error generating QR', err));
    }
  }, [isOpen, workshop]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const getPaymentMethodLabel = (method: Invoice['paymentMethod']) => {
    switch (method) {
      case 'cash':
        return 'Espèces (نقداً)';
      case 'virement':
        return 'Virement Bancaire BNA (تحويل بنكي)';
      case 'cheque':
        return 'Chèque Bancaire (شيك)';
      case 'credit':
        return 'À Crédit / Dette (بالآجل - دين)';
      default:
        return 'Espèces';
    }
  };

  // Pad items so the table fills the middle of the vertical A4 sheet with authentic proportions
  const minTargetRows = 6;
  const emptyRowsCount = Math.max(0, minTargetRows - invoice.items.length);
  const emptyRows = Array.from({ length: emptyRowsCount });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      {/* Modal Dialog Container */}
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-xl shadow-2xl flex flex-col my-8 text-slate-100 max-h-[92vh]">
        {/* Modal Top Control Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 bg-slate-800/80 rounded-t-xl no-print">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-blue-400" />
            <div>
              <h2 className="text-base font-bold text-white">معاينة الفاتورة الرسمية (Facture A4)</h2>
              <p className="text-xs text-slate-400">
                رقم الفاتورة: {invoice.invoiceNumber} • الزبون: {invoice.customerName} • طريقة الدفع: {getPaymentMethodLabel(invoice.paymentMethod)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-500 shadow-sm transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              طباعة / حفظ PDF (A4)
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
              title="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Preview Container */}
        <div className="p-6 overflow-y-auto bg-slate-950/60 flex justify-center">
          {/* Printable Document Sheet: Fills 100% of A4 portrait sheet both horizontally & vertically */}
          <div
            id="printable-document"
            dir="ltr"
            className="w-[210mm] min-h-[297mm] print:w-full print:min-w-full print:h-[275mm] print:min-h-[275mm] print:max-h-[278mm] print:p-0 bg-white text-black p-8 font-sans shadow-lg relative flex flex-col justify-between"
            style={{ boxSizing: 'border-box' }}
          >
            {/* UPPER SECTION: Fills upper and middle area */}
            <div className="flex-1 flex flex-col justify-start">
              {/* TOP HEADER SECTION */}
              <div className="print-avoid-break relative flex justify-between items-start border-b-2 border-transparent pb-3">
                {/* Left: Stylized KS Logo & Workshop Identity */}
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-slate-900 text-white font-extrabold flex items-center justify-center rounded-sm text-3xl tracking-tighter border-2 border-slate-900 shadow-sm">
                    <span>KS</span>
                  </div>
                  <div>
                    <h1 className="text-2xl font-black tracking-wide text-slate-900 uppercase">
                      {workshop.entreprise}
                    </h1>
                    <p className="text-[11px] font-bold text-slate-700 tracking-wider uppercase">
                      {workshop.subTitle}
                    </p>
                  </div>
                </div>

                {/* Right: Big Angled Slate Banner with FACTURE */}
                <div className="relative">
                  <div
                    className="bg-slate-700 text-white font-black text-3xl px-12 py-3 uppercase tracking-wider shadow-sm"
                    style={{
                      clipPath: 'polygon(15% 0%, 100% 0%, 100% 100%, 0% 100%)',
                    }}
                  >
                    FACTURE
                  </div>
                </div>
              </div>

              {/* ADMINISTRATIVE LEGAL BAR (RC, AI, Address, Phone, Email) */}
              <div className="print-avoid-break text-[10px] font-bold text-slate-800 space-y-0.5 mt-2 mb-3 leading-tight">
                <div>RC N° <span className="font-mono">{workshop.rc}</span></div>
                <div>AI N° <span className="font-mono">{workshop.ai}</span></div>
                <div>ENTREPRISE: <span className="uppercase">{workshop.entreprise}</span></div>
                <div>ADRESSE MAIL: <span>{workshop.email}</span></div>
                <div>TÉLÉPHONE: <span className="font-mono">{workshop.phone}</span></div>
                <div>ADRESSE: <span className="uppercase">{workshop.address}</span></div>
              </div>

              {/* INVOICE DETAILS 3-COLUMN STRIP */}
              <div className="print-avoid-break grid grid-cols-3 gap-4 border-t border-slate-300 pt-3 pb-3 text-xs text-slate-900">
                {/* Col 1 */}
                <div className="space-y-1">
                  <div>
                    <span className="font-black text-slate-800">FACTURÉ À: </span>
                    <span className="font-bold uppercase">{invoice.customerName}</span>
                  </div>
                  <div>
                    <span className="font-black text-slate-800">TÉLÉPHONE : </span>
                    <span className="font-mono font-medium">{invoice.customerPhone || '-'}</span>
                  </div>
                </div>

                {/* Col 2 */}
                <div className="space-y-1">
                  <div>
                    <span className="font-bold text-slate-800">Date : </span>
                    <span className="font-mono font-bold">{invoice.date}</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-800">facture N°: </span>
                    <span className="font-mono font-bold text-slate-900">{invoice.invoiceNumber}</span>
                  </div>
                </div>

                {/* Col 3 */}
                <div className="space-y-1">
                  <div>
                    <span className="font-black text-slate-800">VÉHICULE: </span>
                    <span className="font-bold uppercase">{invoice.vehicleDescription || '-'}</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-800">VIN: </span>
                    <span className="font-mono text-[11px]">{invoice.vin || '-'}</span>
                  </div>
                  {invoice.matricule && (
                    <div>
                      <span className="font-bold text-slate-800">Matricule: </span>
                      <span className="font-mono font-bold">{invoice.matricule}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* MAIN ITEMS TABLE: Spans 100% width and proper height to fill the page */}
              <div className="print-avoid-break mt-2 border-2 border-black">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-600 text-white text-xs font-bold uppercase tracking-wider">
                      <th className="py-2.5 px-3 text-left border-r-2 border-black">Description des Prestations / Réparations</th>
                      <th className="py-2.5 px-3 text-center border-r-2 border-black w-24">QUANTITÉ</th>
                      <th className="py-2.5 px-3 text-right border-r-2 border-black w-36">PRIX U</th>
                      <th className="py-2.5 px-3 text-right w-36">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black text-xs font-bold">
                    {invoice.items.map((item, idx) => (
                      <tr key={idx} className="h-9">
                        <td className="py-2 px-3 text-left border-r-2 border-black uppercase text-slate-900 font-extrabold">
                          {item.description}
                        </td>
                        <td className="py-2 px-3 text-center border-r-2 border-black font-mono font-black">
                          {String(item.quantity).padStart(2, '0')}
                        </td>
                        <td className="py-2 px-3 text-right border-r-2 border-black font-mono">
                          {item.unitPrice.toFixed(2)} DZD
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-black text-slate-900">
                          {item.total.toFixed(2)} DZD
                        </td>
                      </tr>
                    ))}

                    {/* Empty placeholder rows to fill standard A4 sheet visually and gracefully */}
                    {emptyRows.map((_, idx) => (
                      <tr key={`empty-${idx}`} className="h-9">
                        <td className="py-2 px-3 border-r-2 border-black">&nbsp;</td>
                        <td className="py-2 px-3 border-r-2 border-black">&nbsp;</td>
                        <td className="py-2 px-3 border-r-2 border-black">&nbsp;</td>
                        <td className="py-2 px-3">&nbsp;</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* TOTALS & SUMMARY SECTION (T.T.C, Montant Versé, Reste à Payer) */}
              <div className="print-avoid-break flex justify-between items-start mt-3">
                {/* Left: Stamp & Signature Area */}
                <div className="w-1/2 pt-1">
                  <div className="text-xs font-bold text-slate-900 mb-1.5">Cachet et signature:</div>
                  <div className="w-56 h-22 border border-dashed border-slate-400 rounded-sm p-2 flex flex-col justify-end text-[9px] text-slate-400">
                    <span className="text-center font-bold text-slate-600 uppercase">Atelier {workshop.entreprise} Relizane</span>
                  </div>
                </div>

                {/* Right: Totals Box with Slate Highlight and Detailed Settlement Status */}
                <div className="w-80 space-y-1.5 text-xs">
                  {invoice.discount > 0 && (
                    <div className="flex justify-between py-1 px-2 border-b border-slate-200">
                      <span className="font-medium text-slate-600">Sous-total:</span>
                      <span className="font-mono font-bold">{invoice.subtotal.toFixed(2)} DZD</span>
                    </div>
                  )}
                  {invoice.discount > 0 && (
                    <div className="flex justify-between py-1 px-2 text-rose-700 border-b border-slate-200">
                      <span className="font-medium">Remise commerciale:</span>
                      <span className="font-mono font-bold">-{invoice.discount.toFixed(2)} DZD</span>
                    </div>
                  )}

                  {/* Highlighted Total T.T.C Box */}
                  <div className="flex justify-between items-center bg-slate-700 text-white font-extrabold px-3.5 py-2.5 rounded-sm shadow-sm">
                    <span className="uppercase text-sm tracking-wide">Total T.T.C :</span>
                    <span className="text-base font-mono font-black">{invoice.totalTTC.toFixed(2)} DZD</span>
                  </div>

                  {/* Settlement Financial Details (المبلغ المدفوع والمبلغ المتبقي) */}
                  <div className="pt-1.5 space-y-1 text-xs border border-slate-300 rounded p-2 bg-slate-50">
                    <div className="flex justify-between items-center text-slate-900 font-bold">
                      <span>Montant Versé (المبلغ المدفوع):</span>
                      <span className="font-mono text-emerald-800 font-extrabold text-sm">
                        {invoice.amountPaid.toFixed(2)} DZD
                      </span>
                    </div>

                    <div className={`flex justify-between items-center font-bold pt-1 border-t border-slate-200 ${invoice.amountDue > 0 ? 'text-rose-700' : 'text-slate-600'}`}>
                      <span>Reste à Payer (المبلغ المتبقي كدين):</span>
                      <span className="font-mono font-black text-sm">
                        {invoice.amountDue.toFixed(2)} DZD
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-[11px] text-slate-600 pt-0.5">
                      <span>Mode de règlement:</span>
                      <span className="font-semibold text-slate-900">
                        {getPaymentMethodLabel(invoice.paymentMethod)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* LEGAL AMOUNT IN WORDS */}
              <div className="print-avoid-break mt-3 p-2.5 bg-slate-50 border border-slate-200 rounded text-[11px] space-y-0.5">
                <div className="text-slate-900">
                  <span className="font-bold">Arrêtée la présente facture à la somme de: </span>
                  <span className="font-medium italic">{numberToFrenchWords(invoice.totalTTC)}</span>
                </div>
                <div className="text-slate-900 text-right font-arabic" dir="rtl">
                  <span className="font-bold">أوقفت هذه الفاتورة عند مبلغ: </span>
                  <span className="font-medium">{numberToArabicWords(invoice.totalTTC)}</span>
                </div>
              </div>
            </div>

            {/* BOTTOM FOOTER SECTION (BANK INFO + QR CODE + MOTTO) - Pinned to the bottom line of A4 sheet */}
            <div className="print-avoid-break mt-auto pt-3 border-t-2 border-slate-700 flex justify-between items-end text-xs">
              {/* Bank Details */}
              <div className="text-[11px] leading-tight text-slate-800 space-y-1">
                <div className="font-extrabold text-slate-900 uppercase">
                  Mode de paiement : {getPaymentMethodLabel(invoice.paymentMethod)}
                </div>
                <div>Nom de banque : <span className="font-bold">{workshop.bankName}</span></div>
                <div>Numéro de compte : <span className="font-mono font-bold tracking-wider">{workshop.bankAccount}</span></div>
              </div>

              {/* Interactive High-Res QR Code for Relizane Workshop */}
              {qrCodeUrl && (
                <div className="flex flex-col items-center">
                  <img
                    src={qrCodeUrl}
                    alt="KraftSchmiede Relizane Location QR"
                    className="w-16 h-16 border border-slate-300 p-0.5 bg-white"
                  />
                  <span className="text-[9px] font-bold text-slate-600 mt-0.5">Localisation Atelier</span>
                </div>
              )}

              {/* Tagline / Motto */}
              <div className="text-right">
                <p className="text-xs font-bold italic text-slate-800 tracking-wide">
                  {workshop.tagline}
                </p>
                <p className="text-[9px] text-slate-500 mt-0.5">
                  Route belhacel 48000, Relizane • Algérie
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
