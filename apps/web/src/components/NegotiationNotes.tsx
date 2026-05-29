import React, { useState, useEffect } from "react";
import { Plus, StickyNote, Tag, Trash2, Calendar, Search, Filter } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";

interface NegotiationNotesProps {
  notes: any[];
  buyerNames: string[];
  onAddNote: (body: Record<string, unknown>) => Promise<void>;
  onDeleteNote: (id: string) => void;
  globalSearch?: string;
}

export function NegotiationNotes({ notes, buyerNames, onAddNote, onDeleteNote, globalSearch }: NegotiationNotesProps) {
  const { t, language, isRtl } = useLanguage();
  const [showAddForm, setShowAddForm] = useState(false);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [form, setForm] = useState({ buyerName: buyerNames[0] ?? "", category: "Preference", content: "", tags: "" });

  // Sync globalSearch from parent
  useEffect(() => {
    if (globalSearch !== undefined) {
      setSearch(globalSearch);
    }
  }, [globalSearch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.buyerName || !form.content) return;
    const tagArray = form.tags.split(",").map(t => t.trim().toLowerCase()).filter(t => t.length > 0);
    await onAddNote({
      buyerName: form.buyerName,
      category: form.category,
      content: form.content,
      tags: tagArray
    });
    setShowAddForm(false);
    setForm({ buyerName: buyerNames[0] ?? "", category: "Preference", content: "", tags: "" });
  };

  const getCategoryLabel = (c: string) => {
    switch (c) {
      case "Preference": return language === "en" ? "Preference" : language === "hi" ? "पसंद" : language === "zh" ? "偏好" : language === "ar" ? "تفضيل" : "Preferensi";
      case "Risk": return language === "en" ? "Risk" : language === "hi" ? "जोखिम" : language === "zh" ? "风险" : language === "ar" ? "مخاطرة" : "Risiko";
      case "Payment": return language === "en" ? "Payment" : language === "hi" ? "भुगतान" : language === "zh" ? "支付" : language === "ar" ? "دفع" : "Pembayaran";
      case "Opportunity": return language === "en" ? "Opportunity" : language === "hi" ? "अवसर" : language === "zh" ? "商机" : language === "ar" ? "فرصة" : "Peluang";
      case "General": return language === "en" ? "General" : language === "hi" ? "सामान्य" : language === "zh" ? "通用" : language === "ar" ? "عام" : "Umum";
      default: return c;
    }
  };

  const filtered = notes.filter((n) => {
    const matchesSearch =
      n.buyerName.toLowerCase().includes(search.toLowerCase()) ||
      n.content.toLowerCase().includes(search.toLowerCase()) ||
      n.tags.some((t: string) => t.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = filterCategory === "all" || n.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6 animate-fade-in text-slate-800">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">{t("common", "negotiation-notes")}</h2>
          <p className="text-[11px] text-slate-400 mt-0.5">{t("negotiation", "subtitle")}</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer transition-colors"
        >
          <Plus className="w-4 h-4" />
          {showAddForm ? t("common", "close") : t("negotiation", "addNote")}
        </button>
      </div>

      {/* Add Note Form */}
      {showAddForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-slate-150 card-shadow space-y-4 animate-scale-up">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">{t("negotiation", "tacticalLog")}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">{t("negotiation", "buyerSelect")}</label>
              <select className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none cursor-pointer text-slate-800" value={form.buyerName} onChange={(e) => setForm({ ...form, buyerName: e.target.value })}>
                {buyerNames.length === 0 ? (
                  <option value="">{language === "en" ? "No Active Buyers" : "Belum Ada Buyer Aktif"}</option>
                ) : (
                  buyerNames.map((n) => <option key={n}>{n}</option>)
                )}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">{t("negotiation", "priority")}</label>
              <select className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none cursor-pointer text-slate-800" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {["Preference", "Risk", "Payment", "Opportunity", "General"].map((c) => <option key={c} value={c}>{getCategoryLabel(c)}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">{language === "en" ? "Search Tags (Comma separated)" : "Tag Pencarian (Pemisah koma)"}</label>
              <input placeholder="e.g. cif, rotterdam, mufg" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-800" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">{language === "en" ? "Note / Observation Content" : "Isi Catatan / Taktik"}</label>
            <textarea required placeholder={t("negotiation", "content")} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none h-24 resize-none text-slate-800" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
          </div>
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => setShowAddForm(false)} className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-500 hover:bg-slate-50 cursor-pointer">{t("common", "cancel")}</button>
            <button type="submit" disabled={buyerNames.length === 0} className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md cursor-pointer disabled:opacity-50">{t("negotiation", "saveNote")}</button>
          </div>
        </form>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-150 card-shadow flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className={`absolute ${isRtl ? 'right-3.5' : 'left-3.5'} top-3 w-4 h-4 text-slate-400`} />
          <input
            type="text"
            placeholder={language === "en" ? "Search notes content or tags..." : language === "hi" ? "नोट्स या टैग खोजें..." : language === "zh" ? "搜索笔记内容或标签..." : language === "ar" ? "بحث في الملاحظات أو الكلمات الدلالية..." : "Cari isi catatan atau tag..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`w-full ${isRtl ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder:text-slate-400 text-slate-800`}
          />
        </div>
        <div className="flex gap-2">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer text-slate-600 font-semibold"
          >
            <option value="all">{t("common", "all")} {t("negotiation", "priority")}</option>
            {["Preference", "Risk", "Payment", "Opportunity", "General"].map((c) => (
              <option key={c} value={c}>{getCategoryLabel(c)}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Notes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.length === 0 ? (
          <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-12 text-center card-shadow col-span-full">
            <p className="text-xs text-slate-400">{t("negotiation", "emptyState")}</p>
          </div>
        ) : filtered.map((note) => (
          <div key={note.id} className="bg-white p-5 rounded-3xl border border-slate-150 card-shadow hover:border-slate-350 transition-all flex flex-col justify-between text-slate-800">
            <div className="space-y-3.5">
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <StickyNote className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-xs truncate max-w-[130px]">{note.buyerName}</h3>
                    <p className="text-[9px] font-bold text-slate-400 mt-0.5 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-300" />
                      {note.date}
                    </p>
                  </div>
                </div>
                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${
                  note.category === "Risk" ? "bg-rose-50 border-rose-150 text-rose-700" :
                  note.category === "Payment" ? "bg-purple-50 border-purple-150 text-purple-700" :
                  note.category === "Opportunity" ? "bg-emerald-50 border-emerald-150 text-emerald-700" :
                  note.category === "Preference" ? "bg-amber-50 border-amber-150 text-amber-700" :
                  "bg-slate-50 border-slate-150 text-slate-700"
                }`}>
                  {getCategoryLabel(note.category)}
                </span>
              </div>

              {/* Content */}
              <p className="text-[11px] font-semibold text-slate-600 leading-relaxed min-h-[50px]">
                {note.content}
              </p>
            </div>

            {/* Tags and Delete */}
            <div className="flex items-center justify-between border-t border-slate-100 pt-3.5 mt-4">
              <div className="flex gap-1 flex-wrap max-w-[180px]">
                {note.tags?.map((t: string) => (
                  <span key={t} className="text-[9px] font-bold bg-slate-50 border border-slate-200 text-slate-400 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                    <Tag className="w-2.5 h-2.5 text-slate-300" />
                    {t}
                  </span>
                ))}
              </div>
              <button onClick={() => { if(confirm(t("negotiation", "deleteConfirm"))) onDeleteNote(note.id); }} className="p-1.5 rounded-lg hover:bg-rose-50 hover:text-rose-600 text-slate-400 transition-colors cursor-pointer shrink-0">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
