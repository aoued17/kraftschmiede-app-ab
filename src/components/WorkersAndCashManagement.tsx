import React, { useState } from 'react';
import {
  Worker,
  WorkerWageLog,
  WorkerAdvance,
  WorkshopExpense,
  CaisseMovement,
  Invoice,
  PaymentRecord,
  PaymentMethod,
} from '../types';
import { formatDZD } from '../utils/numberToWords';
import {
  Wallet,
  Users,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  Plus,
  Calendar,
  UserCheck,
  Check,
  Trash2,
  Clock,
  Briefcase,
  AlertCircle,
  FileSpreadsheet,
  Search,
  Filter,
  CheckCircle2,
  CreditCard,
} from 'lucide-react';

interface WorkersAndCashManagementProps {
  workers: Worker[];
  workerWageLogs: WorkerWageLog[];
  workerAdvances: WorkerAdvance[];
  expenses: WorkshopExpense[];
  caisseMovements: CaisseMovement[];
  invoices: Invoice[];
  payments: PaymentRecord[];
  onAddWorker: (worker: Omit<Worker, 'id'>) => void;
  onUpdateWorker: (worker: Worker) => void;
  onDeleteWorker: (id: string) => void;
  onAddWageLog: (log: Omit<WorkerWageLog, 'id'>) => void;
  onAddAdvance: (advance: Omit<WorkerAdvance, 'id'>) => void;
  onPayWorkerWage: (logId: string, amount: number, paymentMethod: PaymentMethod) => void;
  onAddManualMovement: (movement: Omit<CaisseMovement, 'id'>) => void;
  onAddExpense: (expense: Omit<WorkshopExpense, 'id'>) => void;
  onCollectClientDebt: (invoiceId: string, amount: number, paymentMethod: PaymentMethod, notes?: string) => void;
}

