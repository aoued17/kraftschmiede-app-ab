/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  loadData,
  saveData,
  exportBackup,
  parseAndValidateBackup,
  clearDatabaseToProduction,
  INITIAL_DATA,
  AppData,
} from './utils/storage';
import {
  RepairOrder,
  StockItem,
  Invoice,
  InvoiceItem,
  Worker,
  WorkerWageLog,
  WorkerAdvance,
  WorkshopExpense,
  CaisseMovement,
  WorkshopInfo,
  PaymentMethod,
} from './types';
import { formatDZD } from './utils/numberToWords';

// Components
import { RepairAndDiagnosticView } from './components/RepairAndDiagnosticView';
import { InventoryManagement } from './components/InventoryManagement';
import { InvoiceManagement } from './components/InvoiceManagement';
import { WorkersAndCashManagement } from './components/WorkersAndCashManagement';
import { SettingsAndBackup } from './components/SettingsAndBackup';
import { InvoicePrintModal } from './components/InvoicePrintModal';
import { OrdreReparationModal } from './components/OrdreReparationModal';

// Icons
import {
  Wrench,
  Package,
  FileText,
  Wallet,
  Settings,
  Download,
  CheckCircle2,
  Car,
  CreditCard,
  Smartphone,
  WifiOff,
} from 'lucide-react';

