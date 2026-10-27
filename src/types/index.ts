export interface WorkshopInfo {
  entreprise: string;
  subTitle: string;
  rc: string;
  ai: string;
  address: string;
  phone: string;
  email: string;
  bankName: string;
  bankAccount: string;
  tagline: string;
  qrLocationUrl: string;
}

export const WORKSHOP_DEFAULTS: WorkshopInfo = {
  entreprise: 'KraftSchmiede',
  subTitle: 'MÉCANIQUE • ÉLECTRICITÉ • DIAGNOSTIC AUTO',
  rc: '48/00 - 0816637 A 98',
  ai: '197948010023531',
  address: 'cité wafi Relizane - Route belhacel 48000',
  phone: '0557598096',
  email: 'kraftschmied48@hotmail.com',
  bankName: 'BNA (Banque Nationale d\'Algérie)',
  bankAccount: '1234567890',
  tagline: 'Votre satisfaction, notre priorité.',
  qrLocationUrl: 'https://maps.google.com/?q=Relizane+Route+belhacel+Cite+Wafi+Algerie',
};

export type RepairStatus = 'reception' | 'diagnostic' | 'in_progress' | 'ready' | 'invoiced';

export type PaymentMethod = 'cash' | 'virement' | 'cheque' | 'credit';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address?: string;
  notes?: string;
  createdAt: string;
}

export interface ReceptionChecklist {
  carrosserieRaye: boolean;
  roueSecours: boolean;
  cricCle: boolean;
  documentsBord: boolean;
  objetsValeur: boolean;
  temoinAllume: boolean;
}

export interface OBDCode {
  code: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
}

export interface RepairItemPreliminary {
  id: string;
  description: string;
  type: 'part' | 'labor';
  quantity: number;
  stockItemId?: string;
  // Notice: Preliminary OR does NOT show or compute prices!
}

export interface RepairOrder {
  id: string;
  orderNumber: string;
  date: string;
  estimatedDeliveryDate?: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  brand: string;
  model: string;
  year: string;
  matricule: string;
  vin: string;
  mileageKm: number;
  fuelLevel: string;
  customerComplaint: string;
  observations: string;
  status: RepairStatus;
  assignedTechnicianName?: string;
  checklist: ReceptionChecklist;
  // Diagnostics
  obdCodes: OBDCode[];
  mechanicalNotes: string;
  electricalNotes: string;
  // Preliminary items (strictly descriptions & quantities, no money in OR)
  items: InvoiceItem[];
  invoiceId?: string;
  createdAt: string;
}

export interface StockItem {
  id: string;
  ref: string;
  name: string;
  category: string;
  purchasePrice: number;
  salePrice: number;
  quantity: number;
  alertThreshold: number;
  supplier: string;
  lastUpdated: string;
}

export interface StockMovement {
  id: string;
  stockItemId: string;
  stockItemName: string;
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  reason: string;
  date: string;
  relatedInvoiceId?: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  type: 'part' | 'labor';
  quantity: number;
  unitPrice: number;
  total: number;
  stockItemId?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  repairOrderId?: string;
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  vehicleDescription: string;
  vin: string;
  matricule: string;
  mileageKm?: number;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  totalTTC: number;
  amountPaid: number; // Montant Versé
  amountDue: number;  // Reste à Payer (Créance client)
  paymentMethod: PaymentMethod;
  status: 'paid' | 'partial' | 'unpaid';
  bankName: string;
  bankAccount: string;
  notes?: string;
  createdAt: string;
}

export interface PaymentRecord {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  customerName: string;
  date: string;
  amount: number;
  paymentMethod: PaymentMethod;
  notes?: string;
}

// Workers & Manual Wage Logging & Advances (دفتر حسابات العمال والأجر اليدوي)
export interface Worker {
  id: string;
  name: string;
  phone: string;
  role: string; // ميكانيكي، كهربائي، تشخيص، مساعد
  active: boolean;
  notes?: string;
  startDate: string;
}

// سجل عمل وأجر العامل اليدوي (يحدد يدوياً بناءً على العمل والمهام المنجزة)
export interface WorkerWageLog {
  id: string;
  workerId: string;
  workerName: string;
  date: string;
  taskDescription: string; // العمل والمهام المنجزة بالورشة
  wageAmount: number; // الأجر المحدد يدوياً لهذا العمل
  isPaid: boolean; // هل تم دفعه نقداً أم ما زال في حسابه
  paidDate?: string;
  notes?: string;
}

// تسبيقات العمال (Avances)
export interface WorkerAdvance {
  id: string;
  workerId: string;
  workerName: string;
  date: string;
  amount: number;
  reason: string;
  paymentMethod: PaymentMethod;
  notes?: string;
}

// مدفوعات الأجور للعمال (Paiements effectifs)
export interface WorkerPayout {
  id: string;
  workerId: string;
  workerName: string;
  date: string;
  amount: number;
  type: 'wage_payout' | 'advance';
  relatedLogId?: string;
  notes?: string;
}

// Workshop Operational Expenses (مصاريف الورشة التشغيلية)
export interface WorkshopExpense {
  id: string;
  date: string;
  title: string;
  category: 'rent' | 'electricity' | 'tools' | 'meals' | 'supplies' | 'parts_purchase' | 'fuel' | 'other';
  amount: number;
  paymentMethod: PaymentMethod;
  paidTo?: string;
  notes?: string;
}

// حركة مالية موحدة في الصندوق اليومي (Caisse Journalière Mouvements)
export interface CaisseMovement {
  id: string;
  date: string;
  type: 'entree' | 'sortie'; // مدخول (+) أو مصروف (-)
  category: 'facture' | 'creance_client' | 'depot_manuel' | 'depense_atelier' | 'ouvrier_avance' | 'ouvrier_salaire' | 'retrait_proprietaire' | 'autre';
  title: string;
  amount: number;
  paymentMethod: PaymentMethod;
  actor: string; // الزبون أو العامل أو المسؤول
  relatedRef?: string; // رقم الفاتورة أو معرف المصروف
  notes?: string;
}
