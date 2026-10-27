import {
  WorkshopInfo,
  WORKSHOP_DEFAULTS,
  Customer,
  RepairOrder,
  StockItem,
  StockMovement,
  Invoice,
  PaymentRecord,
  Worker,
  WorkerWageLog,
  WorkerAdvance,
  WorkshopExpense,
  CaisseMovement,
} from '../types';

export interface AppData {
  workshopInfo: WorkshopInfo;
  customers: Customer[];
  repairOrders: RepairOrder[];
  stockItems: StockItem[]; // Starts empty as per user instructions
  stockMovements: StockMovement[];
  invoices: Invoice[];
  payments: PaymentRecord[];
  workers: Worker[];
  workerWageLogs: WorkerWageLog[];
  workerAdvances: WorkerAdvance[];
  expenses: WorkshopExpense[];
  caisseMovements: CaisseMovement[];
  lastBackupDate?: string;
}

const STORAGE_KEY = 'kraftschmiede_workshop_data_v2';

export const INITIAL_DATA: AppData = {
  workshopInfo: WORKSHOP_DEFAULTS,
  customers: [
    {
      id: 'cust-1',
      name: 'محمد بلقاسم',
      phone: '0661234567',
      address: 'غليزان وسط المدينة',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'cust-2',
      name: 'عبد القادر رحماني',
      phone: '0770987654',
      address: 'وادي ارهيو - غليزان',
      createdAt: new Date().toISOString(),
    },
  ],
  repairOrders: [
    {
      id: 'ro-1',
      orderNumber: 'OR-2026-001',
      date: new Date().toISOString().split('T')[0],
      customerId: 'cust-1',
      customerName: 'محمد بلقاسم',
      customerPhone: '0661234567',
      brand: 'Renault',
      model: 'Clio 4 DCI',
      year: '2019',
      matricule: '01234-119-48',
      vin: 'VF15R040001234567',
      mileageKm: 142000,
      fuelLevel: '50%',
      customerComplaint: 'صوت صرير واهتزاز في دواسة الدبرياج عند الإقلاع (Bruit kit embrayage)',
      observations: 'خدش بسيط على الرفرف الخلفي الأيمن. المحرك سليم.',
      status: 'in_progress',
      assignedTechnicianName: 'فني الميكانيك أمين',
      checklist: {
        carrosserieRaye: true,
        roueSecours: true,
        cricCle: true,
        documentsBord: true,
        objetsValeur: false,
        temoinAllume: false,
      },
      obdCodes: [
        { code: 'P0700', description: 'Transmission Control System Malfunction', severity: 'medium' }
      ],
      mechanicalNotes: 'تآكل قرص الدبرياج، ضرورة استبدال الطقم كاملاً.',
      electricalNotes: 'الضفيرة الكهربائية وحساس السرعة بحالة جيدة.',
      items: [
        {
          id: 'item-1',
          description: 'REPARATION ET MONTAGE KIT D EMBRAYAGE',
          type: 'labor',
          quantity: 1,
          unitPrice: 11000,
          total: 11000,
        }
      ],
      createdAt: new Date().toISOString(),
    }
  ],
  // STRICT REQUIREMENT: Stock starts completely empty (0 items)
  stockItems: [],
  stockMovements: [],
  invoices: [
    {
      id: 'inv-1',
      invoiceNumber: 'FAC-2026-001',
      date: new Date().toISOString().split('T')[0],
      repairOrderId: 'ro-1',
      customerName: 'محمد بلقاسم',
      customerPhone: '0661234567',
      vehicleDescription: 'Renault Clio 4 DCI 2019',
      vin: 'VF15R040001234567',
      matricule: '01234-119-48',
      mileageKm: 142000,
      items: [
        {
          id: 'item-inv-1',
          description: 'REPARATION DU KIT D EMBRAYAGE',
          type: 'labor',
          quantity: 1,
          unitPrice: 11000,
          total: 11000,
        }
      ],
      subtotal: 11000,
      discount: 0,
      totalTTC: 11000,
      amountPaid: 11000,
      amountDue: 0,
      paymentMethod: 'cash',
      status: 'paid',
      bankName: 'BNA',
      bankAccount: '1234567890',
      notes: 'Garantie de montage KraftSchmiede',
      createdAt: new Date().toISOString(),
    }
  ],
  payments: [
    {
      id: 'pay-1',
      invoiceId: 'inv-1',
      invoiceNumber: 'FAC-2026-001',
      customerName: 'محمد بلقاسم',
      date: new Date().toISOString().split('T')[0],
      amount: 11000,
      paymentMethod: 'cash',
      notes: 'تسديد نقدي كامل عند استلام السيارة',
    }
  ],
  workers: [
    {
      id: 'w-1',
      name: 'أمين بلحاج',
      phone: '0551122334',
      role: 'ميكانيكي رئيسي (Mécanicien Chef)',
      active: true,
      startDate: '2025-01-10',
    },
    {
      id: 'w-2',
      name: 'كريم قادري',
      phone: '0559988776',
      role: 'كهربائي وتشخيص إلكتروني (Électricien & Scanner)',
      active: true,
      startDate: '2025-02-01',
    },
    {
      id: 'w-3',
      name: 'بلال مسعودي',
      phone: '0772233445',
      role: 'مساعد ورشة (Aide Mécanicien)',
      active: true,
      startDate: '2025-03-15',
    }
  ],
  workerWageLogs: [
    {
      id: 'ww-1',
      workerId: 'w-1',
      workerName: 'أمين بلحاج',
      date: new Date().toISOString().split('T')[0],
      taskDescription: 'تغيير طقم دبرياج كليو 4 + فحص نظام التوجيه',
      wageAmount: 3500,
      isPaid: false,
    },
    {
      id: 'ww-2',
      workerId: 'w-2',
      workerName: 'كريم قادري',
      date: new Date().toISOString().split('T')[0],
      taskDescription: 'فحص سكانير وبرمجة حساس عادم',
      wageAmount: 3000,
      isPaid: false,
    }
  ],
  workerAdvances: [
    {
      id: 'adv-1',
      workerId: 'w-1',
      workerName: 'أمين بلحاج',
      date: new Date().toISOString().split('T')[0],
      amount: 1500,
      reason: 'تسبيقة نقود لمصاريف شخصية',
      paymentMethod: 'cash',
    }
  ],
  expenses: [
    {
      id: 'exp-1',
      date: new Date().toISOString().split('T')[0],
      title: 'شراء منظف فرامل وWD40 للورشة',
      category: 'supplies',
      amount: 2400,
      paymentMethod: 'cash',
      paidTo: 'محل بيع المواد الصناعية غليزان',
    }
  ],
  caisseMovements: [
    {
      id: 'cm-1',
      date: new Date().toISOString().split('T')[0],
      type: 'entree',
      category: 'depot_manuel',
      title: 'رصيد افتتاحي لصندوق الڨراج (Fond de caisse initial)',
      amount: 20000,
      paymentMethod: 'cash',
      actor: 'صاحب الورشة',
    },
    {
      id: 'cm-2',
      date: new Date().toISOString().split('T')[0],
      type: 'entree',
      category: 'facture',
      title: 'قبض فاتورة FAC-2026-001 (محمد بلقاسم)',
      amount: 11000,
      paymentMethod: 'cash',
      actor: 'محمد بلقاسم',
      relatedRef: 'FAC-2026-001',
    },
    {
      id: 'cm-3',
      date: new Date().toISOString().split('T')[0],
      type: 'sortie',
      category: 'depense_atelier',
      title: 'مصروف ورشة: شراء منظف فرامل وWD40',
      amount: 2400,
      paymentMethod: 'cash',
      actor: 'محل بيع المواد الصناعية',
    },
    {
      id: 'cm-4',
      date: new Date().toISOString().split('T')[0],
      type: 'sortie',
      category: 'ouvrier_avance',
      title: 'تسبيقة نقدية للعامل: أمين بلحاج',
      amount: 1500,
      paymentMethod: 'cash',
      actor: 'أمين بلحاج',
    }
  ],
};

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      saveData(INITIAL_DATA);
      return INITIAL_DATA;
    }
    const parsed = JSON.parse(raw);
    return {
      ...INITIAL_DATA,
      ...parsed,
      workshopInfo: {
        ...WORKSHOP_DEFAULTS,
        ...(parsed.workshopInfo || {}),
      },
      customers: Array.isArray(parsed.customers) ? parsed.customers : [],
      repairOrders: Array.isArray(parsed.repairOrders) ? parsed.repairOrders : [],
      stockItems: Array.isArray(parsed.stockItems) ? parsed.stockItems : [],
      stockMovements: Array.isArray(parsed.stockMovements) ? parsed.stockMovements : [],
      invoices: Array.isArray(parsed.invoices) ? parsed.invoices : [],
      payments: Array.isArray(parsed.payments) ? parsed.payments : [],
      workers: Array.isArray(parsed.workers) ? parsed.workers : [],
      workerWageLogs: Array.isArray(parsed.workerWageLogs) ? parsed.workerWageLogs : [],
      workerAdvances: Array.isArray(parsed.workerAdvances) ? parsed.workerAdvances : [],
      expenses: Array.isArray(parsed.expenses) ? parsed.expenses : [],
      caisseMovements: Array.isArray(parsed.caisseMovements) ? parsed.caisseMovements : [],
    };
  } catch (err) {
    console.error('Failed to load data from localStorage', err);
    return INITIAL_DATA;
  }
}

