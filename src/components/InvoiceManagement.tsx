import React, { useState } from 'react';
import { Invoice, InvoiceItem, WorkshopInfo, PaymentMethod } from '../types';
import { formatDZD } from '../utils/numberToWords';
import {
  FileText,
  Plus,
  Printer,
  Search,
  CheckCircle,
  AlertCircle,
  DollarSign,
} from 'lucide-react';

interface InvoiceManagementProps {
  invoices: Invoice[];
  workshop: WorkshopInfo;
  onPrintInvoice: (invoice: Invoice) => void;
  onRecordPayment: (invoiceId: string, amount: number, paymentMethod: PaymentMethod, notes?: string) => void;
  onCreateDirectInvoice: (invoice: Omit<Invoice, 'id' | 'invoiceNumber' | 'createdAt'>) => void;
}

export const InvoiceManagement: React.FC<InvoiceManagementProps> = ({
  invoices,
  workshop,
  onPrintInvoice,
  onRecordPayment,
  onCreateDirectInvoice,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'partial' | 'unpaid'>('all');

  // Modals
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<Invoice | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [paymentNotes, setPaymentNotes] = useState<string>('');

  const [showDirectInvoiceModal, setShowDirectInvoiceModal] = useState(false);
  const [directForm, setDirectForm] = useState({
    customerName: '',
    customerPhone: '',
    vehicleDescription: '',
    matricule: '',
    vin: '',
    description: '',
    quantity: 1,
    unitPrice: 0,
    discount: 0,
    amountPaid: 0,
    paymentMethod: 'cash' as PaymentMethod,
  });

  // Calculations
  const totalBilled = invoices.reduce((acc, inv) => acc + inv.totalTTC, 0);
  const totalCollected = invoices.reduce((acc, inv) => acc + inv.amountPaid, 0);
  const totalOutstanding = invoices.reduce((acc, inv) => acc + inv.amountDue, 0);

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.customerPhone.includes(searchQuery) ||
      (inv.matricule && inv.matricule.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (inv.vehicleDescription && inv.vehicleDescription.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoiceForPayment || paymentAmount <= 0) return;

    onRecordPayment(
      selectedInvoiceForPayment.id,
      Number(paymentAmount),
      paymentMethod,
      paymentNotes || 'تحصيل دفعة نقدية'
    );

    setShowPaymentModal(false);
    setSelectedInvoiceForPayment(null);
  };

  const handleDirectInvoiceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!directForm.customerName.trim() || !directForm.description.trim()) return;

    const subtotal = directForm.quantity * Number(directForm.unitPrice);
    const totalTTC = Math.max(0, subtotal - Number(directForm.discount));
    const paid = Number(directForm.amountPaid);
    const due = Math.max(0, totalTTC - paid);
    const status: Invoice['status'] = due === 0 ? 'paid' : paid > 0 ? 'partial' : 'unpaid';

    const item: InvoiceItem = {
      id: `item-${Date.now()}`,
      description: directForm.description.toUpperCase(),
      type: 'labor',
      quantity: directForm.quantity,
      unitPrice: Number(directForm.unitPrice),
      total: subtotal,
    };

    onCreateDirectInvoice({
      date: new Date().toISOString().split('T')[0],
      customerName: directForm.customerName.trim(),
      customerPhone: directForm.customerPhone.trim(),
      vehicleDescription: directForm.vehicleDescription.trim() || 'خدمة سريعة بالورشة',
      vin: directForm.vin.trim().toUpperCase() || 'VF...',
      matricule: directForm.matricule.trim() || 'غ/م',
      items: [item],
      subtotal,
      discount: Number(directForm.discount),
      totalTTC,
      amountPaid: paid,
      amountDue: due,
      paymentMethod: directForm.paymentMethod,
      status,
      bankName: workshop.bankName,
      bankAccount: workshop.bankAccount,
      notes: 'Facture directe comptoir KraftSchmiede',
    });

    setDirectForm({
      customerName: '',
      customerPhone: '',
      vehicleDescription: '',
      matricule: '',
      vin: '',
      description: '',
      quantity: 1,
      unitPrice: 0,
      discount: 0,
      amountPaid: 0,
      paymentMethod: 'cash',
    });
    setShowDirectInvoiceModal(false);
  };

  const getMethodBadge = (method: PaymentMethod) => {
    switch (method) {
      case 'cash':
        return 'نقداً (Espèces)';
      case 'virement':
        return 'تحويل BNA';
      case 'cheque':
        return 'شيك بنكي';
      case 'credit':
        return 'آجل (Crédit)';
      default:
        return 'نقداً';
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER & QUICK ACTIONS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-800/80 p-5 rounded-xl border border-slate-700/80">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-400" />
            الفواتير الرسمية وسندات القبض (Facturation A4)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            إصدار الفاتورة الرسمية A4 بتصميم KraftSchmiede، وتحديد طريقة التسديد والمبلغ المدفوع والمتبقي كدين.
          </p>
        </div>

        <button
          onClick={() => setShowDirectInvoiceModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-sm transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          إنشاء فاتورة سريعة مباشرة
        </button>
      </div>

      {/* FINANCIAL METRICS SUMMARY */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-slate-700/80 bg-slate-800/60 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400">إجمالي قيمة الفواتير الصادرة</span>
            <div className="text-2xl font-bold font-mono text-white mt-1">
              {formatDZD(totalBilled)}
            </div>
            <span className="text-[10px] text-slate-500">{invoices.length} فواتير مسجلة</span>
          </div>
          <div className="p-3 bg-blue-500/10 text-blue-400 rounded-lg">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-700/80 bg-slate-800/60 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400">المبالغ المقبوضة فعلياً (Montant Versé)</span>
            <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
              {formatDZD(totalCollected)}
            </div>
            <span className="text-[10px] text-emerald-400">تم إيداعها فوراً بصندوق اليومية</span>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-lg">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-700/80 bg-slate-800/60 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400">ديون الزبائن المتبقية (Reste à Payer)</span>
            <div className={`text-2xl font-bold font-mono mt-1 ${totalOutstanding > 0 ? 'text-rose-400' : 'text-slate-300'}`}>
              {formatDZD(totalOutstanding)}
            </div>
            <span className="text-[10px] text-rose-400 font-semibold">مستحقات مسجلة في ديون الزبائن</span>
          </div>
          <div className={`p-3 rounded-lg ${totalOutstanding > 0 ? 'bg-rose-500/10 text-rose-400' : 'bg-slate-700 text-slate-400'}`}>
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-slate-800/50 p-3 rounded-xl border border-slate-700/60 text-xs">
        <div className="flex items-center gap-2 flex-1 max-w-md bg-slate-900 border border-slate-700 rounded-lg px-3 py-2">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="البحث برقم الفاتورة، الزبون، الهاتف أو لوحة الترقيم..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-white focus:outline-none placeholder:text-slate-500 text-xs"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-blue-600 border-blue-500 text-white'
                : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
            }`}
          >
            الكل ({invoices.length})
          </button>
          <button
            onClick={() => setStatusFilter('paid')}
            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer ${
              statusFilter === 'paid'
                ? 'bg-emerald-600 border-emerald-500 text-white'
                : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
            }`}
          >
            مسددة بالكامل ({invoices.filter((i) => i.status === 'paid').length})
          </button>
          <button
            onClick={() => setStatusFilter('partial')}
            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer ${
              statusFilter === 'partial'
                ? 'bg-amber-600 border-amber-500 text-white'
                : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
            }`}
          >
            دفع جزئي ({invoices.filter((i) => i.status === 'partial').length})
          </button>
          <button
            onClick={() => setStatusFilter('unpaid')}
            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer ${
              statusFilter === 'unpaid'
                ? 'bg-rose-600 border-rose-500 text-white'
                : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
            }`}
          >
            غير مسددة / دين ({invoices.filter((i) => i.status === 'unpaid').length})
          </button>
        </div>
      </div>

      {/* INVOICES TABLE */}
      <div className="bg-slate-800/80 rounded-xl border border-slate-700/80 overflow-hidden">
        {filteredInvoices.length === 0 ? (
          <div className="text-center py-16 text-slate-400 text-xs">
            لا توجد فواتير مطابقة للبحث أو التصفية.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right">
              <thead>
                <tr className="bg-slate-900/60 border-b border-slate-700 text-slate-400 font-semibold">
                  <th className="py-3 px-4">رقم الفاتورة</th>
                  <th className="py-3 px-4">التاريخ</th>
                  <th className="py-3 px-4">الزبون والسيارة</th>
                  <th className="py-3 px-4">طريقة التسديد</th>
                  <th className="py-3 px-4">الإجمالي T.T.C</th>
                  <th className="py-3 px-4">المدفوع (Versé)</th>
                  <th className="py-3 px-4">المتبقي (الدين)</th>
                  <th className="py-3 px-4 text-center">الحالة</th>
                  <th className="py-3 px-4 text-left">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60 font-medium">
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-blue-400">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400">{inv.date}</td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-white">{inv.customerName}</div>
                      <div className="text-[11px] text-slate-400">
                        {inv.vehicleDescription} • {inv.matricule}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-[10px] text-slate-300">
                        {getMethodBadge(inv.paymentMethod)}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-white">
                      {inv.totalTTC.toLocaleString()} دج
                    </td>
                    <td className="py-3 px-4 font-mono text-emerald-400 font-bold">
                      {inv.amountPaid.toLocaleString()} دج
                    </td>
                    <td className="py-3 px-4 font-mono">
                      <span className={inv.amountDue > 0 ? 'text-rose-400 font-bold' : 'text-slate-400'}>
                        {inv.amountDue.toLocaleString()} دج
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                          inv.status === 'paid'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : inv.status === 'partial'
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : 'bg-rose-950 text-rose-300 border border-rose-800'
                        }`}
                      >
                        {inv.status === 'paid'
                          ? 'مسددة بالكامل'
                          : inv.status === 'partial'
                          ? 'دفعة جزئية'
                          : 'غير مسددة / دين'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-left">
                      <div className="flex items-center justify-end gap-2">
                        {inv.amountDue > 0 && (
                          <button
                            onClick={() => {
                              setSelectedInvoiceForPayment(inv);
                              setPaymentAmount(inv.amountDue);
                              setShowPaymentModal(true);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-emerald-300 bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 rounded cursor-pointer"
                            title="تحصيل دفعة"
                          >
                            <DollarSign className="w-3.5 h-3.5" />
                            تحصيل دين
                          </button>
                        )}
                        <button
                          onClick={() => onPrintInvoice(inv)}
                          className="inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-semibold text-white bg-slate-700 hover:bg-slate-600 rounded cursor-pointer"
                          title="معاينة وطباعة الفاتورة الرسمية A4"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          معاينة A4
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: COLLECT DEBT PAYMENT */}
      {showPaymentModal && selectedInvoiceForPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-md w-full p-6 text-slate-100 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-2">تحصيل دفعة من الزبون</h3>
            <p className="text-xs text-slate-400 mb-4">
              الفاتورة: {selectedInvoiceForPayment.invoiceNumber} • الزبون: {selectedInvoiceForPayment.customerName}
            </p>

            <form onSubmit={handlePaymentSubmit} className="space-y-4 text-xs">
              <div className="p-3 bg-slate-800 rounded border border-slate-700 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">إجمالي الفاتورة:</span>
                  <span className="font-mono font-bold text-white">
                    {selectedInvoiceForPayment.totalTTC.toLocaleString()} دج
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">المسدد سابقاً:</span>
                  <span className="font-mono text-emerald-400">
                    {selectedInvoiceForPayment.amountPaid.toLocaleString()} دج
                  </span>
                </div>
                <div className="flex justify-between font-bold text-rose-400 pt-1 border-t border-slate-700">
                  <span>المبلغ المتبقي كدين:</span>
                  <span className="font-mono">
                    {selectedInvoiceForPayment.amountDue.toLocaleString()} دج
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">المبلغ المستلم الآن (دج) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    max={selectedInvoiceForPayment.amountDue}
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 font-mono text-emerald-400 font-bold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">طريقة الدفع</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none"
                  >
                    <option value="cash">نقداً (Espèces)</option>
                    <option value="virement">تحويل بنكي BNA</option>
                    <option value="cheque">شيك</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">ملاحظات التحصيل</label>
                <input
                  type="text"
                  placeholder="مثال: تسديد نقدي مباشر في الورشة"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none"
                />
              </div>

              <div className="p-2.5 bg-emerald-950/40 rounded border border-emerald-800/60 text-emerald-300 text-[11px]">
                يدخل هذا المبلغ تلقائياً كـ مدخول (Entrée) في الصندوق اليومي لورشة KraftSchmiede ويحدث رصيد الزبون.
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg cursor-pointer"
                >
                  تأكيد التحصيل
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DIRECT QUICK INVOICE */}
      {showDirectInvoiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-lg w-full p-6 text-slate-100 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-4">إنشاء فاتورة سريعة مباشرة</h3>
            {(() => {
              const subtotal = directForm.quantity * Number(directForm.unitPrice);
              const totalTTC = Math.max(0, subtotal - Number(directForm.discount));
              const due = Math.max(0, totalTTC - Number(directForm.amountPaid));

              return (
                <form onSubmit={handleDirectInvoiceSubmit} className="space-y-4 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 mb-1 font-semibold">اسم الزبون *</label>
                      <input
                        type="text"
                        required
                        placeholder="مثال: أحمد قاصدي"
                        value={directForm.customerName}
                        onChange={(e) => setDirectForm({ ...directForm, customerName: e.target.value })}
                        className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 mb-1 font-semibold">رقم الهاتف</label>
                      <input
                        type="text"
                        placeholder="0550..."
                        value={directForm.customerPhone}
                        onChange={(e) => setDirectForm({ ...directForm, customerPhone: e.target.value })}
                        className="w-full bg-slate-800 border border-slate-700 rounded p-2 font-mono text-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 mb-1 font-semibold">السيارة</label>
                      <input
                        type="text"
                        placeholder="Peugeot 208"
                        value={directForm.vehicleDescription}
                        onChange={(e) => setDirectForm({ ...directForm, vehicleDescription: e.target.value })}
                        className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 mb-1 font-semibold">لوحة الترقيم</label>
                      <input
                        type="text"
                        placeholder="00123-118-48"
                        value={directForm.matricule}
                        onChange={(e) => setDirectForm({ ...directForm, matricule: e.target.value })}
                        className="w-full bg-slate-800 border border-slate-700 rounded p-2 font-mono text-white focus:outline-none uppercase"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 mb-1 font-semibold">الخدمة أو القطعة (البيان) *</label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: شحن غاز مكيف السيارة + تبديل فلتر"
                      value={directForm.description}
                      onChange={(e) => setDirectForm({ ...directForm, description: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-300 mb-1 font-semibold">الكمية</label>
                      <input
                        type="number"
                        min="1"
                        value={directForm.quantity}
                        onChange={(e) => setDirectForm({ ...directForm, quantity: Number(e.target.value) })}
                        className="w-full bg-slate-800 border border-slate-700 rounded p-2 font-mono text-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 mb-1 font-semibold">السعر الإجمالي (دج) *</label>
                      <input
                        type="number"
                        required
                        min="0"
                        step="50"
                        value={directForm.unitPrice}
                        onChange={(e) => setDirectForm({ ...directForm, unitPrice: Number(e.target.value) })}
                        className="w-full bg-slate-800 border border-slate-700 rounded p-2 font-mono text-emerald-400 font-bold focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 mb-1 font-semibold">تخفيض (Remise)</label>
                      <input
                        type="number"
                        min="0"
                        value={directForm.discount}
                        onChange={(e) => setDirectForm({ ...directForm, discount: Number(e.target.value) })}
                        className="w-full bg-slate-800 border border-slate-700 rounded p-2 font-mono text-rose-400 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div>
                    <label className="block text-slate-300 mb-1 font-semibold">طريقة التسديد</label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {(['cash', 'virement', 'cheque', 'credit'] as PaymentMethod[]).map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => {
                            setDirectForm((prev) => ({
                              ...prev,
                              paymentMethod: m,
                              amountPaid: m === 'credit' ? 0 : prev.amountPaid,
                            }));
                          }}
                          className={`p-1.5 rounded border text-center font-semibold cursor-pointer ${
                            directForm.paymentMethod === m
                              ? 'bg-blue-600 border-blue-500 text-white'
                              : 'bg-slate-800 border-slate-700 text-slate-300'
                          }`}
                        >
                          {getMethodBadge(m)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Montant Versé & Reste */}
                  <div className="grid grid-cols-2 gap-3 p-3 bg-slate-800 rounded border border-slate-700">
                    <div>
                      <label className="block text-slate-300 mb-1 font-semibold">
                        المبلغ المدفوع الآن (Versé)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max={totalTTC}
                        value={directForm.amountPaid}
                        onChange={(e) => setDirectForm({ ...directForm, amountPaid: Number(e.target.value) })}
                        className="w-full bg-slate-900 border border-slate-700 rounded p-2 font-mono text-emerald-400 font-bold focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 mb-1 font-semibold">المتبقي (الدين)</label>
                      <div className="w-full bg-slate-900 border border-slate-700 rounded p-2 font-mono text-rose-400 font-bold">
                        {due.toLocaleString()} دج
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setShowDirectInvoiceModal(false)}
                      className="px-4 py-2 text-slate-400 hover:text-white cursor-pointer"
                    >
                      إلغاء
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg cursor-pointer"
                    >
                      إصدار الفاتورة A4
                    </button>
                  </div>
                </form>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};