export default function App() {
  const [data, setData] = useState<AppData>(loadData);

  // PWA Install & Offline Status
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  useEffect(() => {
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    const handleAppInstalled = () => {
      setIsStandalone(true);
      setDeferredPrompt(null);
      showToast('تم تثبيت تطبيق KraftSchmiede بنجاح على جهازك!');
    };

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsStandalone(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleInstallPWA = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        showToast('جاري تثبيت تطبيق ورشة KraftSchmiede...');
      }
      setDeferredPrompt(null);
    } else {
      showToast('التطبيق يدعم العمل أوفلاين بالكامل 100% بدون إنترنت!');
    }
  };

  // Active view tab
  type NavigationTab = 'orders' | 'invoices' | 'caisse_workers' | 'inventory' | 'settings';
  const [activeTab, setActiveTab] = useState<NavigationTab>('orders');

  // Modals for print
  const [selectedInvoiceForPrint, setSelectedInvoiceForPrint] = useState<Invoice | null>(null);
  const [selectedOrderForPrint, setSelectedOrderForPrint] = useState<RepairOrder | null>(null);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Sync to localStorage on state changes
  useEffect(() => {
    saveData(data);
  }, [data]);

  // Financial Calculations for Caisse Journalière (رصيد الخزينة اللحظي)
  const totalEntrees = data.caisseMovements
    .filter((m) => m.type === 'entree')
    .reduce((acc, m) => acc + m.amount, 0);

  const totalSorties = data.caisseMovements
    .filter((m) => m.type === 'sortie')
    .reduce((acc, m) => acc + m.amount, 0);

  const currentCaisseBalance = totalEntrees - totalSorties;

  // الدخل الصافي الإجمالي للڨراج (Global Cumulative Net Profit of Garage)
  const totalGlobalRevenue = data.invoices.reduce((acc, inv) => acc + inv.totalTTC, 0);
  const totalGlobalExpenses = data.expenses.reduce((acc, e) => acc + e.amount, 0);
  const totalWorkerCosts =
    data.workerWageLogs.reduce((acc, l) => acc + l.wageAmount, 0) +
    data.workerAdvances.reduce((acc, a) => acc + a.amount, 0);
  const globalGarageNetProfit = totalGlobalRevenue - totalGlobalExpenses - totalWorkerCosts;

  // الصندوق اليومي فقط (Today's Net Movement)
  const todayDateStr = new Date().toISOString().split('T')[0];
  const todayMovements = data.caisseMovements.filter((m) => m.date === todayDateStr);
  const todayCaisseNet =
    todayMovements.filter((m) => m.type === 'entree').reduce((acc, m) => acc + m.amount, 0) -
    todayMovements.filter((m) => m.type === 'sortie').reduce((acc, m) => acc + m.amount, 0);

  // Active in-workshop vehicles count
  const activeVehiclesCount = data.repairOrders.filter(
    (o) => o.status !== 'invoiced'
  ).length;

  // Total Customer Debts (Créances)
  const totalDebtsCount = data.invoices.filter((i) => i.amountDue > 0).length;

  // Low stock items count
  const lowStockCount = data.stockItems.filter((i) => i.quantity <= i.alertThreshold).length;

  // 1. Repair Orders Handlers
  const handleAddOrder = (orderData: Omit<RepairOrder, 'id' | 'orderNumber' | 'createdAt'>) => {
    const nextNum = String(data.repairOrders.length + 1).padStart(3, '0');
    const newOrder: RepairOrder = {
      ...orderData,
      id: `ro-${Date.now()}`,
      orderNumber: `OR-2026-${nextNum}`,
      createdAt: new Date().toISOString(),
    };
    setData((prev) => ({
      ...prev,
      repairOrders: [newOrder, ...prev.repairOrders],
    }));
    showToast(`تم تسجيل أمر التشغيل المبدئي: ${newOrder.orderNumber}`);
  };

  const handleUpdateOrder = (updatedOrder: RepairOrder) => {
    setData((prev) => ({
      ...prev,
      repairOrders: prev.repairOrders.map((o) => (o.id === updatedOrder.id ? updatedOrder : o)),
    }));
    showToast(`تم تحديث بيانات السيارة: ${updatedOrder.brand} ${updatedOrder.model}`);
  };

  // 2. Convert Repair Order to Official Invoice, deduct stock, and feed Caisse
  const handleConvertToInvoice = (
    order: RepairOrder,
    billingDetails: {
      items: InvoiceItem[];
      discount: number;
      amountPaid: number;
      paymentMethod: PaymentMethod;
    }
  ) => {
    const subtotal = billingDetails.items.reduce((acc, it) => acc + it.total, 0);
    const totalTTC = Math.max(0, subtotal - billingDetails.discount);
    const amountPaid = Number(billingDetails.amountPaid);
    const amountDue = Math.max(0, totalTTC - amountPaid);
    const status: Invoice['status'] = amountDue === 0 ? 'paid' : amountPaid > 0 ? 'partial' : 'unpaid';

    const nextInvNum = String(data.invoices.length + 1).padStart(3, '0');
    const invoiceNumber = `FAC-2026-${nextInvNum}`;

    const newInvoice: Invoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber,
      date: new Date().toISOString().split('T')[0],
      repairOrderId: order.id,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      customerAddress: order.customerAddress,
      vehicleDescription: `${order.brand} ${order.model} (${order.year || ''})`,
      vin: order.vin || 'Non renseigné',
      matricule: order.matricule,
      mileageKm: order.mileageKm,
      items: [...billingDetails.items],
      subtotal,
      discount: billingDetails.discount,
      totalTTC,
      amountPaid,
      amountDue,
      paymentMethod: billingDetails.paymentMethod,
      status,
      bankName: data.workshopInfo.bankName,
      bankAccount: data.workshopInfo.bankAccount,
      notes: 'Facture arrêtée avec garantie pièces et main d\'œuvre KraftSchmiede',
      createdAt: new Date().toISOString(),
    };

    // Auto-deduct stock
    const stockMovementsToAdd: any[] = [];
    const updatedStockItems = [...data.stockItems];

    billingDetails.items.forEach((item) => {
      if (item.type === 'part' && item.stockItemId) {
        const stockIdx = updatedStockItems.findIndex((s) => s.id === item.stockItemId);
        if (stockIdx !== -1) {
          const currentQty = updatedStockItems[stockIdx].quantity;
          const newQty = Math.max(0, currentQty - item.quantity);
          updatedStockItems[stockIdx] = {
            ...updatedStockItems[stockIdx],
            quantity: newQty,
            lastUpdated: new Date().toISOString(),
          };

          stockMovementsToAdd.push({
            id: `mov-${Date.now()}-${Math.random()}`,
            stockItemId: updatedStockItems[stockIdx].id,
            stockItemName: updatedStockItems[stockIdx].name,
            type: 'out',
            quantity: item.quantity,
            reason: `خصم تلقائي - فاتورة ${invoiceNumber} للسيارة ${order.matricule}`,
            date: new Date().toISOString().split('T')[0],
            relatedInvoiceId: newInvoice.id,
          });
        }
      }
    });

    // Caisse Entry if amountPaid > 0
    const caisseEntriesToAdd: CaisseMovement[] = [];
    if (amountPaid > 0) {
      caisseEntriesToAdd.push({
        id: `cm-${Date.now()}-inv`,
        date: newInvoice.date,
        type: 'entree',
        category: 'facture',
        title: `قبض فاتورة ${invoiceNumber} (${order.customerName} - ${order.matricule})`,
        amount: amountPaid,
        paymentMethod: billingDetails.paymentMethod,
        actor: order.customerName,
        relatedRef: invoiceNumber,
      });
    }

    // Payment record
    const paymentRecord = {
      id: `pay-${Date.now()}`,
      invoiceId: newInvoice.id,
      invoiceNumber,
      customerName: order.customerName,
      date: newInvoice.date,
      amount: amountPaid,
      paymentMethod: billingDetails.paymentMethod,
      notes: 'تسديد عند إصدار الفاتورة الرسمية',
    };

    // Update order status
    const updatedOrder: RepairOrder = {
      ...order,
      status: 'invoiced',
      invoiceId: newInvoice.id,
    };

    setData((prev) => ({
      ...prev,
      invoices: [newInvoice, ...prev.invoices],
      payments: amountPaid > 0 ? [paymentRecord, ...prev.payments] : prev.payments,
      repairOrders: prev.repairOrders.map((o) => (o.id === order.id ? updatedOrder : o)),
      stockItems: updatedStockItems,
      stockMovements: [...stockMovementsToAdd, ...prev.stockMovements],
      caisseMovements: [...caisseEntriesToAdd, ...prev.caisseMovements],
    }));

    setSelectedInvoiceForPrint(newInvoice);
    showToast(`تم إصدار الفاتورة الرسمية ${invoiceNumber} وتحديث الصندوق اليومي والمخزون!`);
  };

  // 3. Stock Handlers
  const handleAddStockItem = (itemData: Omit<StockItem, 'id' | 'lastUpdated'>) => {
    const newItem: StockItem = {
      ...itemData,
      id: `stock-${Date.now()}`,
      lastUpdated: new Date().toISOString(),
    };
    setData((prev) => ({
      ...prev,
      stockItems: [newItem, ...prev.stockItems],
    }));
    showToast(`تمت إضافة القطعة للمخزن: ${newItem.name}`);
  };

  const handleUpdateStockItem = (item: StockItem) => {
    setData((prev) => ({
      ...prev,
      stockItems: prev.stockItems.map((s) => (s.id === item.id ? item : s)),
    }));
    showToast(`تم تحديث القطعة: ${item.name}`);
  };

  const handleDeleteStockItem = (id: string) => {
    setData((prev) => ({
      ...prev,
      stockItems: prev.stockItems.filter((s) => s.id !== id),
    }));
    showToast('تم حذف القطعة من المخزون.');
  };

  const handleRestock = (
    stockItemId: string,
    addedQuantity: number,
    supplierName: string,
    costPrice: number
  ) => {
    const item = data.stockItems.find((s) => s.id === stockItemId);
    if (!item) return;

    const newQty = item.quantity + addedQuantity;
    const movement = {
      id: `mov-${Date.now()}`,
      stockItemId: item.id,
      stockItemName: item.name,
      type: 'in' as const,
      quantity: addedQuantity,
      reason: `توريد شحنة جديدة من المورد: ${supplierName}`,
      date: new Date().toISOString().split('T')[0],
    };

    setData((prev) => ({
      ...prev,
      stockItems: prev.stockItems.map((s) =>
        s.id === stockItemId
          ? { ...s, quantity: newQty, purchasePrice: costPrice, lastUpdated: new Date().toISOString() }
          : s
      ),
      stockMovements: [movement, ...prev.stockMovements],
    }));
    showToast(`تم توريد ${addedQuantity} قطعة جديدة لـ ${item.name}`);
  };

  // 4. Invoices & Payments Handlers
  const handleRecordPayment = (
    invoiceId: string,
    amount: number,
    paymentMethod: PaymentMethod,
    notes?: string
  ) => {
    const inv = data.invoices.find((i) => i.id === invoiceId);
    if (!inv) return;

    const newAmountPaid = inv.amountPaid + amount;
    const newAmountDue = Math.max(0, inv.totalTTC - newAmountPaid);
    const newStatus: Invoice['status'] = newAmountDue === 0 ? 'paid' : 'partial';

    const paymentRecord = {
      id: `pay-${Date.now()}`,
      invoiceId: inv.id,
      invoiceNumber: inv.invoiceNumber,
      customerName: inv.customerName,
      date: new Date().toISOString().split('T')[0],
      amount,
      paymentMethod,
      notes: notes || 'تحصيل دفعة نقدية',
    };

    const caisseMovement: CaisseMovement = {
      id: `cm-${Date.now()}-debt`,
      date: new Date().toISOString().split('T')[0],
      type: 'entree',
      category: 'creance_client',
      title: `تحصيل دين فاتورة ${inv.invoiceNumber} (${inv.customerName})`,
      amount,
      paymentMethod,
      actor: inv.customerName,
      relatedRef: inv.invoiceNumber,
      notes,
    };

    setData((prev) => ({
      ...prev,
      invoices: prev.invoices.map((i) =>
        i.id === invoiceId
          ? { ...i, amountPaid: newAmountPaid, amountDue: newAmountDue, status: newStatus }
          : i
      ),
      payments: [paymentRecord, ...prev.payments],
      caisseMovements: [caisseMovement, ...prev.caisseMovements],
    }));
    showToast(`تم تحصيل ${formatDZD(amount)} وإيداعه بصندوق اليومية بنجاح.`);
  };

  const handleCreateDirectInvoice = (invData: Omit<Invoice, 'id' | 'invoiceNumber' | 'createdAt'>) => {
    const nextInvNum = String(data.invoices.length + 1).padStart(3, '0');
    const invoiceNumber = `FAC-2026-${nextInvNum}`;

    const newInvoice: Invoice = {
      ...invData,
      id: `inv-${Date.now()}`,
      invoiceNumber,
      createdAt: new Date().toISOString(),
    };

    const caisseEntries: CaisseMovement[] = [];
    if (newInvoice.amountPaid > 0) {
      caisseEntries.push({
        id: `cm-${Date.now()}-dir`,
        date: newInvoice.date,
        type: 'entree',
        category: 'facture',
        title: `فاتورة شباك مباشرة ${invoiceNumber} (${newInvoice.customerName})`,
        amount: newInvoice.amountPaid,
        paymentMethod: newInvoice.paymentMethod,
        actor: newInvoice.customerName,
        relatedRef: invoiceNumber,
      });
    }

    const paymentRecord = {
      id: `pay-${Date.now()}`,
      invoiceId: newInvoice.id,
      invoiceNumber,
      customerName: newInvoice.customerName,
      date: newInvoice.date,
      amount: newInvoice.amountPaid,
      paymentMethod: newInvoice.paymentMethod,
      notes: 'تسديد فاتورة شباك مباشرة',
    };

    setData((prev) => ({
      ...prev,
      invoices: [newInvoice, ...prev.invoices],
      payments: newInvoice.amountPaid > 0 ? [paymentRecord, ...prev.payments] : prev.payments,
      caisseMovements: [...caisseEntries, ...prev.caisseMovements],
    }));

    setSelectedInvoiceForPrint(newInvoice);
    showToast(`تم إصدار الفاتورة المباشرة ${invoiceNumber}`);
  };

  // 5. Workers, Wages, and Caisse Direct Actions
  const handleAddWorker = (workerData: Omit<Worker, 'id'>) => {
    const newWorker: Worker = {
      ...workerData,
      id: `w-${Date.now()}`,
    };
    setData((prev) => ({
      ...prev,
      workers: [...prev.workers, newWorker],
    }));
    showToast(`تمت إضافة الفني / العامل: ${newWorker.name}`);
  };

  const handleUpdateWorker = (worker: Worker) => {
    setData((prev) => ({
      ...prev,
      workers: prev.workers.map((w) => (w.id === worker.id ? worker : w)),
    }));
  };

  const handleDeleteWorker = (id: string) => {
    setData((prev) => ({
      ...prev,
      workers: prev.workers.filter((w) => w.id !== id),
    }));
  };

  const handleAddWageLog = (logData: Omit<WorkerWageLog, 'id'>) => {
    const newLog: WorkerWageLog = {
      ...logData,
      id: `ww-${Date.now()}`,
    };
    setData((prev) => ({
      ...prev,
      workerWageLogs: [newLog, ...prev.workerWageLogs],
    }));
    showToast(`تم تسجيل أجر ومهمة منجزة للعامل: ${newLog.workerName}`);
  };

  const handleAddAdvance = (advData: Omit<WorkerAdvance, 'id'>) => {
    const newAdv: WorkerAdvance = {
      ...advData,
      id: `adv-${Date.now()}`,
    };
    setData((prev) => ({
      ...prev,
      workerAdvances: [newAdv, ...prev.workerAdvances],
    }));
    showToast(`تم تسجيل تسبيقة بقيمة ${formatDZD(newAdv.amount)} للعامل ${newAdv.workerName}`);
  };

  const handlePayWorkerWage = (logId: string, amount: number, paymentMethod: PaymentMethod) => {
    setData((prev) => ({
      ...prev,
      workerWageLogs: prev.workerWageLogs.map((l) =>
        l.id === logId ? { ...l, isPaid: true, paidDate: new Date().toISOString().split('T')[0] } : l
      ),
    }));
    showToast('تم تسديد أجر العامل وخصم المبلغ من الصندوق اليومي فوراً.');
  };

  const handleAddExpense = (expData: Omit<WorkshopExpense, 'id'>) => {
    const newExp: WorkshopExpense = {
      ...expData,
      id: `exp-${Date.now()}`,
    };
    setData((prev) => ({
      ...prev,
      expenses: [newExp, ...prev.expenses],
    }));
    showToast(`تم تسجيل مصروف ورشة بقيمة ${formatDZD(newExp.amount)}`);
  };

  const handleAddManualMovement = (movData: Omit<CaisseMovement, 'id'>) => {
    const newMov: CaisseMovement = {
      ...movData,
      id: `cm-${Date.now()}`,
    };
    setData((prev) => ({
      ...prev,
      caisseMovements: [newMov, ...prev.caisseMovements],
    }));
    showToast(
      newMov.type === 'entree'
        ? `تم تسجيل مدخول بقيمة ${formatDZD(newMov.amount)} في الخزينة.`
        : `تم تسجيل خروج نقدي بقيمة ${formatDZD(newMov.amount)} من الخزينة.`
    );
  };

  // Workshop info update
  const handleUpdateWorkshop = (info: WorkshopInfo) => {
    setData((prev) => ({
      ...prev,
      workshopInfo: info,
    }));
    showToast('تم حفظ البيانات الرسمية لورشة KraftSchmiede.');
  };

  // Backup & Restore
  const handleExportBackup = () => {
    exportBackup(data);
    showToast('تم تنزيل النسخة الاحتياطية بنجاح.');
  };

  const handleImportBackup = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const validated = parseAndValidateBackup(text);
        setData(validated);
        showToast('تم استرجاع كافة البيانات بنجاح.');
      } catch (err: any) {
        alert(`فشل استرجاع الملف: ${err.message || 'الملف تالف'}`);
      }
    };
    reader.readAsText(file);
  };

  const handleResetData = () => {
    if (confirm('هل أنت متأكد من رغبتك في إعادة تحميل البيانات التجريبية الافتراضية؟')) {
      setData(INITIAL_DATA);
      showToast('تمت إعادة تحميل البيانات التجريبية الافتراضية.');
    }
  };

  const handleClearToProduction = (backupFirst: boolean) => {
    if (backupFirst) {
      exportBackup(data);
    }
    const cleanData = clearDatabaseToProduction(data.workshopInfo);
    setData(cleanData);
    showToast('تم تصفير البيانات بنجاح! اللوجيسيال جاهز الآن 100% للعمل الحقيقي في الورشة.');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* TOP BAR CONTRACT: Zone 1 (Wordmark) - Zone 2 (Clean single-line nav links) - Zone 3 (Primary Action) */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-6 py-3.5 no-print">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-8">
          {/* Zone 1: Brand Wordmark */}
          <div className="flex items-center gap-3 whitespace-nowrap shrink-0">
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center font-black text-white text-base shadow-sm">
              KS
            </div>
            <div>
              <div className="text-base font-black tracking-tight text-white flex items-center gap-1.5">
                <span>KraftSchmiede</span>
                <span className="text-xs text-blue-400 font-bold uppercase tracking-wider">Auto</span>
              </div>
              <div className="text-[10px] text-slate-400 font-medium">Relizane • غليزان</div>
            </div>
          </div>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-3.5 py-2 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'orders'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Car className="w-3.5 h-3.5" />
              أمر التشغيل والاستقبال ({activeVehiclesCount})
            </button>

            <button
              onClick={() => setActiveTab('invoices')}
              className={`px-3.5 py-2 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'invoices'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              الفواتير الرسمية A4
            </button>

            <button
              onClick={() => setActiveTab('caisse_workers')}
              className={`px-3.5 py-2 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'caisse_workers'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Wallet className="w-3.5 h-3.5" />
              الصندوق والعمال والديون
              {totalDebtsCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-bold">
                  {totalDebtsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('inventory')}
              className={`px-3.5 py-2 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'inventory'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              المخزون ({data.stockItems.length})
              {lowStockCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-400" title="نواقص بالمخزون" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`px-3.5 py-2 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'settings'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              الإعدادات والنسخ
            </button>
          </nav>

          {/* Zone 3: Real-Time Caisse Balance & Backup Action */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="hidden lg:flex items-center gap-2">
            {/* الدخل الصافي الإجمالي للڨراج وليس اليومي */}
            <div
              onClick={() => setActiveTab('caisse_workers')}
              className="flex items-center gap-2 bg-amber-950/40 hover:bg-amber-950/60 border border-amber-600/50 px-3 py-1.5 rounded-lg cursor-pointer transition-colors shadow-sm"
              title="الدخل الصافي الإجمالي للڨراج (كل الأرباح المحققة التراكمية)"
            >
              <span className="text-[11px] text-amber-300 font-bold">الدخل الصافي الإجمالي:</span>
              <span
                className={`font-mono font-black text-xs ${
                  globalGarageNetProfit >= 0 ? 'text-amber-400' : 'text-rose-400'
                }`}
              >
                {formatDZD(globalGarageNetProfit)}
              </span>
            </div>

            {/* حركة الصندوق اليومي فقط */}
            <div
              onClick={() => setActiveTab('caisse_workers')}
              className="flex items-center gap-2 bg-slate-800/90 hover:bg-slate-800 border border-slate-700 px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors"
              title="صافي حركة الصندوق لليوم فقط"
            >
              <span className="text-[11px] text-slate-400 font-medium">صندوق اليوم:</span>
              <span
                className={`font-mono font-black text-xs ${
                  todayCaisseNet >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {todayCaisseNet >= 0 ? '+' : ''}{formatDZD(todayCaisseNet)}
              </span>
            </div>
          </div>

            {deferredPrompt && (
              <button
                onClick={handleInstallPWA}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors cursor-pointer whitespace-nowrap shadow-sm shadow-blue-500/20"
                title="تثبيت تطبيق KraftSchmiede على الجهاز"
              >
                <Smartphone className="w-3.5 h-3.5" />
                تثبيت PWA
              </button>
            )}

            {!isOnline && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-amber-300 bg-amber-950/60 border border-amber-600/40 rounded-lg animate-pulse" title="التطبيق يعمل بدون اتصال بالإنترنت">
                <WifiOff className="w-3 h-3 text-amber-400" />
                أوفلاين
              </span>
            )}

            <button
              onClick={handleExportBackup}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
              title="تنزيل نسخة احتياطية محلية"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" />
              نسخة احتياطية
            </button>
          </div>
        </div>

        {/* Mobile Navigation Strip */}
        <div className="flex md:hidden items-center justify-between gap-1 overflow-x-auto pt-2 mt-2 border-t border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-2.5 py-1.5 rounded-md whitespace-nowrap font-medium ${
              activeTab === 'orders' ? 'bg-blue-600 text-white' : 'text-slate-400'
            }`}
          >
            أمر التشغيل ({activeVehiclesCount})
          </button>
          <button
            onClick={() => setActiveTab('invoices')}
            className={`px-2.5 py-1.5 rounded-md whitespace-nowrap font-medium ${
              activeTab === 'invoices' ? 'bg-blue-600 text-white' : 'text-slate-400'
            }`}
          >
            الفواتير A4
          </button>
          <button
            onClick={() => setActiveTab('caisse_workers')}
            className={`px-2.5 py-1.5 rounded-md whitespace-nowrap font-medium ${
              activeTab === 'caisse_workers' ? 'bg-blue-600 text-white' : 'text-slate-400'
            }`}
          >
            الصندوق والعمال
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-2.5 py-1.5 rounded-md whitespace-nowrap font-medium ${
              activeTab === 'inventory' ? 'bg-blue-600 text-white' : 'text-slate-400'
            }`}
          >
            المخزون
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-2.5 py-1.5 rounded-md whitespace-nowrap font-medium ${
              activeTab === 'settings' ? 'bg-blue-600 text-white' : 'text-slate-400'
            }`}
          >
            الإعدادات
          </button>
        </div>
      </header>

      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed bottom-6 left-6 z-50 flex items-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl shadow-2xl text-xs font-semibold animate-in fade-in slide-in-from-bottom-2 no-print border border-blue-400/30">
          <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* MAIN CONTENT VIEWPORT */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 no-print">
        {activeTab === 'orders' && (
          <RepairAndDiagnosticView
            orders={data.repairOrders}
            stockItems={data.stockItems}
            workers={data.workers}
            onAddOrder={handleAddOrder}
            onUpdateOrder={handleUpdateOrder}
            onConvertToInvoice={handleConvertToInvoice}
            onPrintOrder={(order) => setSelectedOrderForPrint(order)}
          />
        )}

        {activeTab === 'invoices' && (
          <InvoiceManagement
            invoices={data.invoices}
            workshop={data.workshopInfo}
            onPrintInvoice={(inv) => setSelectedInvoiceForPrint(inv)}
            onRecordPayment={handleRecordPayment}
            onCreateDirectInvoice={handleCreateDirectInvoice}
          />
        )}

        {activeTab === 'caisse_workers' && (
          <WorkersAndCashManagement
            workers={data.workers}
            workerWageLogs={data.workerWageLogs}
            workerAdvances={data.workerAdvances}
            expenses={data.expenses}
            caisseMovements={data.caisseMovements}
            invoices={data.invoices}
            payments={data.payments}
            onAddWorker={handleAddWorker}
            onUpdateWorker={handleUpdateWorker}
            onDeleteWorker={handleDeleteWorker}
            onAddWageLog={handleAddWageLog}
            onAddAdvance={handleAddAdvance}
            onPayWorkerWage={handlePayWorkerWage}
            onAddManualMovement={handleAddManualMovement}
            onAddExpense={handleAddExpense}
            onCollectClientDebt={handleRecordPayment}
          />
        )}

        {activeTab === 'inventory' && (
          <InventoryManagement
            stockItems={data.stockItems}
            movements={data.stockMovements}
            onAddStockItem={handleAddStockItem}
            onUpdateStockItem={handleUpdateStockItem}
            onDeleteStockItem={handleDeleteStockItem}
            onRestock={handleRestock}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsAndBackup
            workshop={data.workshopInfo}
            onUpdateWorkshop={handleUpdateWorkshop}
            onExportBackup={handleExportBackup}
            onImportBackup={handleImportBackup}
            onResetData={handleResetData}
            onClearToProduction={handleClearToProduction}
          />
        )}
      </main>

      {/* FOOTER */}
      <footer className="mt-auto border-t border-slate-800 bg-slate-900/60 px-6 py-4 text-xs text-slate-400 no-print">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white uppercase">{data.workshopInfo.entreprise}</span>
            <span>•</span>
            <span>RC: {data.workshopInfo.rc}</span>
            <span>•</span>
            <span>{data.workshopInfo.address}</span>
          </div>
          <div>
            <span>تطبيق محلي أوفلاين مكتبي • الهاتف: {data.workshopInfo.phone}</span>
          </div>
        </div>
      </footer>

      {/* PRINT MODALS (Standard A4 dimensions) */}
      {selectedInvoiceForPrint && (
        <InvoicePrintModal
          invoice={selectedInvoiceForPrint}
          workshop={data.workshopInfo}
          isOpen={true}
          onClose={() => setSelectedInvoiceForPrint(null)}
        />
      )}

      {selectedOrderForPrint && (
        <OrdreReparationModal
          order={selectedOrderForPrint}
          workshop={data.workshopInfo}
          isOpen={true}
          onClose={() => setSelectedOrderForPrint(null)}
        />
      )}
    </div>
  );
}
