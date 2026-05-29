"use client";

import React, { useState } from "react";
import { Plus, Ship, FileCheck, CheckCircle2, AlertCircle, Calendar, ArrowRight, Loader2 } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import { useTheme } from "@/lib/ThemeContext";

interface ShipmentTrackerProps {
  shipments: any[];
  onAddShipment: (body: Record<string, string>) => Promise<void>;
  onToggleDocument: (shipmentId: string, docType: string) => Promise<void>;
}

const PORT_OPTIONS = [
  "Tanjung Priok, Jakarta",
  "Tanjung Perak, Surabaya",
  "Belawan, Medan",
  "Soekarno-Hatta, Makassar"
];

export function ShipmentTracker({ shipments, onAddShipment, onToggleDocument }: ShipmentTrackerProps) {
  const { t, language, isRtl } = useLanguage();
  const { theme } = useTheme();
  const [showAddForm, setShowAddForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ containerNumber: "", shippingLine: "Maersk", commodity: "Nutmeg", etd: "", eta: "", portOrigin: "Tanjung Priok, Jakarta", portDestination: "", buyerName: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.containerNumber || !form.portDestination) return;
    setSubmitting(true);
    await onAddShipment(form);
    setSubmitting(false);
    setShowAddForm(false);
    setForm({ containerNumber: "", shippingLine: "Maersk", commodity: "Nutmeg", etd: "", eta: "", portOrigin: "Tanjung Priok, Jakarta", portDestination: "", buyerName: "" });
  };

  const getDocName = (type: string) => {
    if (type.toLowerCase().includes("lading")) return t("shipments", "bl");
    if (type.toLowerCase().includes("origin")) return t("shipments", "coo");
    if (type.toLowerCase().includes("invoice")) return t("shipments", "ci");
    if (type.toLowerCase().includes("list")) return t("shipments", "pl");
    return type;
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-800 dark:text-slate-100">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">{t("common", "shipments")}</h2>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">{t("shipments", "subtitle")}</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-5 py-3 bg-indigo-600 dark:bg-indigo-600 hover:bg-indigo-700 dark:hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer transition-colors uppercase tracking-wider"
        >
          <Plus className="w-4 h-4" />
          {showAddForm ? t("common", "close") : t("shipments", "addShipment")}
        </button>
      </div>

      {/* Slide-out Add form panel */}
      {showAddForm && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-150 dark:border-slate-800 card-shadow space-y-4 animate-scale-up">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">{t("shipments", "addModalTitle")}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">{t("shipments", "containerNo")}</label>
              <input required placeholder="e.g. MSKU4723920" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-800" value={form.containerNumber} onChange={(e) => setForm({ ...form, containerNumber: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">{t("shipments", "vessel")}</label>
              <select className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-800 focus:outline-none cursor-pointer text-slate-800 dark:text-slate-200" value={form.shippingLine} onChange={(e) => setForm({ ...form, shippingLine: e.target.value })}>
                {["Maersk", "Evergreen", "OOCL", "Hapag-Lloyd", "MSC", "CMA CGM"].map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">{language === "en" ? "Product" : "Produk"}</label>
              <input required placeholder="e.g. Nutmeg / Cloves" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-800" value={form.commodity} onChange={(e) => setForm({ ...form, commodity: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">{language === "en" ? "Port of Origin" : "Pelabuhan Asal"}</label>
              <select className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-800 focus:outline-none cursor-pointer text-slate-800 dark:text-slate-200" value={form.portOrigin} onChange={(e) => setForm({ ...form, portOrigin: e.target.value })}>
                {PORT_OPTIONS.map((p) => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">{language === "en" ? "Destination Port" : "Pelabuhan Tujuan"}</label>
              <input required placeholder="e.g. Rotterdam, Netherlands" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-800" value={form.portDestination} onChange={(e) => setForm({ ...form, portDestination: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">{t("shipments", "etd")}</label>
              <input type="date" required className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-800" value={form.etd} onChange={(e) => setForm({ ...form, etd: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">{t("shipments", "eta")}</label>
              <input type="date" required className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-800" value={form.eta} onChange={(e) => setForm({ ...form, eta: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => setShowAddForm(false)} className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors">{t("common", "cancel")}</button>
            <button type="submit" disabled={submitting} className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md cursor-pointer flex items-center gap-1">
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              {t("shipments", "addShipment")}
            </button>
          </div>
        </form>
      )}

      {/* Live Trackings */}
      <div className="space-y-4">
        {shipments.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-12 text-center card-shadow">
            <p className="text-xs text-slate-400 dark:text-slate-500">{t("shipments", "emptyState")}</p>
          </div>
        ) : shipments.map((sh) => (
          <div key={sh.id} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-150 dark:border-slate-800 card-shadow p-7 flex flex-col xl:flex-row gap-6 justify-between">
            {/* Left: Container/Routing */}
            <div className="space-y-3 flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Ship className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm">{sh.containerNumber}</h3>
                    <span className="text-[8px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded font-black uppercase tracking-wider border border-slate-200/50 dark:border-slate-700/50">
                      {sh.commodity || sh.product || "Product"}
                    </span>
                  </div>
                  <p className="text-[9px] font-bold text-indigo-600 uppercase tracking-widest">{sh.shippingLine} Carrier</p>
                </div>
                <span className="ml-auto xl:ml-0 text-[10px] font-bold uppercase px-2.5 py-1 rounded-lg border bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700">
                  {sh.status}
                </span>
              </div>

              <div className="flex items-center gap-4 text-xs font-bold text-slate-800 dark:text-slate-200 bg-slate-50/60 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-150 dark:border-slate-800">
                <div className="flex-1 truncate">
                  <p className="text-[9px] font-bold uppercase text-slate-400 tracking-wider">{language === "en" ? "Origin Port" : "Pelabuhan Asal"}</p>
                  <p className="mt-1">{sh.portOrigin}</p>
                </div>
                <ArrowRight className={`w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0 ${isRtl ? 'rotate-180' : ''}`} />
                <div className="flex-1 truncate">
                  <p className="text-[9px] font-bold uppercase text-slate-400 tracking-wider">{language === "en" ? "Destination Port" : "Pelabuhan Tujuan"}</p>
                  <p className="mt-1">{sh.portDestination}</p>
                </div>
              </div>
            </div>

            {/* Middle: Schedules */}
            <div className={`grid grid-cols-2 gap-4 shrink-0 xl:w-56 border-t xl:border-t-0 ${isRtl ? 'xl:border-r xl:pr-6' : 'xl:border-l xl:pl-6'} border-slate-100 dark:border-slate-800 pt-4 xl:pt-0`}>
              <div>
                <span className="text-[9px] font-bold uppercase text-slate-400">{t("shipments", "etd")}</span>
                <p className="text-xs font-extrabold text-slate-700 dark:text-slate-200 mt-1 flex items-center gap-1">
                  <Calendar className={`w-3.5 h-3.5 ${theme === 'dark' ? 'text-indigo-400' : 'text-slate-400'}`} />
                  {sh.etd}
                </p>
              </div>
              <div>
                <span className="text-[9px] font-bold uppercase text-slate-400">{t("shipments", "eta")}</span>
                <p className="text-xs font-extrabold text-slate-700 dark:text-slate-200 mt-1 flex items-center gap-1">
                  <Calendar className={`w-3.5 h-3.5 ${theme === 'dark' ? 'text-indigo-400' : 'text-slate-400'}`} />
                  {sh.eta}
                </p>
              </div>
            </div>

            {/* Right: Document Checklist */}
            <div className={`shrink-0 xl:w-64 border-t xl:border-t-0 ${isRtl ? 'xl:border-r xl:pr-6' : 'xl:border-l xl:pl-6'} border-slate-100 dark:border-slate-800 pt-4 xl:pt-0 space-y-2`}>
              <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">{t("shipments", "docsChecklist")}</span>
              <div className="space-y-1.5">
                {sh.documents?.map((doc: any) => (
                  <button
                    key={doc.type}
                    onClick={() => onToggleDocument(sh.id, doc.type)}
                    className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl border text-[10px] font-bold transition-all ${isRtl ? 'text-right' : 'text-left'} cursor-pointer ${
                      doc.uploaded
                        ? "bg-emerald-50/50 dark:bg-emerald-950/40 border-emerald-250 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/50"
                        : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                    }`}
                  >
                    <span className="truncate">{getDocName(doc.type)}</span>
                    {doc.uploaded ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
