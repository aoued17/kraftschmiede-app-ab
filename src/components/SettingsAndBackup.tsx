import React, { useState, useRef } from 'react';
import { WorkshopInfo } from '../types';
import {
  Settings,
  Download,
  Upload,
  RotateCcw,
  Save,
  CheckCircle,
  AlertTriangle,
  Building2,
  Trash2,
  ShieldAlert,
  X,
  Sparkles,
} from 'lucide-react';

interface SettingsAndBackupProps {
  workshop: WorkshopInfo;
  onUpdateWorkshop: (info: WorkshopInfo) => void;
  onExportBackup: () => void;
  onImportBackup: (file: File) => void;
  onResetData: () => void; // Reset to demo sample data
  onClearToProduction: (backupFirst: boolean) => void; // Clean wipe to 0 records
}

export const SettingsAndBackup: React.FC<SettingsAndBackupProps> = ({
  workshop,
  onUpdateWorkshop,
  onExportBackup,
  onImportBackup,
  onResetData,
  onClearToProduction,
}) => {
  const [formData, setFormData] = useState<WorkshopInfo>(workshop);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Security Clear Database Modal state
  const [showClearModal, setShowClearModal] = useState(false);
  const [backupFirst, setBackupFirst] = useState(true);
  const [confirmationInput, setConfirmationInput] = useState('');
  const [clearError, setClearError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateWorkshop(formData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (confirm('تنبيه: سيؤدي استرجاع النسخة الاحتياطية إلى استبدال البيانات الحالية بالبيانات المحفوظة في الملف. هل تود المتابعة؟')) {
        onImportBackup(file);
      }
    }
  };

  const handleConfirmClear = () => {
    const cleaned = confirmationInput.trim().toLowerCase();
    if (cleaned !== 'تأكيد' && cleaned !== 'confirm' && cleaned !== 'مسح') {
      setClearError('يرجى كتابة كلمة "تأكيد" للمتابعة وتصفير البيانات بأمان.');
      return;
    }

    onClearToProduction(backupFirst);
    setShowClearModal(false);
    setConfirmationInput('');
    setClearError('');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* SECTION HEADER */}
      <div className="bg-slate-800/80 p-5 rounded-xl border border-slate-700/80">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Settings className="w-6 h-6 text-blue-400" />
          إعدادات ورشة KraftSchmiede والنسخ الاحتياطي المحلي
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          تعديل البيانات الرسمية التي تظهر في ترويسة الفواتير وأمر الشغل، وحفظ واسترجاع قاعدة البيانات محلياً، وتصفير البيانات التجريبية للبدء الفعلي.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT 2 COLS: WORKSHOP OFFICIAL DATA FORM */}
        <div className="lg:col-span-2 bg-slate-800/80 rounded-xl border border-slate-700/80 p-6">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-700">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-400" />
              البيانات الإدارية والتجارية الثابتة
            </h3>
            {saveSuccess && (
              <span className="text-xs text-emerald-400 flex items-center gap-1 font-semibold">
                <CheckCircle className="w-4 h-4" /> تم الحفظ بنجاح
              </span>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">اسم المؤسسة / الورشة (Entreprise)</label>
                <input
                  type="text"
                  required
                  value={formData.entreprise}
                  onChange={(e) => setFormData({ ...formData, entreprise: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white font-bold focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">الشعار الفرعي (Sous-titre)</label>
                <input
                  type="text"
                  value={formData.subTitle}
                  onChange={(e) => setFormData({ ...formData, subTitle: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">السجل التجاري (RC)</label>
                <input
                  type="text"
                  required
                  value={formData.rc}
                  onChange={(e) => setFormData({ ...formData, rc: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 font-mono text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">رقم التعريف الإحصائي (AI)</label>
                <input
                  type="text"
                  required
                  value={formData.ai}
                  onChange={(e) => setFormData({ ...formData, ai: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 font-mono text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 mb-1 font-semibold">العنوان الكامل للورشة (Adresse)</label>
              <input
                type="text"
                required
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">رقم الهاتف (Téléphone)</label>
                <input
                  type="text"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 font-mono text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">البريد الإلكتروني (Email)</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-700">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">اسم البنك (Mode de paiement)</label>
                <input
                  type="text"
                  value={formData.bankName}
                  onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">رقم الحساب البنكي (Numéro de compte)</label>
                <input
                  type="text"
                  value={formData.bankAccount}
                  onChange={(e) => setFormData({ ...formData, bankAccount: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 font-mono text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 mb-1 font-semibold">رابط خرائط جوجل لـ QR Code (Google Maps Location URL)</label>
              <input
                type="text"
                value={formData.qrLocationUrl}
                onChange={(e) => setFormData({ ...formData, qrLocationUrl: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 font-mono text-xs text-blue-300 focus:outline-none focus:border-blue-500"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                هذا الرابط يولد رمز الـ QR التفاعلي المطبوع أسفل الفاتورة ليوجه الزبون مباشرة إلى موقع الورشة في غليزان.
              </span>
            </div>

            <div className="flex justify-end pt-3">
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg shadow-sm cursor-pointer transition-colors"
              >
                <Save className="w-4 h-4" />
                حفظ التغييرات
              </button>
            </div>
          </form>
        </div>

        {/* RIGHT 1 COL: OFFLINE BACKUP, RESTORE & PRODUCTION RESET */}
        <div className="space-y-6">
          {/* Production Reset Card (Feature Requested by User) */}
          <div className="bg-gradient-to-br from-rose-950/60 to-slate-900 rounded-xl border border-rose-600/50 p-5 space-y-3 shadow-lg">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
              <Trash2 className="w-4 h-4 text-rose-400" />
              <span>تصفير البيانات التجريبية (العمل الحقيقي)</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              مسح كافة الأرقام، أوامر التشغيل (OR)، الفواتير، بيانات الصندوق، وحركات العمال التجريبية، ليعود البرنامج نظيفاً وجاهزاً للعمل الفعلي في الورشة من الصفر.
            </p>
            <button
              onClick={() => {
                setShowClearModal(true);
                setClearError('');
                setConfirmationInput('');
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg shadow-sm text-xs cursor-pointer transition-all hover:shadow-rose-600/30"
            >
              <Trash2 className="w-4 h-4" />
              تصفير كافة البيانات والبدء بالعمل الحقيقي
            </button>
          </div>

          {/* Backup Box */}
          <div className="bg-slate-800/80 rounded-xl border border-slate-700/80 p-5 space-y-4">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Download className="w-4 h-4 text-blue-400" />
              النسخ الاحتياطي المحلي (Offline Backup)
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              تخزين بياناتك يتم تلقائياً على متصفح الحاسوب. ننصحك بتحميل نسخة احتياطية دورية للاحتفاظ بها على فلاش ديسك أو نقلها لحاسوب آخر.
            </p>

            <button
              onClick={onExportBackup}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg shadow-sm text-xs cursor-pointer transition-colors"
            >
              <Download className="w-4 h-4" />
              تصدير نسخة احتياطية (ملف JSON)
            </button>
          </div>

          {/* Restore Box */}
          <div className="bg-slate-800/80 rounded-xl border border-slate-700/80 p-5 space-y-4">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Upload className="w-4 h-4 text-purple-400" />
              استرجاع من ملف نسخة احتياطية
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              يمكنك استعادة بيانات الورشة كاملة (الفواتير، العمال، المخزون، أوامر الشغل) من أي ملف تم تصديره سابقاً.
            </p>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json"
              className="hidden"
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg text-xs cursor-pointer transition-colors border border-slate-600"
            >
              <Upload className="w-4 h-4" />
              اختيار ملف واسترجاع البيانات
            </button>
          </div>

          {/* Demo Reset Box */}
          <div className="bg-slate-800/80 rounded-xl border border-slate-700 p-4 space-y-2">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs font-semibold">
              <RotateCcw className="w-3.5 h-3.5" />
              <span>إعادة تحميل البيانات التجريبية (Demo Mode)</span>
            </div>
            <p className="text-[11px] text-slate-500">
              في حال رغبت بتجربة النظام مجدداً مع عينات فواتير وأوامر شغل جاهزة.
            </p>
            <button
              onClick={onResetData}
              className="w-full text-center py-1.5 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-700/60 rounded border border-slate-700 transition-colors"
            >
              تحميل نموذج بيانات تجريبية
            </button>
          </div>
        </div>
      </div>

      {/* SECURITY CONFIRMATION MODAL (تأكيد أمني قبل الحذف والتصفير) */}
      {showClearModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="relative w-full max-w-lg bg-slate-900 border border-rose-600/70 rounded-2xl shadow-2xl p-6 text-slate-100 space-y-5">
            {/* Modal Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    تأكيد تصفير قاعدة البيانات (العمل الحقيقي)
                  </h3>
                  <p className="text-xs text-rose-300 font-medium">
                    إجراء أمني نهائي لتجهيز ورشة KraftSchmiede
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowClearModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Explanatory List of Cleared Items */}
            <div className="bg-slate-950/80 rounded-xl p-4 border border-slate-800 space-y-2 text-xs text-slate-300">
              <p className="font-bold text-white">سيتم تنفيذ الآتي فوراً:</p>
              <ul className="space-y-1.5 list-disc list-inside text-slate-300">
                <li><span className="text-rose-300 font-semibold">حذف كافة أوامر الشغل (OR)</span> التجريبية والمسودات.</li>
                <li><span className="text-rose-300 font-semibold">مسح كافة الفواتير الرسمية A4</span> وسجلات ديون الزبائن.</li>
                <li><span className="text-rose-300 font-semibold">تصفير الصندوق اليومي</span> والخزينة ليصبح الرصيد 0.00 دج.</li>
                <li><span className="text-rose-300 font-semibold">تصفير مخزون قطع الغيار</span> ليبدأ فارغاً تماماً (0 قطع).</li>
                <li><span className="text-rose-300 font-semibold">مسح سجلات ويوميات وتسبيقات العمال</span> التجريبية.</li>
                <li><span className="text-emerald-300 font-semibold">الحفاظ الكامل على بيانات الورشة الرسمية</span> (RC, AI, العنوان, الهاتف, QR).</li>
              </ul>
            </div>

            {/* Auto-Backup Checkbox */}
            <label className="flex items-center gap-3 p-3 bg-emerald-950/40 border border-emerald-600/40 rounded-xl cursor-pointer">
              <input
                type="checkbox"
                checked={backupFirst}
                onChange={(e) => setBackupFirst(e.target.checked)}
                className="w-4 h-4 text-emerald-500 rounded focus:ring-0 cursor-pointer"
              />
              <div className="text-xs">
                <span className="font-bold text-emerald-300 block">
                  تنزيل نسخة احتياطية تلقائياً قبل المسح (موصى به جداً)
                </span>
                <span className="text-[11px] text-slate-400">
                  لحماية بياناتك، سيتم حفظ ملف نسخة احتياطية على جهازك تلقائياً قبل التصفير.
                </span>
              </div>
            </label>

            {/* Confirmation Word Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                للتأكيد، اكتب كلمة <span className="text-rose-400 font-mono font-bold">تأكيد</span> في المربع أدناه:
              </label>
              <input
                type="text"
                value={confirmationInput}
                onChange={(e) => {
                  setConfirmationInput(e.target.value);
                  setClearError('');
                }}
                placeholder="اكتب كلمة: تأكيد"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-center text-sm font-bold text-white focus:outline-none focus:border-rose-500"
              />
              {clearError && (
                <p className="text-xs text-rose-400 font-semibold text-center">{clearError}</p>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowClearModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-lg text-xs transition-colors cursor-pointer"
              >
                إلغاء والتراجع
              </button>
              <button
                type="button"
                onClick={handleConfirmClear}
                className="inline-flex items-center gap-2 px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg text-xs transition-all shadow-md hover:shadow-rose-600/40 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                تأكيد التصفير النهائي وقفل البيانات
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