export const WorkersAndCashManagement: React.FC<WorkersAndCashManagementProps> = ({
  workers,
  workerWageLogs,
  workerAdvances,
  expenses,
  caisseMovements,
  invoices,
  payments,
  onAddWorker,
  onUpdateWorker,
  onDeleteWorker,
  onAddWageLog,
  onAddAdvance,
  onPayWorkerWage,
  onAddManualMovement,
  onAddExpense,
  onCollectClientDebt,
}) => {
  const [activeTab, setActiveTab] = useState<'caisse' | 'workers' | 'debts'>('caisse');
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>(workers[0]?.id || '');

  // Modals state
  const [showAddWorkerModal, setShowAddWorkerModal] = useState(false);
  const [showAddWageLogModal, setShowAddWageLogModal] = useState(false);
  const [showAddAdvanceModal, setShowAddAdvanceModal] = useState(false);
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [showManualMovementModal, setShowManualMovementModal] = useState(false);
  const [movementDirection, setMovementDirection] = useState<'entree' | 'sortie'>('entree');
  const [showDebtCollectionModal, setShowDebtCollectionModal] = useState(false);
  const [selectedDebtInvoice, setSelectedDebtInvoice] = useState<Invoice | null>(null);

  // Form states
  const [newWorker, setNewWorker] = useState({
    name: '',
    phone: '',
    role: 'ميكانيكي سيارات',
    active: true,
    startDate: new Date().toISOString().split('T')[0],
    notes: '',
  });

  // Manual Wage Entry Form (تحكم يدوي كامل بالأجر حسب المهام المنجزة)
  const [newWageLog, setNewWageLog] = useState({
    workerId: '',
    date: new Date().toISOString().split('T')[0],
    taskDescription: '',
    wageAmount: 3000,
    payNowFromCaisse: true,
    paymentMethod: 'cash' as PaymentMethod,
  });

  const [newAdvance, setNewAdvance] = useState({
    workerId: '',
    date: new Date().toISOString().split('T')[0],
    amount: 1000,
    reason: '',
    payNowFromCaisse: true,
    paymentMethod: 'cash' as PaymentMethod,
  });

  const [newExpense, setNewExpense] = useState({
    title: '',
    category: 'supplies' as WorkshopExpense['category'],
    amount: 1500,
    paymentMethod: 'cash' as PaymentMethod,
    paidTo: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const [manualMovement, setManualMovement] = useState({
    title: '',
    amount: 5000,
    paymentMethod: 'cash' as PaymentMethod,
    category: 'depot_manuel' as CaisseMovement['category'],
    actor: 'صاحب الورشة',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const [debtPaymentForm, setDebtPaymentForm] = useState({
    amount: 0,
    paymentMethod: 'cash' as PaymentMethod,
    notes: '',
  });

  // Selected date for Daily Caisse
  const [selectedCaisseDate, setSelectedCaisseDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [showTodayOnly, setShowTodayOnly] = useState<boolean>(true);

  // Filter for movements history
  const [movementFilter, setMovementFilter] = useState<'all' | 'entree' | 'sortie'>('all');
  const [movementSearch, setMovementSearch] = useState('');

    // 1. TODAY'S CAISSE CALCULATIONS (الصندوق اليومي فقط)
  const todayStr = selectedCaisseDate;
  const todayMovements = caisseMovements.filter((m) => m.date === todayStr);
  const todayEntrees = todayMovements
    .filter((m) => m.type === 'entree')
    .reduce((acc, m) => acc + m.amount, 0);
  const todaySorties = todayMovements
    .filter((m) => m.type === 'sortie')
    .reduce((acc, m) => acc + m.amount, 0);
  const todayNetCaisse = todayEntrees - todaySorties;

  // 2. GLOBAL ALL-TIME GARAGE NET PROFIT (الدخل الصافي الإجمالي للڨراج وليس اليومي)
  // Total Billed Revenue (إجمالي مداخيل الفواتير الصادرة)
  const totalGlobalRevenue = invoices.reduce((acc, inv) => acc + inv.totalTTC, 0);
  // Total Operational Workshop Expenses (إجمالي مصاريف الورشة الكلية)
  const totalGlobalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);
  // Total Worker Costs (إجمالي تكاليف وأجور وتسبيقات العمال)
  const totalAllWorkerCost =
    workerWageLogs.reduce((acc, l) => acc + l.wageAmount, 0) +
    workerAdvances.reduce((acc, a) => acc + a.amount, 0);
  // الدخل الصافي الإجمالي للڨراج = إجمالي الإيرادات - المصاريف التشغيلية - أجور وتسبيقات العمال
  const globalGarageNetProfit = totalGlobalRevenue - totalGlobalExpenses - totalAllWorkerCost;

  // 1. CALCULATE CAISSE TOTALS ACCURATELY:
  // Total Entrées (كل المداخيل)
  const totalEntrees = caisseMovements
    .filter((m) => m.type === 'entree')
    .reduce((acc, m) => acc + m.amount, 0);

  // Total Sorties (كل المصاريف والمدفوعات)
  const totalSorties = caisseMovements
    .filter((m) => m.type === 'sortie')
    .reduce((acc, m) => acc + m.amount, 0);

  // Solde Net Actuel de la Caisse (رصيد الخزينة الصافي في الوقت الحقيقي)
  const currentCaisseBalance = totalEntrees - totalSorties;

  // Total Customer Debts (Créances Clients)
  const totalCustomerDebts = invoices
    .filter((inv) => inv.amountDue > 0)
    .reduce((acc, inv) => acc + inv.amountDue, 0);

  // Handlers
  const handleCreateWorker = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorker.name.trim()) return;
    onAddWorker(newWorker);
    setNewWorker({
      name: '',
      phone: '',
      role: 'ميكانيكي سيارات',
      active: true,
      startDate: new Date().toISOString().split('T')[0],
      notes: '',
    });
    setShowAddWorkerModal(false);
  };

  const handleCreateWageLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWageLog.workerId || !newWageLog.taskDescription.trim() || newWageLog.wageAmount <= 0) return;
    const worker = workers.find((w) => w.id === newWageLog.workerId);
    if (!worker) return;

    onAddWageLog({
      workerId: worker.id,
      workerName: worker.name,
      date: newWageLog.date,
      taskDescription: newWageLog.taskDescription.trim(),
      wageAmount: Number(newWageLog.wageAmount),
      isPaid: newWageLog.payNowFromCaisse,
      paidDate: newWageLog.payNowFromCaisse ? newWageLog.date : undefined,
    });

    // If paid immediately from caisse, record sortie directly in caisse
    if (newWageLog.payNowFromCaisse) {
      onAddManualMovement({
        date: newWageLog.date,
        type: 'sortie',
        category: 'ouvrier_salaire',
        title: `تسديد أجر يومي: ${worker.name} (${newWageLog.taskDescription})`,
        amount: Number(newWageLog.wageAmount),
        paymentMethod: newWageLog.paymentMethod,
        actor: worker.name,
        notes: 'دفع فوري من الصندوق',
      });
    }

    setNewWageLog({
      workerId: '',
      date: new Date().toISOString().split('T')[0],
      taskDescription: '',
      wageAmount: 3000,
      payNowFromCaisse: true,
      paymentMethod: 'cash',
    });
    setShowAddWageLogModal(false);
  };

  const handleCreateAdvance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdvance.workerId || newAdvance.amount <= 0) return;
    const worker = workers.find((w) => w.id === newAdvance.workerId);
    if (!worker) return;

    onAddAdvance({
      workerId: worker.id,
      workerName: worker.name,
      date: newAdvance.date,
      amount: Number(newAdvance.amount),
      reason: newAdvance.reason.trim() || 'تسبيقة نقدية',
      paymentMethod: newAdvance.paymentMethod,
    });

    // Directly link advance to Caisse as a SORTIE
    if (newAdvance.payNowFromCaisse) {
      onAddManualMovement({
        date: newAdvance.date,
        type: 'sortie',
        category: 'ouvrier_avance',
        title: `تسبيقة نقدية للعامل: ${worker.name} (${newAdvance.reason || 'تسبيق'})`,
        amount: Number(newAdvance.amount),
        paymentMethod: newAdvance.paymentMethod,
        actor: worker.name,
        notes: 'خصم مباشر من الصندوق اليومي',
      });
    }

    setNewAdvance({
      workerId: '',
      date: new Date().toISOString().split('T')[0],
      amount: 1000,
      reason: '',
      payNowFromCaisse: true,
      paymentMethod: 'cash',
    });
    setShowAddAdvanceModal(false);
  };

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpense.title.trim() || newExpense.amount <= 0) return;

    onAddExpense({
      title: newExpense.title.trim(),
      category: newExpense.category,
      amount: Number(newExpense.amount),
      paymentMethod: newExpense.paymentMethod,
      paidTo: newExpense.paidTo.trim(),
      date: newExpense.date,
      notes: newExpense.notes,
    });

    // Record directly into Caisse as a SORTIE
    onAddManualMovement({
      date: newExpense.date,
      type: 'sortie',
      category: 'depense_atelier',
      title: `مصروف ورشة: ${newExpense.title}`,
      amount: Number(newExpense.amount),
      paymentMethod: newExpense.paymentMethod,
      actor: newExpense.paidTo || 'مصاريف عامة',
      notes: newExpense.notes,
    });

    setNewExpense({
      title: '',
      category: 'supplies',
      amount: 1500,
      paymentMethod: 'cash',
      paidTo: '',
      date: new Date().toISOString().split('T')[0],
      notes: '',
    });
    setShowAddExpenseModal(false);
  };

  const handleCreateManualMovement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualMovement.title.trim() || manualMovement.amount <= 0) return;

    onAddManualMovement({
      date: manualMovement.date,
      type: movementDirection,
      category: movementDirection === 'entree' ? 'depot_manuel' : 'retrait_proprietaire',
      title: manualMovement.title.trim(),
      amount: Number(manualMovement.amount),
      paymentMethod: manualMovement.paymentMethod,
      actor: manualMovement.actor.trim() || 'صاحب الورشة',
      notes: manualMovement.notes,
    });

    setManualMovement({
      title: '',
      amount: 5000,
      paymentMethod: 'cash',
      category: 'depot_manuel',
      actor: 'صاحب الورشة',
      date: new Date().toISOString().split('T')[0],
      notes: '',
    });
    setShowManualMovementModal(false);
  };

  const handlePayWorkerWageDirect = (logId: string, amount: number, workerName: string, taskDesc: string) => {
    onPayWorkerWage(logId, amount, 'cash');
    // Direct sortie in Caisse
    onAddManualMovement({
      date: new Date().toISOString().split('T')[0],
      type: 'sortie',
      category: 'ouvrier_salaire',
      title: `تسديد أجر عمل للعامل: ${workerName} (${taskDesc})`,
      amount,
      paymentMethod: 'cash',
      actor: workerName,
      notes: 'تسوية نقدية من الصندوق',
    });
  };

  const handleDebtCollectionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDebtInvoice || debtPaymentForm.amount <= 0) return;

    onCollectClientDebt(
      selectedDebtInvoice.id,
      Number(debtPaymentForm.amount),
      debtPaymentForm.paymentMethod,
      debtPaymentForm.notes || 'تحصيل دفعة من الزبون'
    );

    setShowDebtCollectionModal(false);
    setSelectedDebtInvoice(null);
  };

  // Filtered movements for history table
  const filteredMovements = caisseMovements.filter((m) => {
    const matchesDate = !showTodayOnly || m.date === selectedCaisseDate;
    const matchesDirection = movementFilter === 'all' || m.type === movementFilter;
    const matchesSearch =
      m.title.toLowerCase().includes(movementSearch.toLowerCase()) ||
      (m.actor && m.actor.toLowerCase().includes(movementSearch.toLowerCase()));
    return matchesDate && matchesDirection && matchesSearch;
  });

  // Selected Worker Stats
  const activeWorker = workers.find((w) => w.id === selectedWorkerId) || workers[0];
  const activeWorkerLogs = workerWageLogs.filter((l) => l.workerId === activeWorker?.id);
  const activeWorkerAdvances = workerAdvances.filter((a) => a.workerId === activeWorker?.id);

  const totalWorkerWagesEarned = activeWorkerLogs.reduce((acc, l) => acc + l.wageAmount, 0);
  const totalWorkerAdvancesTaken = activeWorkerAdvances.reduce((acc, a) => acc + a.amount, 0);
  const totalWorkerWagesPaid = activeWorkerLogs.filter((l) => l.isPaid).reduce((acc, l) => acc + l.wageAmount, 0);
  // Net remaining due to worker = Total earned - Total advances - Total paid wages
  const netDueToWorker = Math.max(0, totalWorkerWagesEarned - totalWorkerAdvancesTaken - totalWorkerWagesPaid);

  return (
    <div className="space-y-6">
      {/* TOP TABS: CAISSE JOURNALIÈRE | OUVIERS & SALAIRES | CRÉANCES CLIENTS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-800/80 p-5 rounded-xl border border-slate-700/80">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Wallet className="w-6 h-6 text-emerald-400" />
            الصندوق اليومي، حسابات العمال وديون الزبائن
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            إدارة متكاملة للخزينة في الوقت الفعلي مع ربط مباشر لمدفوعات الفواتير، المصاريف، وتسبيقات وأجور العمال.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-lg border border-slate-700 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('caisse')}
            className={`px-4 py-2 rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'caisse'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Wallet className="w-3.5 h-3.5" />
            الصندوق اليومي (Caisse)
          </button>

          <button
            onClick={() => setActiveTab('workers')}
            className={`px-4 py-2 rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'workers'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            مستحقات وتسبيقات العمال
          </button>

          <button
            onClick={() => setActiveTab('debts')}
            className={`px-4 py-2 rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'debts'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            ديون الزبائن ({invoices.filter((i) => i.amountDue > 0).length})
          </button>
        </div>
      </div>

      {/* FINANCIAL BANNERS: 1. الدخل الصافي الإجمالي للڨراج (GLOBAL NET INCOME) + 2. الصندوق اليومي فقط (DAILY CAISSE) */}
      <div className="space-y-4">
        {/* TIER 1: الدخل الصافي الإجمالي للڨراج (GLOBAL ALL-TIME GARAGE NET PROFIT) */}
        <div className="p-5 rounded-xl border border-amber-500/40 bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-900 shadow-2xl relative overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded text-[11px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  الأرباح والدخل التراكمي للورشة
                </span>
                <span className="text-xs text-slate-400">حساب إجمالي غير محصور بيوم واحد</span>
              </div>
              <h3 className="text-sm font-bold text-slate-200 mt-2">
                الدخل الصافي الإجمالي للڨراج (Bénéfice Net Total du Garage)
              </h3>
              <div className="mt-1 flex items-baseline gap-3">
                <div className={`text-3xl font-black font-mono tracking-tight ${
                  globalGarageNetProfit >= 0 ? 'text-amber-400' : 'text-rose-400'
                }`}>
                  {formatDZD(globalGarageNetProfit)}
                </div>
                <span className="text-xs text-slate-400">
                  (صافي أرباح الورشة الحقيقية بعد خصم مصاريف الورشة وأجور العمال)
                </span>
              </div>
            </div>

            {/* Breakdown Sub-Metrics Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/60 p-3 rounded-lg border border-slate-700/60 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">إجمالي فواتير الورشة:</span>
                <span className="font-mono font-bold text-white text-xs">
                  +{formatDZD(totalGlobalRevenue)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">إجمالي مصاريف الورشة:</span>
                <span className="font-mono font-bold text-rose-400 text-xs">
                  -{formatDZD(totalGlobalExpenses)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">أجور وتسبيقات العمال:</span>
                <span className="font-mono font-bold text-purple-300 text-xs">
                  -{formatDZD(totalAllWorkerCost)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">السيولة الحالية بالصندوق:</span>
                <span className="font-mono font-black text-emerald-400 text-xs">
                  {formatDZD(currentCaisseBalance)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* TIER 2: الصندوق اليومي فقط (DAILY CAISSE OF THE DAY) */}
        <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/80">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-700">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-500/20 text-blue-400 rounded-lg">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">حركة الصندوق اليومي (Caisse du Jour)</h4>
                <p className="text-[11px] text-slate-400">متابعة دقيقة لمداخيل ومصاريف اليوم فقط</p>
              </div>
            </div>

            {/* Date Picker for Daily Caisse */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400 font-semibold">تاريخ اليوم:</span>
              <input
                type="date"
                value={selectedCaisseDate}
                onChange={(e) => setSelectedCaisseDate(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-white font-mono text-xs focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={() => setSelectedCaisseDate(new Date().toISOString().split('T')[0])}
                className="px-2.5 py-1 rounded bg-slate-700 hover:bg-slate-600 text-[11px] text-slate-200 cursor-pointer"
              >
                اليوم
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mt-3">
            {/* Box 1: مداخيل اليوم */}
            <div className="p-3 bg-slate-900/70 border border-slate-700 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-[11px]">مداخيل اليوم (Entrées)</span>
                <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="text-lg font-mono font-bold text-emerald-400 mt-1">
                +{formatDZD(todayEntrees)}
              </div>
            </div>

            {/* Box 2: مصاريف اليوم */}
            <div className="p-3 bg-slate-900/70 border border-slate-700 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-[11px]">مصاريف اليوم (Sorties)</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-rose-400" />
              </div>
              <div className="text-lg font-mono font-bold text-rose-400 mt-1">
                -{formatDZD(todaySorties)}
              </div>
            </div>

            {/* Box 3: صافي حركة اليوم */}
            <div className="p-3 bg-slate-900/70 border border-slate-700 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-[11px]">صافي حركة اليوم</span>
                <Wallet className="w-3.5 h-3.5 text-blue-400" />
              </div>
              <div className={`text-lg font-mono font-black mt-1 ${
                todayNetCaisse >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {formatDZD(todayNetCaisse)}
              </div>
            </div>

            {/* Box 4: رصيد الخزينة الإجمالي الحالي */}
            <div className="p-3 bg-slate-900/70 border border-slate-700 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-[11px]">السيولة الحالية في الصندوق</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
              </div>
              <div className={`text-lg font-mono font-black mt-1 ${
                currentCaisseBalance >= 0 ? 'text-emerald-300' : 'text-rose-300'
              }`}>
                {formatDZD(currentCaisseBalance)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: CAISSE JOURNALIÈRE (الصندوق اليومي وسجل الحركات اللحظي) */}
      {/* ============================================================== */}
      {activeTab === 'caisse' && (
        <div className="space-y-6">
          {/* Quick Buttons for Caisse */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-800/60 p-4 rounded-xl border border-slate-700/60">
            <div className="text-xs text-slate-300">
              <span className="font-bold text-white">إجراءات الصندوق:</span> قيد مباشر للمداخيل والمصاريف في الوقت الفعلي
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  setMovementDirection('entree');
                  setManualMovement((prev) => ({
                    ...prev,
                    title: 'إيداع نقدي في الصندوق',
                    category: 'depot_manuel',
                  }));
                  setShowManualMovementModal(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm cursor-pointer"
              >
                <ArrowDownLeft className="w-4 h-4" />
                + تسجيل مدخول جديد (Entrée)
              </button>

              <button
                onClick={() => setShowAddExpenseModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg shadow-sm cursor-pointer"
              >
                <ArrowUpRight className="w-4 h-4" />
                - تسجيل مصروف تشغيلي (Dépense)
              </button>

              <button
                onClick={() => {
                  setMovementDirection('sortie');
                  setManualMovement((prev) => ({
                    ...prev,
                    title: 'سحب أموال لصاحب الورشة',
                    category: 'retrait_proprietaire',
                  }));
                  setShowManualMovementModal(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-amber-300 bg-amber-950 border border-amber-700/60 hover:bg-amber-900 rounded-lg cursor-pointer"
              >
                <DollarSign className="w-4 h-4" />
                سحب أرباح للمالك (Retrait)
              </button>
            </div>
          </div>

          {/* SPREADSHEET LEDGER: HISTORIQUE DES MOUVEMENTS DE LA CAISSE */}
          <div className="bg-slate-800/80 rounded-xl border border-slate-700/80 p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-700">
              <div>
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-blue-400" />
                  سجل الحركات اليومية للصندوق (Historique des Mouvements)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  كافة العمليات المقيدة تلقائياً ويدوياً (مداخيل الفواتير، المصاريف، التسبيقات، وأجور العمال)
                </p>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2 text-xs">
                <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5">
                  <Search className="w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="بحث في البيان أو المسؤول..."
                    value={movementSearch}
                    onChange={(e) => setMovementSearch(e.target.value)}
                    className="bg-transparent text-white focus:outline-none text-xs w-44"
                  />
                </div>

                <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-700">
                  <button
                    onClick={() => setMovementFilter('all')}
                    className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer ${
                      movementFilter === 'all' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    الكل ({caisseMovements.length})
                  </button>
                  <button
                    onClick={() => setMovementFilter('entree')}
                    className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer ${
                      movementFilter === 'entree' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    مداخيل (+)
                  </button>
                  <button
                    onClick={() => setMovementFilter('sortie')}
                    className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer ${
                      movementFilter === 'sortie' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    مصاريف (-)
                  </button>
                </div>
              </div>
            </div>

            {/* Ledger Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-right">
                <thead>
                  <tr className="bg-slate-900/60 border-b border-slate-700 text-slate-400 font-semibold">
                    <th className="py-2.5 px-3">التاريخ</th>
                    <th className="py-2.5 px-3">نوع الحركة</th>
                    <th className="py-2.5 px-3">البيان والتفاصيل</th>
                    <th className="py-2.5 px-3">طريقة الدفع</th>
                    <th className="py-2.5 px-3">الزبون / الفني / المسؤول</th>
                    <th className="py-2.5 px-3 text-left">المبلغ بالدينار</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60 font-medium">
                  {filteredMovements.map((mov) => (
                    <tr key={mov.id} className="hover:bg-slate-700/30 transition-colors">
                      <td className="py-2.5 px-3 font-mono text-slate-400">{mov.date}</td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                            mov.type === 'entree'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : 'bg-rose-950 text-rose-300 border border-rose-800'
                          }`}
                        >
                          {mov.type === 'entree' ? (
                            <>
                              <ArrowDownLeft className="w-3 h-3" /> مدخول (+)
                            </>
                          ) : (
                            <>
                              <ArrowUpRight className="w-3 h-3" /> مصروف (-)
                            </>
                          )}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-bold text-white">{mov.title}</td>
                      <td className="py-2.5 px-3 text-slate-300">
                        <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-[10px]">
                          {mov.paymentMethod === 'cash'
                            ? 'نقداً (Espèces)'
                            : mov.paymentMethod === 'virement'
                            ? 'تحويل BNA'
                            : mov.paymentMethod === 'cheque'
                            ? 'شيك'
                            : 'آجل'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-400">{mov.actor || '-'}</td>
                      <td className="py-2.5 px-3 text-left">
                        <span
                          className={`font-mono font-black text-xs ${
                            mov.type === 'entree' ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {mov.type === 'entree' ? '+' : '-'}{mov.amount.toLocaleString()} دج
                        </span>
                      </td>
                    </tr>
                  ))}
                  {filteredMovements.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-500 italic">
                        لا توجد حركات مقيدة مطابقة.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: OUVIERS & AVANCES (دفتر حسابات العمال والأجر اليدوي الكامل) */}
      {/* ========================================================================= */}
      {activeTab === 'workers' && (
        <div className="space-y-6">
          {/* Top Actions for Workers */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-800/60 p-4 rounded-xl border border-slate-700/60">
            <div>
              <h3 className="text-sm font-bold text-white">دفتر حسابات وأجور العمال (Comptabilité Ouvriers)</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                التحكم اليدوي الكامل بالأجر اليومي حسب المهام المنجزة، وتسجيل التسبيقات مع الخصم الفوري من الصندوق.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setShowAddWageLogModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded-lg shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                تسجيل أجر ومهمة منجزة اليوم (يدوياً)
              </button>

              <button
                onClick={() => setShowAddAdvanceModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-amber-300 bg-amber-950 border border-amber-700 hover:bg-amber-900 rounded-lg cursor-pointer"
              >
                <DollarSign className="w-4 h-4 text-amber-400" />
                منح تسبيقة نقدية للعامل (Avance)
              </button>

              <button
                onClick={() => setShowAddWorkerModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-200 bg-slate-700 hover:bg-slate-600 rounded-lg cursor-pointer"
              >
                <Users className="w-4 h-4" />
                إضافة عامل جديد
              </button>
            </div>
          </div>

          {/* 2-COLUMN VIEW: WORKER SELECTOR / SUMMARY & DETAILED LEDGER */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left: Workers List Cards (4 cols) */}
            <div className="lg:col-span-4 bg-slate-800/80 rounded-xl border border-slate-700/80 p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-700">
                <span className="font-bold text-white text-xs uppercase">فريق الورشة ({workers.length})</span>
                <span className="text-[11px] text-slate-400">انقر لعرض دفتر حسابه</span>
              </div>

              {workers.map((w) => {
                const logs = workerWageLogs.filter((l) => l.workerId === w.id);
                const advs = workerAdvances.filter((a) => a.workerId === w.id);
                const earned = logs.reduce((acc, l) => acc + l.wageAmount, 0);
                const advanced = advs.reduce((acc, a) => acc + a.amount, 0);
                const paidWages = logs.filter((l) => l.isPaid).reduce((acc, l) => acc + l.wageAmount, 0);
                const due = Math.max(0, earned - advanced - paidWages);
                const isSelected = activeWorker?.id === w.id;

                return (
                  <div
                    key={w.id}
                    onClick={() => setSelectedWorkerId(w.id)}
                    className={`p-3 rounded-lg border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-950/50 border-blue-500 shadow ring-1 ring-blue-500/50'
                        : 'bg-slate-900/60 border-slate-700/70 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-bold text-white text-sm">{w.name}</div>
                        <div className="text-[11px] text-blue-400">{w.role}</div>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">{w.phone}</span>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                      <span className="text-slate-400">الصافي المتبقي له:</span>
                      <span
                        className={`font-mono font-black ${
                          due > 0 ? 'text-rose-400' : 'text-emerald-400'
                        }`}
                      >
                        {due.toLocaleString()} دج
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right: Detailed Worker Ledger & Statements (8 cols) */}
            <div className="lg:col-span-8 bg-slate-800/80 rounded-xl border border-slate-700/80 p-5 space-y-5">
              {activeWorker ? (
                <>
                  {/* Worker Header Card */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-700">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-white">{activeWorker.name}</h3>
                        <span className="px-2 py-0.5 rounded text-[10px] bg-blue-950 text-blue-300 border border-blue-800">
                          {activeWorker.role}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        الهاتف: {activeWorker.phone || 'غير مسجل'} • تاريخ الالتحاق: {activeWorker.startDate}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setNewWageLog((prev) => ({ ...prev, workerId: activeWorker.id }));
                          setShowAddWageLogModal(true);
                        }}
                        className="px-3 py-1.5 text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white rounded-lg cursor-pointer"
                      >
                        + تسجيل أجر مهمة
                      </button>
                      <button
                        onClick={() => {
                          setNewAdvance((prev) => ({ ...prev, workerId: activeWorker.id }));
                          setShowAddAdvanceModal(true);
                        }}
                        className="px-3 py-1.5 text-xs font-semibold bg-amber-950 border border-amber-700 text-amber-300 hover:bg-amber-900 rounded-lg cursor-pointer"
                      >
                        + تسبيقة (Avance)
                      </button>
                    </div>
                  </div>

                  {/* Worker 4-Box Financial Statement */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-3 bg-slate-900/70 border border-slate-700 rounded-lg">
                      <span className="text-slate-400 block text-[11px]">مجموع المستحقات المكتسبة</span>
                      <span className="font-mono font-bold text-white text-sm mt-0.5 block">
                        {totalWorkerWagesEarned.toLocaleString()} دج
                      </span>
                    </div>

                    <div className="p-3 bg-slate-900/70 border border-slate-700 rounded-lg">
                      <span className="text-slate-400 block text-[11px]">مجموع التسبيقات (Avances)</span>
                      <span className="font-mono font-bold text-amber-400 text-sm mt-0.5 block">
                        {totalWorkerAdvancesTaken.toLocaleString()} دج
                      </span>
                    </div>

                    <div className="p-3 bg-slate-900/70 border border-slate-700 rounded-lg">
                      <span className="text-slate-400 block text-[11px]">المسدد نقداً من الصندوق</span>
                      <span className="font-mono font-bold text-emerald-400 text-sm mt-0.5 block">
                        {totalWorkerWagesPaid.toLocaleString()} دج
                      </span>
                    </div>

                    <div className="p-3 bg-slate-900/70 border border-rose-900/50 rounded-lg bg-rose-950/20">
                      <span className="text-rose-400 font-bold block text-[11px]">الصافي المستحق للعامل</span>
                      <span className="font-mono font-black text-rose-300 text-base mt-0.5 block">
                        {netDueToWorker.toLocaleString()} دج
                      </span>
                    </div>
                  </div>

                  {/* Table: Wage Logs & Tasks */}
                  <div className="space-y-2">
                    <h4 className="font-bold text-white text-xs">سجل الأعمال والأجور المحددة يدوياً:</h4>
                    <div className="overflow-x-auto bg-slate-900/60 rounded-lg border border-slate-700">
                      <table className="w-full text-xs text-right">
                        <thead>
                          <tr className="border-b border-slate-700 text-slate-400 font-semibold">
                            <th className="py-2 px-3">التاريخ</th>
                            <th className="py-2 px-3">المهام والأعمال المنجزة بالورشة</th>
                            <th className="py-2 px-3">الأجر المحدد (دج)</th>
                            <th className="py-2 px-3 text-left">حالة التسديد والصندوق</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 font-medium">
                          {activeWorkerLogs.map((log) => (
                            <tr key={log.id}>
                              <td className="py-2 px-3 font-mono text-slate-400">{log.date}</td>
                              <td className="py-2 px-3 font-bold text-white">{log.taskDescription}</td>
                              <td className="py-2 px-3 font-mono font-bold text-slate-200">
                                {log.wageAmount.toLocaleString()} دج
                              </td>
                              <td className="py-2 px-3 text-left">
                                {log.isPaid ? (
                                  <span className="inline-flex items-center gap-1 text-emerald-400 font-bold text-[11px]">
                                    <Check className="w-3.5 h-3.5" /> مسدد ومخصوم من الصندوق
                                  </span>
                                ) : (
                                  <button
                                    onClick={() =>
                                      handlePayWorkerWageDirect(
                                        log.id,
                                        log.wageAmount,
                                        activeWorker.name,
                                        log.taskDescription
                                      )
                                    }
                                    className="px-2.5 py-1 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded cursor-pointer"
                                  >
                                    دفع وخصم من الصندوق الآن
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                          {activeWorkerLogs.length === 0 && (
                            <tr>
                              <td colSpan={4} className="py-6 text-center text-slate-500 italic">
                                لم يتم تسجيل أي أجور لهذا العامل بعد.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Table: Advances (التسبيقات) */}
                  <div className="space-y-2 pt-2">
                    <h4 className="font-bold text-white text-xs text-amber-300">سجل التسبيقات الممنوحة (Avances):</h4>
                    <div className="overflow-x-auto bg-slate-900/60 rounded-lg border border-slate-700">
                      <table className="w-full text-xs text-right">
                        <thead>
                          <tr className="border-b border-slate-700 text-slate-400 font-semibold">
                            <th className="py-2 px-3">التاريخ</th>
                            <th className="py-2 px-3">مبلغ التسبيقة</th>
                            <th className="py-2 px-3">السبب / البيان</th>
                            <th className="py-2 px-3 text-left">التأثير على الصندوق</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 font-medium">
                          {activeWorkerAdvances.map((adv) => (
                            <tr key={adv.id}>
                              <td className="py-2 px-3 font-mono text-slate-400">{adv.date}</td>
                              <td className="py-2 px-3 font-mono font-bold text-amber-400">
                                {adv.amount.toLocaleString()} دج
                              </td>
                              <td className="py-2 px-3 text-slate-300">{adv.reason}</td>
                              <td className="py-2 px-3 text-left text-[11px] text-rose-400 font-semibold">
                                خروج نقدي مخصوم (Sortie)
                              </td>
                            </tr>
                          ))}
                          {activeWorkerAdvances.length === 0 && (
                            <tr>
                              <td colSpan={4} className="py-6 text-center text-slate-500 italic">
                                لا توجد تسبيقات مسجلة لهذا العامل.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-20 text-slate-400">
                  اختر عاملاً من القائمة الجانبية أو قم بإضافة عامل جديد.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: CRÉANCES CLIENTS (ديون الزبائن والتحصيل المباشر) */}
      {/* ========================================================================= */}
      {activeTab === 'debts' && (
        <div className="bg-slate-800/80 rounded-xl border border-slate-700/80 p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-700">
            <div>
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-amber-400" />
                ديون الزبائن والفواتير غير المسددة (Créances Clients)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                متابعة المبالغ المتبقية على الزبائن وتحصيل الدفعات مباشرة لتدخل فوراً في الصندوق اليومي
              </p>
            </div>

            <div className="text-left">
              <span className="text-xs text-slate-400 block">إجمالي الديون المعلقة:</span>
              <span className="text-lg font-mono font-black text-rose-400">
                {formatDZD(totalCustomerDebts)}
              </span>
            </div>
          </div>

          {/* Debts Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right">
              <thead>
                <tr className="bg-slate-900/60 border-b border-slate-700 text-slate-400 font-semibold">
                  <th className="py-3 px-3">رقم الفاتورة</th>
                  <th className="py-3 px-3">تاريخ الفاتورة</th>
                  <th className="py-3 px-3">اسم الزبون والهاتف</th>
                  <th className="py-3 px-3">السيارة</th>
                  <th className="py-3 px-3">الإجمالي T.T.C</th>
                  <th className="py-3 px-3">المدفوع (Versé)</th>
                  <th className="py-3 px-3 font-bold text-rose-400">المتبقي (الدين)</th>
                  <th className="py-3 px-3 text-left">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60 font-medium">
                {invoices
                  .filter((inv) => inv.amountDue > 0)
                  .map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-700/30">
                      <td className="py-3 px-3 font-mono font-bold text-blue-400">{inv.invoiceNumber}</td>
                      <td className="py-3 px-3 font-mono text-slate-400">{inv.date}</td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-white">{inv.customerName}</div>
                        <div className="text-[11px] font-mono text-slate-400">{inv.customerPhone}</div>
                      </td>
                      <td className="py-3 px-3 text-slate-300">
                        {inv.vehicleDescription} • {inv.matricule}
                      </td>
                      <td className="py-3 px-3 font-mono text-white">{inv.totalTTC.toLocaleString()} دج</td>
                      <td className="py-3 px-3 font-mono text-emerald-400">{inv.amountPaid.toLocaleString()} دج</td>
                      <td className="py-3 px-3 font-mono font-black text-rose-400 text-sm">
                        {inv.amountDue.toLocaleString()} دج
                      </td>
                      <td className="py-3 px-3 text-left">
                        <button
                          onClick={() => {
                            setSelectedDebtInvoice(inv);
                            setDebtPaymentForm({
                              amount: inv.amountDue,
                              paymentMethod: 'cash',
                              notes: 'تحصيل دفعة نقدية بالورشة',
                            });
                            setShowDebtCollectionModal(true);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm cursor-pointer"
                        >
                          <DollarSign className="w-3.5 h-3.5" />
                          تحصيل دفعة الآن
                        </button>
                      </td>
                    </tr>
                  ))}
                {invoices.filter((inv) => inv.amountDue > 0).length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-emerald-400 font-bold">
                      ممتاز! لا توجد أي ديون معلقة على الزبائن حالياً.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================= */}
      {/* MODAL 1: ADD WAGE LOG (تسجيل أجر ومهمة منجزة يدوياً) */}
      {/* ======================================================= */}
      {showAddWageLogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-md w-full p-6 text-slate-100 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-2">تسجيل أجر عمل ومهمة منجزة يدوياً</h3>
            <p className="text-xs text-slate-400 mb-4">
              أدخل الأجر الذي يستحقه العامل بناءً على ما أنجزه اليوم في الورشة
            </p>

            <form onSubmit={handleCreateWageLog} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">العامل المستحق *</label>
                <select
                  required
                  value={newWageLog.workerId}
                  onChange={(e) => setNewWageLog({ ...newWageLog, workerId: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">اختر العامل...</option>
                  {workers.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">العمل والمهام المنجزة بالورشة *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="مثال: تفكيك وإصلاح علبة السرعة لرونو كليو + تغيير سائل التبريد"
                  value={newWageLog.taskDescription}
                  onChange={(e) => setNewWageLog({ ...newWageLog, taskDescription: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">الأجر المحدد لهذا العمل (دج) *</label>
                  <input
                    type="number"
                    required
                    min="100"
                    step="100"
                    value={newWageLog.wageAmount}
                    onChange={(e) => setNewWageLog({ ...newWageLog, wageAmount: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 font-mono text-emerald-400 font-bold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">التاريخ</label>
                  <input
                    type="date"
                    value={newWageLog.date}
                    onChange={(e) => setNewWageLog({ ...newWageLog, date: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 font-mono text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Direct Link to Caisse */}
              <div className="p-3 bg-slate-800/90 rounded-lg border border-slate-700 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-200">
                  <input
                    type="checkbox"
                    checked={newWageLog.payNowFromCaisse}
                    onChange={(e) =>
                      setNewWageLog({ ...newWageLog, payNowFromCaisse: e.target.checked })
                    }
                    className="rounded text-blue-600 w-4 h-4"
                  />
                  <span>دفع المبلغ الآن وخصمه فوراً كـ "مصروف (Sortie)" من الصندوق اليومي</span>
                </label>
                {newWageLog.payNowFromCaisse && (
                  <div className="text-[11px] text-emerald-400">
                    سيتم قيد خروج {Number(newWageLog.wageAmount).toLocaleString()} دج فوراً من الخزينة ليتطابق الصندوق 100%.
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddWageLogModal(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-lg cursor-pointer"
                >
                  حفظ في حساب العامل
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================= */}
      {/* MODAL 2: ADD ADVANCE (تسجيل تسبيقة للعامل) */}
      {/* ======================================================= */}
      {showAddAdvanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-md w-full p-6 text-slate-100 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-2">منح تسبيقة نقدية للعامل (Avance)</h3>
            <p className="text-xs text-slate-400 mb-4">
              تسجيل تسبيقة تقيد في حساب العامل وتخصم مباشرة من الصندوق اليومي
            </p>

            <form onSubmit={handleCreateAdvance} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">العامل المستفيد *</label>
                <select
                  required
                  value={newAdvance.workerId}
                  onChange={(e) => setNewAdvance({ ...newAdvance, workerId: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none"
                >
                  <option value="">اختر العامل...</option>
                  {workers.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.role})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">مبلغ التسبيقة (دج) *</label>
                  <input
                    type="number"
                    required
                    min="100"
                    step="100"
                    value={newAdvance.amount}
                    onChange={(e) => setNewAdvance({ ...newAdvance, amount: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 font-mono text-amber-400 font-bold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">التاريخ</label>
                  <input
                    type="date"
                    value={newAdvance.date}
                    onChange={(e) => setNewAdvance({ ...newAdvance, date: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 font-mono text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">السبب أو ملاحظات</label>
                <input
                  type="text"
                  placeholder="مثال: تسبيقة مصاريف شخصية / عيد"
                  value={newAdvance.reason}
                  onChange={(e) => setNewAdvance({ ...newAdvance, reason: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none"
                />
              </div>

              <div className="p-3 bg-amber-950/40 rounded-lg border border-amber-800/60 text-amber-300 text-[11px]">
                سيتم خصم هذا المبلغ فوراً من رصيد الصندوق اليومي وقيده كـ Sortie de caisse لتبقى الخزينة مطابقة.
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddAdvanceModal(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-lg cursor-pointer"
                >
                  صرف التسبيقة وخصمها
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================= */}
      {/* MODAL 3: ADD EXPENSE (تسجيل مصروف تشغيلي) */}
      {/* ======================================================= */}
      {showAddExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-md w-full p-6 text-slate-100 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-4">تسجيل مصروف تشغيلي للورشة (Dépense)</h3>
            <form onSubmit={handleCreateExpense} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">بيان المصروف *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: فاتورة كهرباء سونلغاز / شراء مفاتيح عتاد / وجبات غداء"
                  value={newExpense.title}
                  onChange={(e) => setNewExpense({ ...newExpense, title: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">التصنيف</label>
                  <select
                    value={newExpense.category}
                    onChange={(e) =>
                      setNewExpense({
                        ...newExpense,
                        category: e.target.value as WorkshopExpense['category'],
                      })
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none"
                  >
                    <option value="supplies">مواد استهلاك وتنظيف</option>
                    <option value="tools">عتاد وأدوات صيانة</option>
                    <option value="electricity">كهرباء / غاز / ماء</option>
                    <option value="rent">إيجار الورشة</option>
                    <option value="meals">وجبات وإطعام الفنيين</option>
                    <option value="fuel">وقود وتوصيل</option>
                    <option value="other">مصاريف أخرى</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">المبلغ (دج) *</label>
                  <input
                    type="number"
                    required
                    min="10"
                    step="50"
                    value={newExpense.amount}
                    onChange={(e) => setNewExpense({ ...newExpense, amount: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 font-mono text-rose-400 font-bold focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">طريقة الدفع</label>
                  <select
                    value={newExpense.paymentMethod}
                    onChange={(e) =>
                      setNewExpense({
                        ...newExpense,
                        paymentMethod: e.target.value as PaymentMethod,
                      })
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none"
                  >
                    <option value="cash">نقداً (Espèces)</option>
                    <option value="virement">تحويل بنكي BNA</option>
                    <option value="cheque">شيك</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">التاريخ</label>
                  <input
                    type="date"
                    value={newExpense.date}
                    onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 font-mono text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">المدفوع له</label>
                <input
                  type="text"
                  placeholder="اسم المورد أو المحل"
                  value={newExpense.paidTo}
                  onChange={(e) => setNewExpense({ ...newExpense, paidTo: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddExpenseModal(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-lg cursor-pointer"
                >
                  تسجيل وخصم المصروف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================= */}
      {/* MODAL 4: MANUAL CAISSE MOVEMENT (إيداع أو سحب نقدي) */}
      {/* ======================================================= */}
      {showManualMovementModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-md w-full p-6 text-slate-100 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-2">
              {movementDirection === 'entree'
                ? 'تسجيل مدخول جديد في الخزينة (+)'
                : 'تسجيل سحب أموال من الخزينة (-)'}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              تأثير فوري على رصيد الصندوق اليومي لورشة KraftSchmiede
            </p>

            <form onSubmit={handleCreateManualMovement} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">البيان *</label>
                <input
                  type="text"
                  required
                  value={manualMovement.title}
                  onChange={(e) => setManualMovement({ ...manualMovement, title: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">المبلغ (دج) *</label>
                  <input
                    type="number"
                    required
                    min="50"
                    step="50"
                    value={manualMovement.amount}
                    onChange={(e) =>
                      setManualMovement({ ...manualMovement, amount: Number(e.target.value) })
                    }
                    className={`w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 font-mono font-bold focus:outline-none ${
                      movementDirection === 'entree' ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">طريقة الدفع</label>
                  <select
                    value={manualMovement.paymentMethod}
                    onChange={(e) =>
                      setManualMovement({
                        ...manualMovement,
                        paymentMethod: e.target.value as PaymentMethod,
                      })
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none"
                  >
                    <option value="cash">نقداً (Espèces)</option>
                    <option value="virement">تحويل بنكي BNA</option>
                    <option value="cheque">شيك</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">المسؤول / القائم بالعملية</label>
                  <input
                    type="text"
                    value={manualMovement.actor}
                    onChange={(e) => setManualMovement({ ...manualMovement, actor: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">التاريخ</label>
                  <input
                    type="date"
                    value={manualMovement.date}
                    onChange={(e) => setManualMovement({ ...manualMovement, date: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 font-mono text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowManualMovementModal(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 text-white font-semibold rounded-lg cursor-pointer ${
                    movementDirection === 'entree'
                      ? 'bg-emerald-600 hover:bg-emerald-500'
                      : 'bg-amber-600 hover:bg-amber-500'
                  }`}
                >
                  تأكيد الحركة في الصندوق
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================= */}
      {/* MODAL 5: COLLECT CLIENT DEBT (تحصيل دين زبون) */}
      {/* ======================================================= */}
      {showDebtCollectionModal && selectedDebtInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-md w-full p-6 text-slate-100 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-2">تحصيل دفعة من دين الزبون</h3>
            <p className="text-xs text-slate-400 mb-4">
              الفاتورة: {selectedDebtInvoice.invoiceNumber} • الزبون: {selectedDebtInvoice.customerName}
            </p>

            <form onSubmit={handleDebtCollectionSubmit} className="space-y-4 text-xs">
              <div className="p-3 bg-slate-800 rounded-lg border border-slate-700 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">إجمالي الفاتورة:</span>
                  <span className="font-mono font-bold text-white">
                    {selectedDebtInvoice.totalTTC.toLocaleString()} دج
                  </span>
                </div>
                <div className="flex justify-between font-bold text-rose-400">
                  <span>المبلغ المتبقي كدين:</span>
                  <span className="font-mono">{selectedDebtInvoice.amountDue.toLocaleString()} دج</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">المبلغ المستلم الآن *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    max={selectedDebtInvoice.amountDue}
                    value={debtPaymentForm.amount}
                    onChange={(e) =>
                      setDebtPaymentForm({ ...debtPaymentForm, amount: Number(e.target.value) })
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 font-mono text-emerald-400 font-bold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">طريقة الدفع</label>
                  <select
                    value={debtPaymentForm.paymentMethod}
                    onChange={(e) =>
                      setDebtPaymentForm({
                        ...debtPaymentForm,
                        paymentMethod: e.target.value as PaymentMethod,
                      })
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none"
                  >
                    <option value="cash">نقداً (Espèces)</option>
                    <option value="virement">تحويل بنكي BNA</option>
                    <option value="cheque">شيك</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">ملاحظات أو رقم الوصل</label>
                <input
                  type="text"
                  value={debtPaymentForm.notes}
                  onChange={(e) =>
                    setDebtPaymentForm({ ...debtPaymentForm, notes: e.target.value })
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none"
                />
              </div>

              <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-lg text-emerald-300 text-[11px]">
                سيتم إضافة هذا المبلغ تلقائياً كـ "مدخول (Entrée)" في الصندوق اليومي وتخفيض دين الزبون.
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowDebtCollectionModal(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg cursor-pointer"
                >
                  تأكيد القبض وإيداع بالصندوق
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 6: ADD WORKER */}
      {showAddWorkerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-md w-full p-6 text-slate-100 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-4">إضافة فني / عامل جديد</h3>
            <form onSubmit={handleCreateWorker} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">اسم العامل الكامل *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: أمين بلحاج"
                  value={newWorker.name}
                  onChange={(e) => setNewWorker({ ...newWorker, name: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">الدور / الاختصاص</label>
                  <select
                    value={newWorker.role}
                    onChange={(e) => setNewWorker({ ...newWorker, role: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none"
                  >
                    <option value="ميكانيكي سيارات">ميكانيكي سيارات</option>
                    <option value="كهربائي وسكانير">كهربائي وسكانير</option>
                    <option value="فني تكييف وتبريد">فني تكييف وتبريد</option>
                    <option value="مساعد ميكانيكي">مساعد ميكانيكي</option>
                    <option value="مسؤول الاستقبال">مسؤول الاستقبال</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">رقم الهاتف</label>
                  <input
                    type="text"
                    placeholder="0550..."
                    value={newWorker.phone}
                    onChange={(e) => setNewWorker({ ...newWorker, phone: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 font-mono text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">تاريخ الالتحاق بالورشة</label>
                <input
                  type="date"
                  value={newWorker.startDate}
                  onChange={(e) => setNewWorker({ ...newWorker, startDate: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 font-mono text-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddWorkerModal(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg cursor-pointer"
                >
                  حفظ العامل
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
