import React, { useState, useMemo } from "react";
import { Plus, User, Star, Trash2, ShieldCheck, CheckCircle2, XCircle } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";

interface SupplierManagementProps {
  suppliers: any[];
  onAddSupplier: (body: Record<string, unknown>) => Promise<void>;
  onDeleteSupplier: (id: string) => void;
  onUpdateReliability: (id: string, score: number) => void;
  globalSearch?: string;
}

export function SupplierManagement({
  suppliers,
  onAddSupplier,
  onDeleteSupplier,
  onUpdateReliability,
  globalSearch,
}: SupplierManagementProps) {
  const { t, language } = useLanguage();
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState({ name: "", location: "", product: "Nutmeg (ABCD Grade)", supplyCapacity: "", lastPrice: "", qualityGrade: "A", reliabilityScore: 5, legalDocs: true, notes: "" });

  const filteredSuppliers = useMemo(() => {
    if (!globalSearch) return suppliers;
    const query = globalSearch.toLowerCase();
    return suppliers.filter((sup) =>
      sup.name?.toLowerCase().includes(query) ||
      sup.product?.toLowerCase().includes(query) ||
      sup.location?.toLowerCase().includes(query)
    );
  }, [suppliers, globalSearch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.location) return;
    await onAddSupplier(form);
    setShowAddForm(false);
    setForm({ name: "", location: "", product: "Nutmeg (ABCD Grade)", supplyCapacity: "", lastPrice: "", qualityGrade: "A", reliabilityScore: 5, legalDocs: true, notes: "" });
  };

  return (
    <div className="space-y-5 md:space-y-6 animate-fade-in text-slate-800 pb-20 md:pb-0">
      {/* Header — row on md+, stacked on mobile */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <h2 className="text-lg md:text-xl font-black text-slate-900 tracking-tight truncate">{t("suppliers", "title")}</h2>
          <p className="text-[10px] md:text-[11px] text-slate-400 mt-0.5 truncate">{t("suppliers", "subtitle")}</p>
        </div>
        {/* Mobile: full-width compact button | Desktop: standard button */}
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="md:hidden w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-black text-xs rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-colors uppercase tracking-wider"
        >
          {showAddForm ? <XCircle className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showAddForm ? t("common", "close") : t("suppliers", "addSupplier")}
        </button>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="hidden md:flex px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-md items-center gap-1.5 cursor-pointer transition-colors uppercase tracking-wider"
        >
          <Plus className="w-4 h-4" />
          {showAddForm ? t("common", "close") : t("suppliers", "addSupplier")}
        </button>
      </div>

      {/* Add Supplier Form */}
      {showAddForm && (
        <form onSubmit={handleSubmit} className="bg-white p-4 md:p-6 rounded-2xl border border-slate-150 card-shadow space-y-4 animate-scale-up">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">{t("suppliers", "addSupplier")}</h3>

          {/* Row 1 — 1 col mobile, 3 col desktop */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
            <div className="space-y-1.5 sm:col-span-2 md:col-span-1">
              <label className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">{t("suppliers", "supplierName")}</label>
              <input required placeholder="e.g. Koperasi Tani Banda Mutiara" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-800" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">{t("suppliers", "address")}</label>
              <input required placeholder="e.g. Ambon, Maluku" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-800" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">{t("suppliers", "commodity")}</label>
              <select className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none cursor-pointer text-slate-800" value={form.product} onChange={(e) => setForm({ ...form, product: e.target.value })}>
                {["Nutmeg (ABCD Grade)", "Cloves (Lal Pari Grade)", "Mace (Whole Grade)", "Cassia Cinnamon (Split)", "Coffee (Robusta)"].map((p) => <option key={p}>{p}</option>)}
              </select>
            </div>
          </div>

          {/* Row 2 — 1 col mobile, 2 col sm, 4 col desktop */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">{t("suppliers", "capacity")}</label>
              <input placeholder="e.g. 15 MT / Month" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-800" value={form.supplyCapacity} onChange={(e) => setForm({ ...form, supplyCapacity: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">{language === "en" ? "Last Price" : "Harga Terakhir"}</label>
              <input placeholder="e.g. $7,800/MT" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-800" value={form.lastPrice} onChange={(e) => setForm({ ...form, lastPrice: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">{language === "en" ? "Quality Grade" : "Grade Kualitas"}</label>
              <select className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none cursor-pointer text-slate-800" value={form.qualityGrade} onChange={(e) => setForm({ ...form, qualityGrade: e.target.value })}>
                {["A", "B", "C"].map((g) => <option key={g}>{g}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">{t("suppliers", "rating")}</label>
              <select className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none cursor-pointer text-slate-800" value={form.reliabilityScore} onChange={(e) => setForm({ ...form, reliabilityScore: Number(e.target.value) })}>
                {[5, 4, 3, 2, 1].map((r) => <option key={r} value={r}>{r} Stars</option>)}
              </select>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">{language === "en" ? "Verification Notes" : "Catatan Verifikasi"}</label>
            <textarea placeholder="Write remarks on supplier certifications, quality consistency, packing speed..." className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none h-20 resize-none text-slate-800" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>

          {/* Actions — stacked on mobile, row on desktop */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
            <label className="flex items-center gap-2 text-[11px] font-bold text-slate-600 cursor-pointer order-2 sm:order-1">
              <input type="checkbox" checked={form.legalDocs} onChange={(e) => setForm({ ...form, legalDocs: e.target.checked })} className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer" />
              <span className="hidden xs:inline">{language === "en" ? "Verified Legal Documents Uploaded" : "Dokumen Legal Terverifikasi Diunggah"}</span>
              <span className="xs:hidden">{language === "en" ? "Verified Documents" : "Dokumen Terverifikasi"}</span>
            </label>
            <div className="flex gap-2 sm:gap-3 order-1 sm:order-2">
              <button type="button" onClick={() => setShowAddForm(false)} className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-500 hover:bg-slate-50 cursor-pointer">{t("common", "cancel")}</button>
              <button type="submit" className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs shadow-md cursor-pointer">{t("suppliers", "addSupplier")}</button>
            </div>
          </div>
        </form>
      )}

      {/* Supplier Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
        {filteredSuppliers.length === 0 ? (
          <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-8 md:p-12 text-center card-shadow col-span-1 md:col-span-2 text-slate-800">
            <p className="text-xs text-slate-400">{t("suppliers", "emptyState")}</p>
          </div>
        ) : filteredSuppliers.map((sup) => (
          <div key={sup.id} className="bg-white rounded-2xl md:rounded-3xl border border-slate-150 card-shadow p-4 md:p-6 flex flex-col justify-between hover:border-slate-300 transition-all text-slate-800">
            <div className="space-y-3 md:space-y-3.5">
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-extrabold text-slate-800 text-xs truncate">{sup.name}</h3>
                    <p className="text-[9px] font-bold text-slate-400 mt-0.5 truncate">{sup.location}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 md:gap-1.5 shrink-0">
                  <span className="text-[9px] md:text-[10px] font-black bg-slate-100 text-slate-600 px-2 md:px-2.5 py-0.5 rounded-lg border border-slate-200 uppercase">
                    Grade {sup.qualityGrade}
                  </span>
                  <button onClick={() => { if(confirm(t("suppliers", "deleteConfirm"))) onDeleteSupplier(sup.id); }} className="p-1.5 rounded-lg hover:bg-rose-50 hover:text-rose-600 text-slate-400 transition-colors cursor-pointer">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Specs — 2 cols on mobile, 3 on md+ */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 bg-slate-50 p-2.5 md:p-3 rounded-xl border border-slate-150 text-[10px] font-bold">
                <div className="min-w-0">
                  <span className="text-slate-400 uppercase text-[8px] md:text-[9px] block">{t("suppliers", "commodity")}</span>
                  <p className="text-slate-700 mt-0.5 truncate">{sup.product}</p>
                </div>
                <div className="min-w-0">
                  <span className="text-slate-400 uppercase text-[8px] md:text-[9px] block">{t("suppliers", "capacity")}</span>
                  <p className="text-slate-700 mt-0.5 truncate">{sup.supplyCapacity || "Not set"}</p>
                </div>
                <div className="col-span-2 md:col-span-1 min-w-0">
                  <span className="text-slate-400 uppercase text-[8px] md:text-[9px] block">{language === "en" ? "Last Price" : "Harga Terakhir"}</span>
                  <p className="text-indigo-600 mt-0.5 truncate">{sup.lastPrice || "Negotiable"}</p>
                </div>
              </div>

              {/* Notes */}
              {sup.notes && (
                <p className="text-[9px] md:text-[10px] text-slate-600 dark:text-amber-200 leading-relaxed font-semibold italic bg-amber-50/50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/50 p-2 md:p-2.5 rounded-xl line-clamp-3">
                  {sup.notes}
                </p>
              )}
            </div>

            {/* Bottom Actions — wrap on very small screens */}
            <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-2 border-t border-slate-100 pt-3 md:pt-4 mt-3 md:mt-4 text-[10px] font-bold">
              {/* Reliability Stars */}
              <div className="flex items-center gap-1.5 md:gap-2">
                <span className="text-[8px] md:text-[9px] text-slate-400 uppercase font-bold shrink-0">{t("suppliers", "rating")}</span>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star} onClick={() => onUpdateReliability(sup.id, star)} className="cursor-pointer p-0.5 hover:scale-110 transition-transform">
                      <Star className={`w-3.5 h-3.5 ${star <= sup.reliabilityScore ? "text-amber-400 fill-amber-400" : "text-slate-200"}`} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Legal verification status */}
              <div className="flex items-center gap-1.5">
                {sup.legalDocs ? (
                  <span className="flex items-center gap-1 text-[8px] md:text-[9px] uppercase tracking-wide bg-slate-50 text-slate-600 border border-slate-200 px-2 md:px-2.5 py-1 rounded-lg font-bold">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" /> {language === "en" ? "Verified" : "Terverifikasi"}
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[8px] md:text-[9px] uppercase tracking-wide bg-slate-50 text-slate-500 border border-slate-200 px-2 md:px-2.5 py-1 rounded-lg font-bold">
                    <XCircle className="w-3 h-3 text-rose-400" /> {language === "en" ? "Unverified" : "Belum Verifikasi"}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