export function saveData(data: AppData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to save data to localStorage', err);
  }
}

export function exportBackup(data: AppData): void {
  const exportPayload = {
    ...data,
    lastBackupDate: new Date().toISOString(),
    app: 'KraftSchmiede Auto System',
    version: '2.0.0',
  };
  const jsonStr = JSON.stringify(exportPayload, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const dateStr = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `kraftschmiede_backup_${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function parseAndValidateBackup(jsonString: string): AppData {
  const parsed = JSON.parse(jsonString);
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('الملف ليس بصيغة JSON صحيحة');
  }
  return {
    ...INITIAL_DATA,
    ...parsed,
    workshopInfo: {
      ...WORKSHOP_DEFAULTS,
      ...(parsed.workshopInfo || {}),
    },
    customers: Array.isArray(parsed.customers) ? parsed.customers : [],
    repairOrders: Array.isArray(parsed.repairOrders) ? parsed.repairOrders : [],
    stockItems: Array.isArray(parsed.stockItems) ? parsed.stockItems : [],
    stockMovements: Array.isArray(parsed.stockMovements) ? parsed.stockMovements : [],
    invoices: Array.isArray(parsed.invoices) ? parsed.invoices : [],
    payments: Array.isArray(parsed.payments) ? parsed.payments : [],
    workers: Array.isArray(parsed.workers) ? parsed.workers : [],
    workerWageLogs: Array.isArray(parsed.workerWageLogs) ? parsed.workerWageLogs : [],
    workerAdvances: Array.isArray(parsed.workerAdvances) ? parsed.workerAdvances : [],
    expenses: Array.isArray(parsed.expenses) ? parsed.expenses : [],
    caisseMovements: Array.isArray(parsed.caisseMovements) ? parsed.caisseMovements : [],
  };
}

/**
 * Creates completely empty production dataset with 0 demo operations,
 * keeping the official KraftSchmiede enterprise identity.
 */
export function getCleanProductionData(workshopInfo: WorkshopInfo = WORKSHOP_DEFAULTS): AppData {
  return {
    workshopInfo,
    customers: [],
    repairOrders: [],
    stockItems: [],
    stockMovements: [],
    invoices: [],
    payments: [],
    workers: [],
    workerWageLogs: [],
    workerAdvances: [],
    expenses: [],
    caisseMovements: [],
    lastBackupDate: new Date().toISOString(),
  };
}

/**
 * Clears database in LocalStorage and returns pristine clean production state
 */
export function clearDatabaseToProduction(currentWorkshop?: WorkshopInfo): AppData {
  const clean = getCleanProductionData(currentWorkshop || WORKSHOP_DEFAULTS);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clean));
  } catch (err) {
    console.error('Failed to clear database in localStorage', err);
  }
  return clean;
}

