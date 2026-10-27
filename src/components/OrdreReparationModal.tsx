import React from 'react';
import { RepairOrder, WorkshopInfo } from '../types';
import { Printer, X, ClipboardCheck, Wrench, ShieldCheck, Car, User } from 'lucide-react';

interface OrdreReparationModalProps {
  order: RepairOrder;
  workshop: WorkshopInfo;
  isOpen: boolean;
  onClose: () => void;
}

export const OrdreReparationModal: React.FC<OrdreReparationModalProps> = ({
  order,
  workshop,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-xl shadow-2xl flex flex-col my-8 text-slate-100 max-h-[92vh]">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 bg-slate-800/80 rounded-t-xl no-print">
          <div className="flex items-center gap-3">
            <ClipboardCheck className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="text-base font-bold text-white">معاينة أمر التشغيل والاستقبال المبدئي (Ordre de Réparation)</h2>
              <p className="text-xs text-slate-400">وثيقة فنية واستقبال رسمية خالية من المبالغ المالية • {order.orderNumber}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-500 shadow-sm transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              طباعة أمر التشغيل (A4)
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Preview Container */}
        <div className="p-6 overflow-y-auto bg-slate-950/60 flex justify-center">
          {/* Printable Document Sheet: Fills 100% of A4 portrait sheet both horizontally & vertically */}
          <div
            id="printable-document"
            dir="ltr"
            className="w-[210mm] min-h-[297mm] print:w-full print:min-w-full print:h-[275mm] print:min-h-[275mm] print:max-h-[278mm] print:p-0 bg-white text-black p-8 font-sans shadow-lg relative flex flex-col justify-between"
            style={{ boxSizing: 'border-box' }}
          >
            {/* UPPER SECTION */}
            <div className="flex-1 flex flex-col justify-start">
              {/* HEADER */}
              <div className="print-avoid-break flex justify-between items-start border-b-2 border-slate-900 pb-3">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-slate-900 text-white font-extrabold flex items-center justify-center rounded-sm text-2xl tracking-tighter">
                    KS
                  </div>
                  <div>
                    <h1 className="text-2xl font-black tracking-wide text-slate-900 uppercase">
                      {workshop.entreprise}
                    </h1>
                    <p className="text-[10px] font-bold text-slate-700 tracking-wider uppercase">
                      {workshop.subTitle}
                    </p>
                    <div className="text-[9px] text-slate-600 mt-0.5 space-x-2">
                      <span>RC: {workshop.rc}</span>
                      <span>•</span>
                      <span>AI: {workshop.ai}</span>
                      <span>•</span>
                      <span>Tél: {workshop.phone}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="bg-slate-800 text-white font-black text-lg px-4 py-1.5 uppercase tracking-wide rounded-sm inline-block">
                    ORDRE DE RÉPARATION
                  </div>
                  <div className="text-xs font-bold text-slate-800 mt-1">
                    N° OR: <span className="font-mono text-sm">{order.orderNumber}</span>
                  </div>
                  <div className="text-[11px] text-slate-600">
                    Date de réception: <span className="font-mono font-bold">{order.date}</span>
                  </div>
                </div>
              </div>

              {/* CUSTOMER & VEHICLE GRID */}
              <div className="print-avoid-break grid grid-cols-2 gap-4 mt-4">
                {/* Customer Box */}
                <div className="border border-slate-300 rounded p-3 bg-slate-50/50 text-xs space-y-1">
                  <h3 className="font-bold text-slate-900 border-b border-slate-200 pb-1 uppercase tracking-wider text-[11px]">
                    1. Informations Client (بيانات الزبون)
                  </h3>
                  <div>
                    <span className="font-bold text-slate-700">Nom & Prénom: </span>
                    <span className="font-bold text-slate-900 uppercase">{order.customerName}</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-700">Téléphone: </span>
                    <span className="font-mono font-bold text-slate-900">{order.customerPhone}</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-700">Adresse: </span>
                    <span className="text-slate-800">{order.customerAddress || 'Relizane'}</span>
                  </div>
                </div>

                {/* Vehicle Box */}
                <div className="border border-slate-300 rounded p-3 bg-slate-50/50 text-xs space-y-1">
                  <h3 className="font-bold text-slate-900 border-b border-slate-200 pb-1 uppercase tracking-wider text-[11px]">
                    2. Fiche Véhicule (مواصفات السيارة)
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="font-bold text-slate-700">Marque / Modèle: </span>
                      <div className="font-bold text-slate-900">{order.brand} {order.model}</div>
                    </div>
                    <div>
                      <span className="font-bold text-slate-700">Année: </span>
                      <div className="font-mono">{order.year || '-'}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200">
                    <div>
                      <span className="font-bold text-slate-700">Immatriculation: </span>
                      <div className="font-mono font-bold text-blue-900">{order.matricule}</div>
                    </div>
                    <div>
                      <span className="font-bold text-slate-700">Kilométrage: </span>
                      <div className="font-mono font-bold">{order.mileageKm.toLocaleString()} km</div>
                    </div>
                  </div>
                  <div className="pt-1">
                    <span className="font-bold text-slate-700">N° Châssis (VIN): </span>
                    <span className="font-mono text-[11px] font-semibold">{order.vin || 'Non renseigné'}</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-700">Niveau Carburant: </span>
                    <span className="font-bold text-slate-900">{order.fuelLevel}</span>
                  </div>
                </div>
              </div>

              {/* COMPLAINTS & INITIAL RECEPTION OBSERVATIONS */}
              <div className="print-avoid-break mt-4 border border-slate-300 rounded p-3 text-xs space-y-2">
                <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                  3. Motif d'entrée & Réclamations du Client (شكوى الزبون والعطل الظاهري)
                </h3>
                <div className="p-2.5 bg-slate-100 rounded border border-slate-200 font-medium text-slate-900 min-h-[46px]">
                  {order.customerComplaint || 'Entretien général et révision mécanique'}
                </div>
                {order.observations && (
                  <div>
                    <span className="font-bold text-slate-700">Remarques réception / État visuel: </span>
                    <span className="text-slate-800">{order.observations}</span>
                  </div>
                )}
              </div>

              {/* INTAKE INVENTORY & CHECKLIST */}
              <div className="print-avoid-break mt-4 border border-slate-300 rounded p-3 text-xs">
                <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-2">
                  4. Contrôle Réception & Inventaire Véhicule (فحص استلام السيارة)
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      readOnly
                      checked={order.checklist?.carrosserieRaye}
                      className="rounded text-slate-900 w-3.5 h-3.5"
                    />
                    <span className="text-slate-800 text-[11px]">Carrosserie rayée / bosselée</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      readOnly
                      checked={order.checklist?.roueSecours}
                      className="rounded text-slate-900 w-3.5 h-3.5"
                    />
                    <span className="text-slate-800 text-[11px]">Roue de secours présente</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      readOnly
                      checked={order.checklist?.cricCle}
                      className="rounded text-slate-900 w-3.5 h-3.5"
                    />
                    <span className="text-slate-800 text-[11px]">Cric & Clé de roue</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      readOnly
                      checked={order.checklist?.documentsBord}
                      className="rounded text-slate-900 w-3.5 h-3.5"
                    />
                    <span className="text-slate-800 text-[11px]">Documents de bord présents</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      readOnly
                      checked={order.checklist?.objetsValeur}
                      className="rounded text-slate-900 w-3.5 h-3.5"
                    />
                    <span className="text-slate-800 text-[11px]">Objets de valeur retirés</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      readOnly
                      checked={order.checklist?.temoinAllume}
                      className="rounded text-slate-900 w-3.5 h-3.5"
                    />
                    <span className="text-slate-800 text-[11px]">Témoin défaut au tableau</span>
                  </div>
                </div>
              </div>

              {/* SECTION 5: PRELIMINARY DIAGNOSTIC AND TECHNICAL WORK LIST (NO MONETARY VALUES) */}
              <div className="print-avoid-break mt-4 border border-slate-300 rounded p-3 text-xs">
                <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-2">
                  5. Travaux Préliminaires & Diagnostic Technique (خطة الفحص والإصلاح المبدئي)
                </h3>
                {order.obdCodes && order.obdCodes.length > 0 && (
                  <div className="mb-2 p-2 bg-slate-50 border border-slate-200 rounded">
                    <span className="font-bold text-slate-800">Codes Défauts OBD détectés: </span>
                    <span className="font-mono text-slate-900 font-bold">
                      {order.obdCodes.map((c) => `${c.code} (${c.description})`).join(' • ')}
                    </span>
                  </div>
                )}
                {order.items && order.items.length > 0 ? (
                  <table className="w-full border-collapse border border-slate-300 text-left mt-1 text-[11px]">
                    <thead>
                      <tr className="bg-slate-100 font-bold text-slate-800">
                        <th className="p-2 border border-slate-300 w-12 text-center">N°</th>
                        <th className="p-2 border border-slate-300">Désignation des Travaux / Pièces à Prévoir</th>
                        <th className="p-2 border border-slate-300 w-24 text-center">Quantité</th>
                        <th className="p-2 border border-slate-300 w-36 text-center">Statut d'exécution</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.items.map((it, idx) => (
                        <tr key={idx} className="h-8">
                          <td className="p-1.5 border border-slate-300 text-center font-mono">{idx + 1}</td>
                          <td className="p-1.5 border border-slate-300 font-bold uppercase text-slate-900">
                            {it.description}
                          </td>
                          <td className="p-1.5 border border-slate-300 text-center font-mono font-bold">
                            {it.quantity}
                          </td>
                          <td className="p-1.5 border border-slate-300 text-center text-slate-600 text-[10px]">
                            À réaliser en atelier
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="text-slate-500 italic p-3 bg-slate-50 rounded border border-dashed border-slate-300">
                    Diagnostic approfondi et contrôle mécanique en cours de réalisation par l'équipe technique...
                  </div>
                )}
              </div>

              {/* TERMS OF REPAIR (شروط الصيانة والاستقبال) */}
              <div className="print-avoid-break mt-3 text-[9px] text-slate-600 leading-tight border-t border-slate-300 pt-2 space-y-0.5">
                <p className="font-bold text-slate-800">Conditions Générales de Prise en Charge:</p>
                <p>1. Le client autorise l'atelier KraftSchmiede à exécuter les diagnostics nécessaires et les essais sur route.</p>
                <p>2. Cette fiche d'ordre de réparation constitue une autorisation de démontage et d'expertise technique (sans engagement financier avant devis/facture).</p>
                <p>3. L'atelier décline toute responsabilité pour les objets de valeur non déclarés laissés dans le véhicule.</p>
                <p>4. La facturation définitive (T.T.C) sera émise à l'achèvement complet des travaux avec la facture officielle.</p>
              </div>
            </div>

            {/* SIGNATURES SECTION: Anchored cleanly to the bottom */}
            <div className="print-avoid-break mt-auto pt-4 border-t-2 border-slate-900 grid grid-cols-2 gap-8 text-xs">
              <div>
                <div className="font-bold text-slate-900 mb-1">
                  Signature du Client (توقيع الزبون بالموافقة على الإيداع):
                </div>
                <p className="text-[10px] text-slate-500 mb-2">Mention manuscrite « Lu et approuvé, bon pour accord »</p>
                <div className="h-20 border border-dashed border-slate-400 rounded p-2"></div>
              </div>

              <div>
                <div className="font-bold text-slate-900 mb-1">
                  Cachet & Réception Atelier (ختم واستلام ورشة KraftSchmiede):
                </div>
                <p className="text-[10px] text-slate-500 mb-2">Responsable d'atelier KraftSchmiede</p>
                <div className="h-20 border border-dashed border-slate-400 rounded p-2 flex items-end justify-center text-[10px] text-slate-500 font-bold uppercase">
                  {workshop.entreprise} Relizane - 0557598096
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
