import React, { useState } from 'react';
import {
  RepairOrder,
  StockItem,
  Worker,
  RepairStatus,
  InvoiceItem,
  OBDCode,
  PaymentMethod,
} from '../types';
import { formatDZD } from '../utils/numberToWords';
import {
  Wrench,
  Plus,
  Printer,
  FileCheck2,
  AlertCircle,
  Car,
  User,
  Clock,
  CheckCircle2,
  Cpu,
  Trash2,
  ChevronRight,
  Package,
  DollarSign,
} from 'lucide-react';

interface RepairAndDiagnosticViewProps {
  orders: RepairOrder[];
  stockItems: StockItem[];
  workers: Worker[];
  onAddOrder: (order: Omit<RepairOrder, 'id' | 'orderNumber' | 'createdAt'>) => void;
  onUpdateOrder: (order: RepairOrder) => void;
  onConvertToInvoice: (
    order: RepairOrder,
    billingDetails: {
      items: InvoiceItem[];
      discount: number;
      amountPaid: number;
      paymentMethod: PaymentMethod;
    }
  ) => void;
  onPrintOrder: (order: RepairOrder) => void;
}

export const RepairAndDiagnosticView: React.FC<RepairAndDiagnosticViewProps> = ({
  orders,
  stockItems,
  workers,
  onAddOrder,
  onUpdateOrder,
  onConvertToInvoice,
  onPrintOrder,
}) => {
  const [activeFilter, setActiveFilter] = useState<RepairStatus | 'all'>('all');
  const [selectedOrder, setSelectedOrder] = useState<RepairOrder | null>(orders[0] || null);
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);

  // Conversion / Invoicing Modal
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceForm, setInvoiceForm] = useState({
    discount: 0,
    amountPaid: 0,
    paymentMethod: 'cash' as PaymentMethod,
  });

  // Adding technical task/part to active order (pure technical list in OR)
  const [newItemType, setNewItemType] = useState<'part' | 'labor'>('part');
  const [selectedStockItemId, setSelectedStockItemId] = useState('');
  const [customDescription, setCustomDescription] = useState('');
  const [itemQuantity, setItemQuantity] = useState(1);
  const [itemUnitPrice, setItemUnitPrice] = useState(0);

  // New OBD Code
  const [newObdCode, setNewObdCode] = useState({
    code: '',
    description: '',
    severity: 'medium' as 'low' | 'medium' | 'high',
  });

  // New Repair Order Form state
  const [newOrderForm, setNewOrderForm] = useState({
    customerName: '',
    customerPhone: '',
    customerAddress: '',
    brand: '',
    model: '',
    year: '',
    matricule: '',
    vin: '',
    mileageKm: 0,
    fuelLevel: '50%',
    customerComplaint: '',
    observations: '',
    assignedTechnicianName: '',
    checklist: {
      carrosserieRaye: false,
      roueSecours: true,
      cricCle: true,
      documentsBord: true,
      objetsValeur: false,
      temoinAllume: false,
    },
  });

  const statuses: { key: RepairStatus; label: string; color: string }[] = [
    { key: 'reception', label: '1. الاستقبال المبدئي', color: 'border-blue-500 text-blue-400' },
    { key: 'diagnostic', label: '2. الفحص والتشخيص', color: 'border-purple-500 text-purple-400' },
    { key: 'in_progress', label: '3. قيد الإصلاح', color: 'border-amber-500 text-amber-400' },
    { key: 'ready', label: '4. جاهزة للتسليم', color: 'border-emerald-500 text-emerald-400' },
    { key: 'invoiced', label: '5. تمت الفوترة النهائية', color: 'border-slate-500 text-slate-400' },
  ];

  const filteredOrders = orders.filter((o) => activeFilter === 'all' || o.status === activeFilter);

  const handleCreateOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrderForm.customerName.trim() || !newOrderForm.brand.trim()) return;

    onAddOrder({
      date: new Date().toISOString().split('T')[0],
      customerId: `cust-${Date.now()}`,
      customerName: newOrderForm.customerName.trim(),
      customerPhone: newOrderForm.customerPhone.trim(),
      customerAddress: newOrderForm.customerAddress.trim(),
      brand: newOrderForm.brand.trim(),
      model: newOrderForm.model.trim(),
      year: newOrderForm.year.trim(),
      matricule: newOrderForm.matricule.trim() || 'غ/م',
      vin: newOrderForm.vin.trim().toUpperCase(),
      mileageKm: Number(newOrderForm.mileageKm) || 0,
      fuelLevel: newOrderForm.fuelLevel,
      customerComplaint: newOrderForm.customerComplaint.trim(),
      observations: newOrderForm.observations.trim(),
      status: 'reception',
      assignedTechnicianName: newOrderForm.assignedTechnicianName || 'فني الورشة',
      checklist: newOrderForm.checklist,
      obdCodes: [],
      mechanicalNotes: '',
      electricalNotes: '',
      items: [],
    });

    setShowNewOrderModal(false);
  };

  const handleAddItemToOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    let desc = customDescription;
    let price = Number(itemUnitPrice) || 0;
    let stockItemId: string | undefined = undefined;

    if (newItemType === 'part' && selectedStockItemId) {
      const stock = stockItems.find((s) => s.id === selectedStockItemId);
      if (stock) {
        desc = `${stock.name} (${stock.ref})`;
        price = stock.salePrice;
        stockItemId = stock.id;
      }
    }

    if (!desc.trim()) return;

    const newItem: InvoiceItem = {
      id: `item-${Date.now()}`,
      description: desc.toUpperCase(),
      type: newItemType,
      quantity: Number(itemQuantity),
      unitPrice: price,
      total: Number(itemQuantity) * price,
      stockItemId,
    };

    const updatedOrder: RepairOrder = {
      ...selectedOrder,
      items: [...selectedOrder.items, newItem],
    };

    onUpdateOrder(updatedOrder);
    setSelectedOrder(updatedOrder);

    // Reset inputs
    setCustomDescription('');
    setItemQuantity(1);
    setItemUnitPrice(0);
    setSelectedStockItemId('');
  };

  const handleRemoveItemFromOrder = (itemId: string) => {
    if (!selectedOrder) return;
    const updatedOrder: RepairOrder = {
      ...selectedOrder,
      items: selectedOrder.items.filter((i) => i.id !== itemId),
    };
    onUpdateOrder(updatedOrder);
    setSelectedOrder(updatedOrder);
  };

  const handleAddObdCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !newObdCode.code.trim()) return;

    const code: OBDCode = {
      code: newObdCode.code.toUpperCase().trim(),
      description: newObdCode.description.trim() || 'كود تشخيص عام',
      severity: newObdCode.severity,
    };

    const updatedOrder: RepairOrder = {
      ...selectedOrder,
      obdCodes: [...(selectedOrder.obdCodes || []), code],
    };

    onUpdateOrder(updatedOrder);
    setSelectedOrder(updatedOrder);
    setNewObdCode({ code: '', description: '', severity: 'medium' });
  };

  const handleUpdateStatus = (newStatus: RepairStatus) => {
    if (!selectedOrder) return;
    const updatedOrder: RepairOrder = {
      ...selectedOrder,
      status: newStatus,
    };
    onUpdateOrder(updatedOrder);
    setSelectedOrder(updatedOrder);
  };

  const openInvoiceDialog = () => {
    if (!selectedOrder) return;
    const subtotal = selectedOrder.items.reduce((acc, it) => acc + it.total, 0);
    setInvoiceForm({
      discount: 0,
      amountPaid: subtotal, // default full payment
      paymentMethod: 'cash',
    });
    setShowInvoiceModal(true);
  };

  const handleConfirmInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    onConvertToInvoice(selectedOrder, {
      items: selectedOrder.items,
      discount: Number(invoiceForm.discount),
      amountPaid: Number(invoiceForm.amountPaid),
      paymentMethod: invoiceForm.paymentMethod,
    });

    setShowInvoiceModal(false);
  };

  return (
    <div className="space-y-6">
      {/* HEADER & QUICK ACTIONS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-800/80 p-5 rounded-xl border border-slate-700/80">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Wrench className="w-6 h-6 text-blue-400" />
            الاستقبال الفني وأمر التشغيل (Ordre de Réparation & Atelier)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            تسجيل استقبال المركبة، الفحص المبدئي بدون مبالغ مالية، وحفظ تفاصيل العطل حتى الفوترة النهائية.
          </p>
        </div>

        <button
          onClick={() => setShowNewOrderModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-sm transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          تسجيل دخول سيارة وأمر تشغيل جديد
        </button>
      </div>

      {/* STAGE PIPELINE SELECTOR */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
        <button
          onClick={() => setActiveFilter('all')}
          className={`px-3 py-2 text-xs font-bold rounded-lg border transition-colors cursor-pointer ${
            activeFilter === 'all'
              ? 'bg-blue-600 border-blue-500 text-white shadow-sm'
              : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:text-white'
          }`}
        >
          كافة السيارات ({orders.length})
        </button>
        {statuses.map((st) => {
          const count = orders.filter((o) => o.status === st.key).length;
          return (
            <button
              key={st.key}
              onClick={() => setActiveFilter(st.key)}
              className={`px-3 py-2 text-xs font-bold rounded-lg border transition-colors cursor-pointer flex items-center justify-between ${
                activeFilter === st.key
                  ? 'bg-slate-700 border-slate-500 text-white shadow-sm'
                  : 'bg-slate-800/60 border-slate-700/80 text-slate-400 hover:text-white'
              }`}
            >
              <span>{st.label}</span>
              <span className="font-mono text-[11px] px-1.5 py-0.2 rounded bg-slate-900">
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 2-COLUMN WORKSPACE: LEFT LIST, RIGHT ACTIVE ORDER DETAILS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Orders List (5 cols) - STRICTLY TECHNICAL PRELIMINARY VIEW */}
        <div className="lg:col-span-5 bg-slate-800/80 rounded-xl border border-slate-700/80 p-4 space-y-3 max-h-[750px] overflow-y-auto">
          <div className="flex items-center justify-between pb-2 border-b border-slate-700">
            <h3 className="font-bold text-white text-xs uppercase tracking-wide">
              أوامر التشغيل الحالية ({filteredOrders.length})
            </h3>
            <span className="text-[11px] text-slate-400">انقر للعرض والتعديل</span>
          </div>

          {filteredOrders.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              لا توجد سيارات مسجلة في هذه المرحلة.
            </div>
          ) : (
            filteredOrders.map((order) => {
              const isSelected = selectedOrder?.id === order.id;

              return (
                <div
                  key={order.id}
                  onClick={() => setSelectedOrder(order)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-950/40 border-blue-500 shadow-md ring-1 ring-blue-500/50'
                      : 'bg-slate-900/60 border-slate-700/70 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-bold text-white text-sm flex items-center gap-1.5">
                        <Car className="w-4 h-4 text-blue-400" />
                        {order.brand} {order.model}
                      </div>
                      <div className="text-xs font-mono font-bold text-emerald-400 mt-0.5">
                        {order.matricule}
                      </div>
                    </div>
                    <span className="font-mono text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                      {order.orderNumber}
                    </span>
                  </div>

                  <div className="mt-2 text-xs text-slate-300 space-y-1">
                    <div className="flex items-center gap-1 text-slate-400">
                      <User className="w-3.5 h-3.5 text-slate-500" />
                      <span className="font-semibold text-slate-200">{order.customerName}</span>
                      <span>•</span>
                      <span className="font-mono">{order.customerPhone}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 line-clamp-1">
                      {order.customerComplaint || 'لا توجد شكوى مسجلة'}
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-400">
                      {order.items.length} أشغال وقطع مقررة
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        order.status === 'reception'
                          ? 'bg-blue-950 text-blue-300 border border-blue-800'
                          : order.status === 'diagnostic'
                          ? 'bg-purple-950 text-purple-300 border border-purple-800'
                          : order.status === 'in_progress'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : order.status === 'ready'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {statuses.find((s) => s.key === order.status)?.label}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right: Selected Order Details (7 cols) */}
        <div className="lg:col-span-7 bg-slate-800/80 rounded-xl border border-slate-700/80 p-5 space-y-5">
          {selectedOrder ? (
            <>
              {/* Top Action Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-700">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-blue-400 text-sm">
                      {selectedOrder.orderNumber}
                    </span>
                    <span className="text-xs text-slate-400">• تاريخ الاستقبال: {selectedOrder.date}</span>
                  </div>
                  <h3 className="text-lg font-bold text-white mt-0.5">
                    {selectedOrder.brand} {selectedOrder.model} ({selectedOrder.year || '2020'})
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onPrintOrder(selectedOrder)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-200 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    طباعة أمر التشغيل (A4)
                  </button>

                  <button
                    onClick={openInvoiceDialog}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm transition-colors cursor-pointer"
                  >
                    <FileCheck2 className="w-3.5 h-3.5" />
                    الانتقال للفوترة النهائية وإصدار الفاتورة
                  </button>
                </div>
              </div>

              {/* Status Switcher Bar */}
              <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-700/70">
                <span className="text-xs text-slate-400 block mb-2 font-semibold">مرحلة تقدم السيارة في الورشة:</span>
                <div className="flex flex-wrap gap-1.5 text-xs">
                  {statuses.map((st) => (
                    <button
                      key={st.key}
                      onClick={() => handleUpdateStatus(st.key)}
                      className={`px-3 py-1 rounded-md text-xs font-bold transition-colors cursor-pointer ${
                        selectedOrder.status === st.key
                          ? 'bg-blue-600 text-white shadow'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Vehicle & Customer Info Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-900/50 p-3 rounded-lg border border-slate-700/50">
                <div>
                  <span className="text-slate-400 block text-[11px]">الزبون:</span>
                  <span className="font-bold text-white">{selectedOrder.customerName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">رقم الهاتف:</span>
                  <span className="font-mono font-bold text-blue-400">{selectedOrder.customerPhone}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">لوحة الترقيم:</span>
                  <span className="font-mono font-bold text-emerald-400">{selectedOrder.matricule}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">العداد (km):</span>
                  <span className="font-mono text-slate-200">{selectedOrder.mileageKm.toLocaleString()} km</span>
                </div>
              </div>

              {/* Customer Complaint */}
              <div className="space-y-1.5 text-xs">
                <span className="font-bold text-slate-300 block">شكوى الزبون وملاحظات الاستقبال:</span>
                <div className="p-3 bg-slate-900/70 rounded-lg border border-slate-700 text-slate-200">
                  {selectedOrder.customerComplaint || 'لا توجد شكوى مسجلة'}
                </div>
              </div>

              {/* OBD Diagnostic Scanner Codes */}
              <div className="space-y-3 border-t border-slate-700 pt-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                    <Cpu className="w-4 h-4 text-purple-400" />
                    أكواد فحص السكانير (OBD Codes)
                  </h4>
                  <span className="text-[11px] text-slate-400">
                    {(selectedOrder.obdCodes || []).length} كود مسجل
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {(selectedOrder.obdCodes || []).map((c, idx) => (
                    <div
                      key={idx}
                      className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-xs"
                    >
                      <span className="font-mono font-bold text-rose-400">{c.code}</span>
                      <span className="text-slate-300">{c.description}</span>
                    </div>
                  ))}
                  {(selectedOrder.obdCodes || []).length === 0 && (
                    <span className="text-slate-500 text-xs italic">لم يتم إدراج أكواد فحص بعد.</span>
                  )}
                </div>

                <form onSubmit={handleAddObdCode} className="flex items-center gap-2 text-xs">
                  <input
                    type="text"
                    placeholder="كود (P0300...)"
                    value={newObdCode.code}
                    onChange={(e) => setNewObdCode({ ...newObdCode, code: e.target.value })}
                    className="w-24 bg-slate-900 border border-slate-700 rounded p-1.5 font-mono text-white focus:outline-none uppercase"
                  />
                  <input
                    type="text"
                    placeholder="وصف العطل"
                    value={newObdCode.description}
                    onChange={(e) => setNewObdCode({ ...newObdCode, description: e.target.value })}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded p-1.5 text-white focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded cursor-pointer"
                  >
                    + إضافة كود
                  </button>
                </form>
              </div>

              {/* Items & Labor (Technical and Diagnostic Plan) */}
              <div className="space-y-3 border-t border-slate-700 pt-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                    <Package className="w-4 h-4 text-emerald-400" />
                    قائمة الأشغال وقطع الغيار المحددة للإصلاح ({selectedOrder.items.length})
                  </h4>
                  <span className="text-[11px] text-slate-400">
                    يتم تحديد الأسعار والمبالغ لاحقاً عند الفوترة النهائية
                  </span>
                </div>

                {/* Items Table */}
                <div className="overflow-x-auto bg-slate-900/60 rounded-lg border border-slate-700">
                  <table className="w-full text-xs text-right">
                    <thead>
                      <tr className="border-b border-slate-700 text-slate-400 font-medium">
                        <th className="py-2 px-3">البيان / العمل المقرر</th>
                        <th className="py-2 px-3">النوع</th>
                        <th className="py-2 px-3 text-center">الكمية</th>
                        <th className="py-2 px-3 text-left">حذف</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 font-medium">
                      {selectedOrder.items.map((it) => (
                        <tr key={it.id}>
                          <td className="py-2 px-3 font-bold text-white">{it.description}</td>
                          <td className="py-2 px-3 text-slate-400">
                            {it.type === 'part' ? 'قطعة غيار' : 'يد عاملة'}
                          </td>
                          <td className="py-2 px-3 text-center font-mono font-bold text-white">{it.quantity}</td>
                          <td className="py-2 px-3 text-left">
                            <button
                              onClick={() => handleRemoveItemFromOrder(it.id)}
                              className="text-slate-400 hover:text-rose-400 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {selectedOrder.items.length === 0 && (
                        <tr>
                          <td colSpan={4} className="py-6 text-center text-slate-500 italic">
                            لم يتم إدراج أي قطع أو أشغال فنية بعد.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Add Item to Technical Plan */}
                <form
                  onSubmit={handleAddItemToOrder}
                  className="bg-slate-900/80 p-3 rounded-lg border border-slate-700/80 space-y-3 text-xs"
                >
                  <div className="flex items-center gap-4">
                    <span className="font-semibold text-slate-300">نوع البند:</span>
                    <label className="inline-flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="itemType"
                        checked={newItemType === 'part'}
                        onChange={() => setNewItemType('part')}
                      />
                      <span>قطعة غيار</span>
                    </label>
                    <label className="inline-flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="itemType"
                        checked={newItemType === 'labor'}
                        onChange={() => setNewItemType('labor')}
                      />
                      <span>خدمة يد عاملة / فحص</span>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                    {newItemType === 'part' && stockItems.length > 0 ? (
                      <div className="sm:col-span-2">
                        <select
                          value={selectedStockItemId}
                          onChange={(e) => {
                            setSelectedStockItemId(e.target.value);
                            const item = stockItems.find((s) => s.id === e.target.value);
                            if (item) setItemUnitPrice(item.salePrice);
                          }}
                          className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:outline-none"
                        >
                          <option value="">اختر من المخزون المتوفر...</option>
                          {stockItems.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name} ({s.ref}) - متوفر: {s.quantity}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div className="sm:col-span-2">
                        <input
                          type="text"
                          required
                          placeholder={
                            newItemType === 'part'
                              ? 'اسم القطعة (طقم صفائح فرامل...)'
                              : 'بيان الخدمة (فك وتركيب / تغيير زيت...)'
                          }
                          value={customDescription}
                          onChange={(e) => setCustomDescription(e.target.value)}
                          className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:outline-none uppercase"
                        />
                      </div>
                    )}

                    <div>
                      <input
                        type="number"
                        min="1"
                        placeholder="الكمية"
                        value={itemQuantity}
                        onChange={(e) => setItemQuantity(Number(e.target.value))}
                        className="w-full bg-slate-800 border border-slate-700 rounded p-2 font-mono text-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <input
                        type="number"
                        min="0"
                        step="50"
                        placeholder="تقدير السعر للفوترة (دج)"
                        value={itemUnitPrice || ''}
                        onChange={(e) => setItemUnitPrice(Number(e.target.value))}
                        className="w-full bg-slate-800 border border-slate-700 rounded p-2 font-mono text-emerald-400 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded cursor-pointer"
                    >
                      + إضافة إلى أمر التشغيل
                    </button>
                  </div>
                </form>
              </div>
            </>
          ) : (
            <div className="text-center py-20 text-slate-400">
              اختر أمر تشغيل من القائمة الجانبية.
            </div>
          )}
        </div>
      </div>

      {/* MODAL: FINAL INVOICING WITH MULTI-MODE PAYMENT AND DEBT TRACKING */}
      {showInvoiceModal && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-lg w-full p-6 text-slate-100 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-2">
              الفوترة النهائية للسيارة ({selectedOrder.brand} {selectedOrder.model})
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              الزبون: {selectedOrder.customerName} • أمر التشغيل: {selectedOrder.orderNumber}
            </p>

            {(() => {
              const subtotal = selectedOrder.items.reduce((acc, it) => acc + it.total, 0);
              const totalTTC = Math.max(0, subtotal - Number(invoiceForm.discount));
              const amountPaid = Number(invoiceForm.amountPaid);
              const remainingDue = Math.max(0, totalTTC - amountPaid);

              return (
                <form onSubmit={handleConfirmInvoice} className="space-y-4 text-xs">
                  {/* Financial Breakdown */}
                  <div className="p-3 bg-slate-800 rounded-lg border border-slate-700 space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-slate-400">مجموع الأشغال والقطع:</span>
                      <span className="font-mono font-bold text-white">{subtotal.toLocaleString()} دج</span>
                    </div>

                    <div className="flex justify-between items-center pt-1 border-t border-slate-700">
                      <span className="text-slate-300 font-semibold">تخفيض تجاري (Remise):</span>
                      <input
                        type="number"
                        min="0"
                        step="50"
                        value={invoiceForm.discount}
                        onChange={(e) => setInvoiceForm({ ...invoiceForm, discount: Number(e.target.value) })}
                        className="w-28 bg-slate-900 border border-slate-600 rounded p-1 font-mono text-rose-400 text-right focus:outline-none"
                      />
                    </div>

                    <div className="flex justify-between items-center pt-1 border-t border-slate-700">
                      <span className="text-slate-100 font-extrabold text-sm">المبلغ الإجمالي T.T.C:</span>
                      <span className="font-mono font-black text-emerald-400 text-base">
                        {totalTTC.toLocaleString()} دج
                      </span>
                    </div>
                  </div>

                  {/* Payment Method Selector */}
                  <div>
                    <label className="block text-slate-300 mb-1.5 font-semibold">
                      طريقة التسديد (Mode de Paiement) *
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <button
                        type="button"
                        onClick={() => setInvoiceForm({ ...invoiceForm, paymentMethod: 'cash' })}
                        className={`p-2 rounded-lg border text-center font-semibold cursor-pointer ${
                          invoiceForm.paymentMethod === 'cash'
                            ? 'bg-emerald-600 border-emerald-500 text-white'
                            : 'bg-slate-800 border-slate-700 text-slate-300'
                        }`}
                      >
                        نقداً (Espèces)
                      </button>

                      <button
                        type="button"
                        onClick={() => setInvoiceForm({ ...invoiceForm, paymentMethod: 'virement' })}
                        className={`p-2 rounded-lg border text-center font-semibold cursor-pointer ${
                          invoiceForm.paymentMethod === 'virement'
                            ? 'bg-blue-600 border-blue-500 text-white'
                            : 'bg-slate-800 border-slate-700 text-slate-300'
                        }`}
                      >
                        تحويل BNA
                      </button>

                      <button
                        type="button"
                        onClick={() => setInvoiceForm({ ...invoiceForm, paymentMethod: 'cheque' })}
                        className={`p-2 rounded-lg border text-center font-semibold cursor-pointer ${
                          invoiceForm.paymentMethod === 'cheque'
                            ? 'bg-purple-600 border-purple-500 text-white'
                            : 'bg-slate-800 border-slate-700 text-slate-300'
                        }`}
                      >
                        شيك بنكي
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setInvoiceForm({
                            ...invoiceForm,
                            paymentMethod: 'credit',
                            amountPaid: 0,
                          });
                        }}
                        className={`p-2 rounded-lg border text-center font-semibold cursor-pointer ${
                          invoiceForm.paymentMethod === 'credit'
                            ? 'bg-amber-600 border-amber-500 text-white'
                            : 'bg-slate-800 border-slate-700 text-slate-300'
                        }`}
                      >
                        آجل (Crédit)
                      </button>
                    </div>
                  </div>

                  {/* Montant Versé and Reste à Payer */}
                  <div className="grid grid-cols-2 gap-3 p-3 bg-slate-800/80 rounded-lg border border-slate-700">
                    <div>
                      <label className="block text-slate-300 mb-1 font-semibold">
                        المبلغ المدفوع حالياً (Versé) *
                      </label>
                      <input
                        type="number"
                        min="0"
                        max={totalTTC}
                        step="50"
                        value={invoiceForm.amountPaid}
                        onChange={(e) =>
                          setInvoiceForm({ ...invoiceForm, amountPaid: Number(e.target.value) })
                        }
                        className="w-full bg-slate-900 border border-slate-700 rounded p-2 font-mono text-emerald-400 font-bold focus:outline-none focus:border-blue-500"
                      />
                      <span className="text-[10px] text-slate-400 mt-0.5 block">
                        كامل، نصف، أو أي دفعة جزئية
                      </span>
                    </div>

                    <div>
                      <label className="block text-slate-300 mb-1 font-semibold">
                        المبلغ المتبقي كدين (Reste)
                      </label>
                      <div className="w-full bg-slate-900 border border-slate-700 rounded p-2 font-mono text-rose-400 font-bold">
                        {remainingDue.toLocaleString()} دج
                      </div>
                      {remainingDue > 0 && (
                        <span className="text-[10px] text-amber-400 mt-0.5 block font-semibold">
                          يقيد تلقائياً في ديون الزبون
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setShowInvoiceModal(false)}
                      className="px-4 py-2 text-slate-400 hover:text-white cursor-pointer"
                    >
                      إلغاء
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg shadow-sm cursor-pointer"
                    >
                      تأكيد وإصدار الفاتورة الرسمية A4
                    </button>
                  </div>
                </form>
              );
            })()}
          </div>
        </div>
      )}

      {/* MODAL: CREATE NEW REPAIR ORDER */}
      {showNewOrderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-2xl w-full p-6 text-slate-100 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-white mb-4">تسجيل استقبال سيارة وأمر تشغيل مبدئي</h3>
            <form onSubmit={handleCreateOrderSubmit} className="space-y-4 text-xs">
              {/* Section 1: Customer */}
              <div className="p-3 bg-slate-800/60 rounded-lg border border-slate-700 space-y-3">
                <span className="font-bold text-blue-400 block text-xs">1. بيانات الزبون</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-300 mb-1 font-semibold">اسم الزبون *</label>
                    <input
                      type="text"
                      required
                      placeholder="محمد بلقاسم"
                      value={newOrderForm.customerName}
                      onChange={(e) => setNewOrderForm({ ...newOrderForm, customerName: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 mb-1 font-semibold">رقم الهاتف *</label>
                    <input
                      type="text"
                      required
                      placeholder="0557..."
                      value={newOrderForm.customerPhone}
                      onChange={(e) => setNewOrderForm({ ...newOrderForm, customerPhone: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded p-2 font-mono text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 mb-1 font-semibold">العنوان / الإقامة</label>
                    <input
                      type="text"
                      placeholder="غليزان"
                      value={newOrderForm.customerAddress}
                      onChange={(e) => setNewOrderForm({ ...newOrderForm, customerAddress: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Vehicle */}
              <div className="p-3 bg-slate-800/60 rounded-lg border border-slate-700 space-y-3">
                <span className="font-bold text-emerald-400 block text-xs">2. بيانات ومواصفات السيارة</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-300 mb-1 font-semibold">الماركة (Marque) *</label>
                    <input
                      type="text"
                      required
                      placeholder="Renault, Peugeot, VW..."
                      value={newOrderForm.brand}
                      onChange={(e) => setNewOrderForm({ ...newOrderForm, brand: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 mb-1 font-semibold">الموديل (Modèle)</label>
                    <input
                      type="text"
                      placeholder="Clio 4, Golf 7..."
                      value={newOrderForm.model}
                      onChange={(e) => setNewOrderForm({ ...newOrderForm, model: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 mb-1 font-semibold">سنة الصنع</label>
                    <input
                      type="text"
                      placeholder="2019"
                      value={newOrderForm.year}
                      onChange={(e) => setNewOrderForm({ ...newOrderForm, year: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded p-2 font-mono text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-slate-300 mb-1 font-semibold">لوحة الترقيم (Matricule) *</label>
                    <input
                      type="text"
                      required
                      placeholder="01234-119-48"
                      value={newOrderForm.matricule}
                      onChange={(e) => setNewOrderForm({ ...newOrderForm, matricule: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded p-2 font-mono text-emerald-400 font-bold focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 mb-1 font-semibold">رقم الشاسي (VIN)</label>
                    <input
                      type="text"
                      placeholder="VF1..."
                      value={newOrderForm.vin}
                      onChange={(e) => setNewOrderForm({ ...newOrderForm, vin: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded p-2 font-mono text-white focus:outline-none uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 mb-1 font-semibold">العداد (km)</label>
                    <input
                      type="number"
                      placeholder="145000"
                      value={newOrderForm.mileageKm}
                      onChange={(e) => setNewOrderForm({ ...newOrderForm, mileageKm: Number(e.target.value) })}
                      className="w-full bg-slate-900 border border-slate-700 rounded p-2 font-mono text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 mb-1 font-semibold">مستوى الوقود</label>
                    <select
                      value={newOrderForm.fuelLevel}
                      onChange={(e) => setNewOrderForm({ ...newOrderForm, fuelLevel: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white focus:outline-none"
                    >
                      <option value="احتياطي (Réserve)">احتياطي (Réserve)</option>
                      <option value="25% (1/4)">25% (1/4)</option>
                      <option value="50% (1/2)">50% (1/2)</option>
                      <option value="75% (3/4)">75% (3/4)</option>
                      <option value="100% ممتلئ (Plein)">100% ممتلئ (Plein)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 3: Complaint & Checklist */}
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">شكوى الزبون والعطل الظاهري *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="وصف العطل أو طلب الصيانة..."
                  value={newOrderForm.customerComplaint}
                  onChange={(e) => setNewOrderForm({ ...newOrderForm, customerComplaint: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 bg-slate-800/40 rounded-lg border border-slate-700/60">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newOrderForm.checklist.roueSecours}
                    onChange={(e) =>
                      setNewOrderForm({
                        ...newOrderForm,
                        checklist: { ...newOrderForm.checklist, roueSecours: e.target.checked },
                      })
                    }
                  />
                  <span>عجلة احتياطية</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newOrderForm.checklist.cricCle}
                    onChange={(e) =>
                      setNewOrderForm({
                        ...newOrderForm,
                        checklist: { ...newOrderForm.checklist, cricCle: e.target.checked },
                      })
                    }
                  />
                  <span>الرافعة والمفتاح</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newOrderForm.checklist.documentsBord}
                    onChange={(e) =>
                      setNewOrderForm({
                        ...newOrderForm,
                        checklist: { ...newOrderForm.checklist, documentsBord: e.target.checked },
                      })
                    }
                  />
                  <span>وثائق السيارة</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newOrderForm.checklist.carrosserieRaye}
                    onChange={(e) =>
                      setNewOrderForm({
                        ...newOrderForm,
                        checklist: { ...newOrderForm.checklist, carrosserieRaye: e.target.checked },
                      })
                    }
                  />
                  <span>خدوش على الهيكل</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newOrderForm.checklist.temoinAllume}
                    onChange={(e) =>
                      setNewOrderForm({
                        ...newOrderForm,
                        checklist: { ...newOrderForm.checklist, temoinAllume: e.target.checked },
                      })
                    }
                  />
                  <span>لمبة فحص المحرك</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowNewOrderModal(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg cursor-pointer"
                >
                  حفظ وإصدار أمر التشغيل المبدئي
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
