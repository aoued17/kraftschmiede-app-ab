import React, { useState } from 'react';
import { StockItem, StockMovement } from '../types';
import { formatDZD } from '../utils/numberToWords';
import {
  Package,
  Plus,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  Search,
  Filter,
  CheckCircle,
  Truck,
  Trash2,
  Edit2,
  History,
} from 'lucide-react';

interface InventoryManagementProps {
  stockItems: StockItem[];
  movements: StockMovement[];
  onAddStockItem: (item: Omit<StockItem, 'id' | 'lastUpdated'>) => void;
  onUpdateStockItem: (item: StockItem) => void;
  onDeleteStockItem: (id: string) => void;
  onRestock: (stockItemId: string, addedQuantity: number, supplierName: string, costPrice: number) => void;
}

export const InventoryManagement: React.FC<InventoryManagementProps> = ({
  stockItems,
  movements,
  onAddStockItem,
  onUpdateStockItem,
  onDeleteStockItem,
  onRestock,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [selectedItemForRestock, setSelectedItemForRestock] = useState<StockItem | null>(null);
  const [showMovementsModal, setShowMovementsModal] = useState(false);

  // Forms
  const [newItem, setNewItem] = useState({
    ref: '',
    name: '',
    category: 'فرامل (Freinage)',
    purchasePrice: 0,
    salePrice: 0,
    quantity: 0,
    alertThreshold: 2,
    supplier: '',
  });

  const [restockForm, setRestockForm] = useState({
    quantity: 1,
    costPrice: 0,
    supplier: '',
  });

  const categories = [
    'فرامل (Freinage)',
    'طقم دبرياج وناقل حركة (Embrayage & Transmission)',
    'زيوت وفلاتر (Filtres & Lubrifiants)',
    'نظام التعليق والتوجيه (Suspension & Direction)',
    'محرك وسير توزيع (Moteur & Distribution)',
    'كهرباء وإشعال وشمعات (Électricité & Allumage)',
    'نظام التبريد والردياتير (Refroidissement)',
    'قطع أخرى',
  ];

  // Filtering
  const filteredItems = stockItems.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.ref.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.supplier && item.supplier.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory =
      selectedCategory === 'all' || item.category === selectedCategory;

    const matchesLowStock = !showLowStockOnly || item.quantity <= item.alertThreshold;

    return matchesSearch && matchesCategory && matchesLowStock;
  });

  const lowStockCount = stockItems.filter((it) => it.quantity <= it.alertThreshold).length;
  const totalStockValue = stockItems.reduce((acc, it) => acc + it.quantity * it.purchasePrice, 0);
  const totalStockSaleValue = stockItems.reduce((acc, it) => acc + it.quantity * it.salePrice, 0);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.name.trim() || !newItem.ref.trim()) return;

    onAddStockItem({
      ref: newItem.ref.toUpperCase().trim(),
      name: newItem.name.trim(),
      category: newItem.category,
      purchasePrice: Number(newItem.purchasePrice),
      salePrice: Number(newItem.salePrice),
      quantity: Number(newItem.quantity),
      alertThreshold: Number(newItem.alertThreshold),
      supplier: newItem.supplier.trim() || 'مورد محلي غليزان',
    });

    setNewItem({
      ref: '',
      name: '',
      category: 'فرامل (Freinage)',
      purchasePrice: 0,
      salePrice: 0,
      quantity: 0,
      alertThreshold: 2,
      supplier: '',
    });
    setShowAddModal(false);
  };

  const handleRestockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemForRestock || restockForm.quantity <= 0) return;

    onRestock(
      selectedItemForRestock.id,
      Number(restockForm.quantity),
      restockForm.supplier || selectedItemForRestock.supplier,
      Number(restockForm.costPrice) || selectedItemForRestock.purchasePrice
    );

    setShowRestockModal(false);
    setSelectedItemForRestock(null);
  };

  return (
    <div className="space-y-6">
      {/* HEADER & QUICK ACTIONS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-800/80 p-5 rounded-xl border border-slate-700/80">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Package className="w-6 h-6 text-blue-400" />
            مخزون قطع الغيار والمستهلكات (Gestion de Stock)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            إدخال وتتبع القطع، التنبيه بالنقص، والخصم التلقائي عند اعتماد الفواتير.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowMovementsModal(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-300 bg-slate-700/60 hover:bg-slate-700 border border-slate-600 rounded-lg transition-colors cursor-pointer"
          >
            <History className="w-4 h-4 text-slate-300" />
            سجل حركات المخزون ({movements.length})
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            إضافة قطعة جديدة
          </button>
        </div>
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-slate-700/80 bg-slate-800/60 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400">إجمالي أصناف المخزون</span>
            <div className="text-2xl font-bold font-mono text-white mt-1">
              {stockItems.length} صنف
            </div>
          </div>
          <div className="p-3 bg-blue-500/10 text-blue-400 rounded-lg">
            <Package className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-700/80 bg-slate-800/60 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400">قيمة المخزون (سعر الشراء)</span>
            <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
              {formatDZD(totalStockValue)}
            </div>
            <span className="text-[10px] text-slate-500">القيمة بالبيع: {formatDZD(totalStockSaleValue)}</span>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-lg">
            <ArrowDownLeft className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-700/80 bg-slate-800/60 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400">قطع شارفت على النفاد</span>
            <div className={`text-2xl font-bold font-mono mt-1 ${lowStockCount > 0 ? 'text-amber-400' : 'text-slate-300'}`}>
              {lowStockCount} صنف
            </div>
            {lowStockCount > 0 && (
              <span className="text-[10px] text-amber-500 font-semibold">تحت حد التنبيه</span>
            )}
          </div>
          <div className={`p-3 rounded-lg ${lowStockCount > 0 ? 'bg-amber-500/10 text-amber-400' : 'bg-slate-700 text-slate-400'}`}>
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-slate-800/50 p-3 rounded-xl border border-slate-700/60 text-xs">
        <div className="flex items-center gap-2 flex-1 max-w-md bg-slate-900 border border-slate-700 rounded-lg px-3 py-2">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="البحث بالاسم، المرجع (Réf)، أو المورد..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-white focus:outline-none placeholder:text-slate-500 text-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-xs focus:outline-none focus:border-blue-500"
          >
            <option value="all">كل التصنيفات</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <button
            onClick={() => setShowLowStockOnly(!showLowStockOnly)}
            className={`px-3 py-2 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
              showLowStockOnly
                ? 'bg-amber-500/20 border-amber-600 text-amber-300'
                : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
            }`}
          >
            النواقص فقط ({lowStockCount})
          </button>
        </div>
      </div>

      {/* STOCK ITEMS TABLE */}
      <div className="bg-slate-800/80 rounded-xl border border-slate-700/80 overflow-hidden">
        {filteredItems.length === 0 ? (
          <div className="text-center py-16 px-4">
            <Package className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-white mb-1">
              {stockItems.length === 0 ? 'المخزون فارغ تماماً (0 قطع)' : 'لا توجد نتائج مطابقة للبحث'}
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mb-4">
              {stockItems.length === 0
                ? 'يبدأ المخزون فارغاً كما طلبت تماماً. يمكنك الآن البدء في إضافة قطع الغيار يدوياً وبناء رصيد الورشة تدريجياً.'
                : 'جرّب تغيير كلمات البحث أو إلغاء التصفية لإظهار كافة القطع.'}
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              إضافة أول قطعة للمخزن
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right">
              <thead>
                <tr className="bg-slate-900/60 border-b border-slate-700 text-slate-400 font-medium">
                  <th className="py-3 px-4">المرجع (Réf)</th>
                  <th className="py-3 px-4">تسمية القطعة</th>
                  <th className="py-3 px-4">التصنيف</th>
                  <th className="py-3 px-4">سعر الشراء</th>
                  <th className="py-3 px-4">سعر البيع للزبون</th>
                  <th className="py-3 px-4 text-center">الكمية المتوفرة</th>
                  <th className="py-3 px-4">المورد</th>
                  <th className="py-3 px-4 text-left">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60 font-medium">
                {filteredItems.map((item) => {
                  const isLow = item.quantity <= item.alertThreshold;
                  return (
                    <tr key={item.id} className="hover:bg-slate-700/30 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-blue-400">
                        {item.ref}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-white">{item.name}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        <span className="px-2 py-0.5 rounded bg-slate-700 text-slate-300 text-[10px]">
                          {item.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-400">
                        {item.purchasePrice.toLocaleString()} دج
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                        {item.salePrice.toLocaleString()} دج
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded font-mono font-bold text-xs ${
                            item.quantity === 0
                              ? 'bg-rose-950 text-rose-400 border border-rose-800'
                              : isLow
                              ? 'bg-amber-950 text-amber-400 border border-amber-800'
                              : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          }`}
                        >
                          {item.quantity}
                          {isLow && <AlertTriangle className="w-3 h-3 ml-0.5" />}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400">{item.supplier || '-'}</td>
                      <td className="py-3 px-4 text-left">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedItemForRestock(item);
                              setRestockForm({
                                quantity: 1,
                                costPrice: item.purchasePrice,
                                supplier: item.supplier,
                              });
                              setShowRestockModal(true);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-emerald-300 bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 rounded cursor-pointer"
                            title="إضافة شحنة جديدة"
                          >
                            <Truck className="w-3.5 h-3.5" />
                            توريد
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`هل أنت متأكد من حذف القطعة: ${item.name}؟`)) {
                                onDeleteStockItem(item.id);
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-rose-400 cursor-pointer"
                            title="حذف"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: ADD NEW STOCK ITEM */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-lg w-full p-6 text-slate-100 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-4">إدخال قطعة غيار جديدة إلى المخزون</h3>
            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">مرجع القطعة (Réf / SKU) *</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: BRK-CLIO4-01"
                    value={newItem.ref}
                    onChange={(e) => setNewItem({ ...newItem, ref: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 font-mono text-white focus:outline-none focus:border-blue-500 uppercase"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">التصنيف</label>
                  <select
                    value={newItem.category}
                    onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">اسم وتسمية القطعة *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: طقم صفائح فرامل أمامية رونو كليو 4 (Plaquettes de frein)"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">سعر الشراء (دج) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="50"
                    value={newItem.purchasePrice}
                    onChange={(e) => setNewItem({ ...newItem, purchasePrice: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 font-mono text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">سعر البيع للزبون (دج) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="50"
                    value={newItem.salePrice}
                    onChange={(e) => setNewItem({ ...newItem, salePrice: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 font-mono text-emerald-400 font-bold focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">الكمية الأولية المتوفرة</label>
                  <input
                    type="number"
                    min="0"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem({ ...newItem, quantity: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 font-mono text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">حد التنبيه للنقص</label>
                  <input
                    type="number"
                    min="1"
                    value={newItem.alertThreshold}
                    onChange={(e) => setNewItem({ ...newItem, alertThreshold: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 font-mono text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">المورد الرئيسي (Fournisseur)</label>
                <input
                  type="text"
                  placeholder="مثال: موزع قطع غيار غليزان / وهران"
                  value={newItem.supplier}
                  onChange={(e) => setNewItem({ ...newItem, supplier: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg cursor-pointer"
                >
                  حفظ القطعة بالمخزن
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RESTOCK SHIPMENT */}
      {showRestockModal && selectedItemForRestock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-md w-full p-6 text-slate-100 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-2">توريد شحنة جديدة للقطعة</h3>
            <p className="text-xs text-blue-400 font-bold mb-4">
              {selectedItemForRestock.name} ({selectedItemForRestock.ref})
            </p>

            <form onSubmit={handleRestockSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">الكمية المضافة *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={restockForm.quantity}
                    onChange={(e) => setRestockForm({ ...restockForm, quantity: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 font-mono text-emerald-400 font-bold focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">سعر الشراء الحالي (دج)</label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={restockForm.costPrice}
                    onChange={(e) => setRestockForm({ ...restockForm, costPrice: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 font-mono text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">المورد</label>
                <input
                  type="text"
                  value={restockForm.supplier}
                  onChange={(e) => setRestockForm({ ...restockForm, supplier: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="p-2.5 bg-slate-800/80 rounded border border-slate-700 text-slate-400 text-[11px]">
                الرصيد الحالي: {selectedItemForRestock.quantity} قطعة ← سيصبح بعد التوريد: {selectedItemForRestock.quantity + restockForm.quantity} قطعة.
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowRestockModal(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg cursor-pointer"
                >
                  تأكيد التوريد
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: MOVEMENTS HISTORY */}
      {showMovementsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-2xl w-full p-6 text-slate-100 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <History className="w-5 h-5 text-blue-400" />
                سجل حركات المخزون (Entrées / Sorties de stock)
              </h3>
              <button
                onClick={() => setShowMovementsModal(false)}
                className="text-slate-400 hover:text-white text-xs cursor-pointer"
              >
                إغلاق
              </button>
            </div>

            <div className="overflow-y-auto flex-1 text-xs">
              {movements.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  لا توجد حركات مخزون مسجلة حتى الآن.
                </div>
              ) : (
                <table className="w-full text-right">
                  <thead>
                    <tr className="border-b border-slate-700 text-slate-400">
                      <th className="py-2 px-3">التاريخ</th>
                      <th className="py-2 px-3">القطعة</th>
                      <th className="py-2 px-3">النوع</th>
                      <th className="py-2 px-3">الكمية</th>
                      <th className="py-2 px-3">البيان</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/60 font-medium">
                    {movements.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-800/40">
                        <td className="py-2.5 px-3 font-mono text-slate-400">{m.date}</td>
                        <td className="py-2.5 px-3 font-bold text-white">{m.stockItemName}</td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] ${
                              m.type === 'in'
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                : 'bg-rose-950 text-rose-300 border border-rose-800'
                            }`}
                          >
                            {m.type === 'in' ? 'توريد (+)' : 'خصم فاتورة (-)'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-white">
                          {m.type === 'in' ? '+' : '-'}{m.quantity}
                        </td>
                        <td className="py-2.5 px-3 text-slate-300">{m.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
