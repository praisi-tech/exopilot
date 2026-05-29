"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Plus, Search, Bell, FileText, Trash2, MessageSquare,
  ChevronDown, Globe, Package, Scale, DollarSign, Mail,
  CalendarPlus, CheckCircle2, Clock,
} from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import { sanitizeSearchQuery } from "@/lib/security";

// ── Google Calendar SVG Logo ──────────────────────────────────────────────────
const GoogleCalendarIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="4" width="20" height="18" rx="2" fill="#fff" stroke="#E0E0E0" strokeWidth="0.5"/>
    <rect x="2" y="4" width="20" height="5" rx="2" fill="#4285F4"/>
    <rect x="2" y="7" width="20" height="2" fill="#4285F4"/>
    <rect x="7" y="2" width="2" height="5" rx="1" fill="#4285F4"/>
    <rect x="15" y="2" width="2" height="5" rx="1" fill="#4285F4"/>
    <text x="12" y="18" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#1A73E8">31</text>
  </svg>
);

// ── Build Google Calendar "Add Event" URL ────────────────────────────────────
function buildCalendarUrl(buyerName: string, product: string, reminderDate?: string): string {
  const title = encodeURIComponent(`Follow Up: ${buyerName} — ${product}`);
  const details = encodeURIComponent(`Buyer inquiry follow-up for ${buyerName}.\nProduct: ${product}`);

  let dates = "";
  if (reminderDate && reminderDate.length === 10) {
    // Format: YYYYMMDD/YYYYMMDD (all-day event)
    const d = reminderDate.replace(/-/g, "");
    const next = new Date(reminderDate);
    next.setDate(next.getDate() + 1);
    const dEnd = next.toISOString().slice(0, 10).replace(/-/g, "");
    dates = `&dates=${d}/${dEnd}`;
  } else {
    // Default: today
    const today = new Date();
    const d = today.toISOString().slice(0, 10).replace(/-/g, "");
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dEnd = tomorrow.toISOString().slice(0, 10).replace(/-/g, "");
    dates = `&dates=${d}/${dEnd}`;
  }

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}${dates}`;
}

// ── 3-day follow-up reminder logic ────────────────────────────────────────────
function getFollowUpStatus(firstEmailSentAt?: string): "none" | "upcoming" | "due" | "overdue" {
  if (!firstEmailSentAt) return "none";
  const sent = new Date(firstEmailSentAt).getTime();
  const now = Date.now();
  const diff = now - sent;
  const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
  const fourDaysMs = 4 * 24 * 60 * 60 * 1000;
  if (diff < threeDaysMs) return "upcoming";
  if (diff < fourDaysMs) return "due";
  return "overdue";
}

// ── 3-day follow-up reminder logic ────────────────────────────────────────────
function getDaysUntilFollowUp(firstEmailSentAt?: string): number | null {
  if (!firstEmailSentAt) return null;
  const sent = new Date(firstEmailSentAt).getTime();
  const dueAt = sent + 3 * 24 * 60 * 60 * 1000;
  const diff = dueAt - Date.now();
  return Math.ceil(diff / (24 * 60 * 60 * 1000));
}

// ─────────────────────────────────────────────────────────────────────────────

interface BuyerInquiriesProps {
  inquiries: any[];
  onAddInquiry: () => void;
  onDeleteInquiry: (id: string) => void;
  onUpdateStatus: (id: string, status: string) => void;
  onGenerateDoc: (id: string) => void;
  onMarkEmailSent?: (id: string) => void;
  globalSearch?: string;
}

export function BuyerInquiries({
  inquiries,
  onAddInquiry,
  onDeleteInquiry,
  onUpdateStatus,
  onGenerateDoc,
  onMarkEmailSent,
  globalSearch,
}: BuyerInquiriesProps) {
  const { t, language, isRtl } = useLanguage();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [emailSentIds, setEmailSentIds] = useState<Set<string>>(new Set());

  // Sync globalSearch from parent
  useEffect(() => {
    if (globalSearch !== undefined) {
      setSearch(globalSearch);
    }
  }, [globalSearch]);


  const STATUS_OPTIONS = [
    { value: "New Inquiry",     label: language === "en" ? "New Inquiry"     : language === "hi" ? "नई पूछताछ"          : language === "zh" ? "新询盘"     : language === "ar" ? "استفسار جديد"   : "Baru" },
    { value: "Negotiating",     label: language === "en" ? "Negotiating"     : language === "hi" ? "बातचीत"             : language === "zh" ? "谈判中"     : language === "ar" ? "تفاوض"          : "Negosiasi" },
    { value: "Sample Sent",     label: language === "en" ? "Sample Sent"     : language === "hi" ? "नमूना भेजा"         : language === "zh" ? "寄样"       : language === "ar" ? "تم إرسال العينة": "Sampel Dikirim" },
    { value: "Waiting Payment", label: language === "en" ? "Waiting Payment" : language === "hi" ? "भुगतान की प्रतीक्षा": language === "zh" ? "等待付款"   : language === "ar" ? "بانتظار الدفع"  : "Menunggu Bayar" },
    { value: "Closed Deal",     label: language === "en" ? "Closed Deal"     : language === "hi" ? "सौदा बंद"           : language === "zh" ? "交易达成"   : language === "ar" ? "صفقة مغلقة"     : "Deal Selesai" },
    { value: "Lost",            label: language === "en" ? "Lost"            : language === "hi" ? "खो दिया"            : language === "zh" ? "流失"       : language === "ar" ? "ملغية"           : "Tidak Jadi" },
  ];

  const getDotColor = (val: string) => {
    switch (val) {
      case "New Inquiry":     return "bg-blue-500";
      case "Negotiating":     return "bg-amber-500";
      case "Sample Sent":     return "bg-indigo-500";
      case "Waiting Payment": return "bg-purple-500";
      case "Closed Deal":     return "bg-emerald-500";
      case "Lost":            return "bg-rose-500";
      default:                return "bg-slate-400";
    }
  };

  const sanitizedSearch = useMemo(() => sanitizeSearchQuery(search), [search]);

  const filtered = inquiries.filter((inq) => {
    const matchQuery =
      inq.buyerName?.toLowerCase().includes(sanitizedSearch.toLowerCase()) ||
      inq.product?.toLowerCase().includes(sanitizedSearch.toLowerCase()) ||
      inq.country?.toLowerCase().includes(sanitizedSearch.toLowerCase());
    const matchStatus = filterStatus === "all" || inq.status === filterStatus;
    return matchQuery && matchStatus;
  });

  const handleDelete = (id: string) => {
    if (confirmDelete === id) {
      onDeleteInquiry(id);
      setConfirmDelete(null);
    } else {
      setConfirmDelete(id);
      setTimeout(() => setConfirmDelete(null), 3000);
    }
  };

  const handleMarkEmailSent = (id: string) => {
    setEmailSentIds((prev) => new Set([...prev, id]));
    onMarkEmailSent?.(id);
  };

  // Count due follow-ups for badge
  const dueCount = inquiries.filter((inq) => {
    const status = getFollowUpStatus(inq.firstEmailSentAt);
    return status === "due" || status === "overdue";
  }).length;

  return (
    <div className="space-y-6 animate-fade-in text-slate-800 dark:text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            {t("common", "inquiries")}
            {dueCount > 0 && (
              <span className="inline-flex items-center gap-1 text-[9px] font-black bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full animate-pulse">
                <Bell className="w-2.5 h-2.5" />
                {dueCount} follow-up{dueCount > 1 ? "s" : ""} due
              </span>
            )}
          </h2>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">{t("inquiries", "pipelineSubtitle")}</p>
        </div>
        <button
          onClick={onAddInquiry}
          id="btn-add-inquiry"
          className="self-start sm:self-auto px-5 py-3 bg-indigo-600 dark:bg-indigo-600 hover:bg-indigo-700 dark:hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer transition-all uppercase tracking-wider"
        >
          <Plus className="w-4 h-4" />
          {t("inquiries", "addInquiry")}
        </button>
      </div>

      {/* Filter bar */}
      <div className="bg-white p-5 rounded-3xl border border-slate-150 card-shadow flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className={`absolute ${isRtl ? "right-4" : "left-4"} top-3.5 w-4 h-4 text-slate-400`} />
          <input
            type="text"
            placeholder={
              language === "en" ? "Search buyer, country, or commodity..." :
              language === "hi" ? "खरीदार, देश या वस्तु खोजें..." :
              language === "zh" ? "搜索买家、国家或大宗商品..." :
              language === "ar" ? "ابحث عن المشتري، الدولة، أو السلعة..." :
              "Cari nama buyer, negara, atau komoditas..."
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            maxLength={100}
            className={`w-full ${isRtl ? "pr-11 pl-4" : "pl-11 pr-4"} py-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-700 focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-600 text-slate-800 dark:text-slate-200 bg-slate-50/30 dark:bg-slate-800`}
          />
        </div>
        <div className="relative">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className={`appearance-none ${isRtl ? "pr-4 pl-10" : "pl-4 pr-10"} py-3 rounded-2xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer font-bold text-slate-600`}
          >
            <option value="all">{t("common", "all")} {t("common", "status")}</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <ChevronDown className={`absolute ${isRtl ? "left-3.5" : "right-3.5"} top-4.5 w-3.5 h-3.5 text-slate-400 pointer-events-none`} />
        </div>
      </div>

      {/* Status legend filter pills */}
      <div className="flex flex-wrap gap-2 pb-1">
        {STATUS_OPTIONS.map((s) => {
          const isActive = filterStatus === s.value;
          return (
            <button
              key={s.value}
              onClick={() => setFilterStatus(isActive ? "all" : s.value)}
              className={`text-[10px] font-bold px-3.5 py-1.5 rounded-xl border flex items-center gap-2 cursor-pointer transition-all ${
                isActive
                  ? "bg-slate-900 dark:bg-indigo-900 text-white border-slate-900 dark:border-indigo-900"
                  : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${getDotColor(s.value)}`} />
              <span>{s.label}</span>
              <span className={`text-[9px] px-1.5 py-0.2 rounded-full ${isActive ? "bg-slate-700 text-slate-300" : "bg-slate-100 text-slate-400"}`}>
                {inquiries.filter((i) => i.status === s.value).length}
              </span>
            </button>
          );
        })}
      </div>

      {/* Pipeline list */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="bg-white border border-dashed border-slate-200 rounded-3xl p-12 text-center card-shadow">
            <MessageSquare className="w-10 h-10 text-slate-200 mx-auto mb-3" />
            <h4 className="text-sm font-bold text-slate-700">
              {inquiries.length === 0 ? t("inquiries", "emptyState") : (language === "en" ? "Not found" : "Tidak ditemukan")}
            </h4>
            <p className="text-[11px] text-slate-400 mt-2 leading-relaxed max-w-xs mx-auto">
              {inquiries.length === 0
                ? (language === "en" ? "Start by logging your first inquiry from your buyer." : "Mulai dengan mencatat permintaan pertama dari buyer kamu.")
                : (language === "en" ? "Try changing search terms or clearing status filters." : "Coba ubah kata kunci pencarian atau hapus filter status.")}
            </p>
            {inquiries.length === 0 && (
              <button
                onClick={onAddInquiry}
                className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl cursor-pointer inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> {t("inquiries", "addInquiry")}
              </button>
            )}
          </div>
        ) : (
          filtered.map((inq) => {
            const followUpStatus = getFollowUpStatus(inq.firstEmailSentAt);
            const daysLeft = getDaysUntilFollowUp(inq.firstEmailSentAt);
            const emailAlreadySent = !!inq.firstEmailSentAt || emailSentIds.has(inq.id);
            const calendarUrl = buildCalendarUrl(inq.buyerName, inq.product, inq.followUpReminderDate);

            return (
              <div
                key={inq.id}
                className={`bg-white p-6 rounded-3xl border transition-all card-shadow ${
                  followUpStatus === "due" || followUpStatus === "overdue"
                    ? "border-amber-200 shadow-amber-100"
                    : "border-slate-150 hover:border-slate-300"
                }`}
              >
                {/* Follow-up reminder banner */}
                {(followUpStatus === "due" || followUpStatus === "overdue") && (
                  <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-700">
                    <Bell className="w-3.5 h-3.5 shrink-0 animate-bounce" />
                    <span className="text-[10px] font-black">
                      {followUpStatus === "overdue"
                        ? (language === "en" ? "⚠️ Follow-up overdue! Send a follow-up email now." : "⚠️ Follow-up terlambat! Kirim email sekarang.")
                        : (language === "en" ? "🔔 Follow-up reminder is due today!" : "🔔 Reminder follow-up hari ini!")}
                    </span>
                  </div>
                )}

                {followUpStatus === "upcoming" && daysLeft !== null && daysLeft >= 0 && (
                  <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-xl bg-blue-50 border border-blue-100 text-blue-600">
                    <Clock className="w-3.5 h-3.5 shrink-0" />
                    <span className="text-[10px] font-bold">
                      {language === "en"
                        ? `Follow-up reminder in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}`
                        : `Reminder follow-up dalam ${daysLeft} hari`}
                    </span>
                  </div>
                )}

                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="min-w-0 flex-1 space-y-3">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h3 className="font-extrabold text-slate-800 text-sm">{inq.buyerName}</h3>
                      <span className="text-[9px] font-bold uppercase bg-slate-100 text-slate-500 px-2.5 py-0.5 rounded border border-slate-200">
                        {`via ${inq.source}`}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-slate-500 text-[11px] flex-wrap font-semibold">
                      <div className="flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-bold text-slate-700">{inq.country}</span>
                      </div>
                      <span className="text-slate-300 font-normal">|</span>
                      <div className="flex items-center gap-1.5">
                        <Package className="w-3.5 h-3.5 text-slate-400" />
                        <span>{inq.product}</span>
                      </div>
                      <span className="text-slate-300 font-normal">|</span>
                      <div className="flex items-center gap-1.5">
                        <Scale className="w-3.5 h-3.5 text-slate-400" />
                        <span>{inq.quantity}</span>
                      </div>
                      {inq.price && (
                        <>
                          <span className="text-slate-300 font-normal">|</span>
                          <div className="flex items-center gap-1.5 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-lg border border-indigo-100/50">
                            <DollarSign className="w-3 h-3 text-indigo-500" />
                            <span className="font-bold">{inq.price}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2 flex-wrap border-t lg:border-t-0 pt-4 lg:pt-0">
                    {/* Follow-up reminder date badge */}
                    {inq.followUpReminderDate && (
                      <div className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2.5 py-1.5 rounded-xl border border-amber-100">
                        <Bell className="w-3 h-3" />
                        {inq.followUpReminderDate}
                      </div>
                    )}

                    {/* Add to Google Calendar */}
                    <a
                      href={calendarUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      id={`btn-calendar-${inq.id}`}
                      title={language === "en" ? "Add follow-up to Google Calendar" : "Tambah ke Google Calendar"}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-200 text-slate-600 hover:text-blue-600 text-[10px] font-bold transition-all cursor-pointer"
                    >
                      <GoogleCalendarIcon size={13} />
                      <span className="hidden sm:inline">
                        {language === "en" ? "Calendar" : "Kalender"}
                      </span>
                    </a>

                    {/* Send Follow-Up Email button */}
                    <button
                      onClick={() => handleMarkEmailSent(inq.id)}
                      id={`btn-followup-${inq.id}`}
                      title={emailAlreadySent
                        ? (language === "en" ? "Follow-up email already sent" : "Email follow-up sudah dikirim")
                        : (language === "en" ? "Mark follow-up email as sent" : "Tandai email follow-up dikirim")}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all cursor-pointer ${
                        emailAlreadySent
                          ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                          : "bg-white hover:bg-indigo-50 border-slate-200 hover:border-indigo-200 text-slate-600 hover:text-indigo-600"
                      }`}
                    >
                      {emailAlreadySent ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      ) : (
                        <Mail className="w-3.5 h-3.5" />
                      )}
                      <span className="hidden sm:inline">
                        {emailAlreadySent
                          ? (language === "en" ? "Sent" : "Terkirim")
                          : (language === "en" ? "Follow-Up" : "Follow-Up")}
                      </span>
                    </button>

                    {/* Status dropdown */}
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${getDotColor(inq.status)}`} />
                      <div className="relative">
                        <select
                          value={inq.status}
                          onChange={(e) => onUpdateStatus(inq.id, e.target.value)}
                          className={`text-[10px] font-black uppercase tracking-wider ${isRtl ? "pl-5 pr-0" : "pl-0 pr-5"} bg-transparent cursor-pointer focus:outline-none appearance-none text-slate-700`}
                        >
                          {STATUS_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value} className="bg-white text-slate-800 font-sans normal-case">
                              {opt.label}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className={`absolute ${isRtl ? "left-0" : "right-0"} top-1 w-3 h-3 pointer-events-none opacity-60 text-slate-500`} />
                      </div>
                    </div>

                    {/* Generate Document */}
                    <button
                      onClick={() => onGenerateDoc(inq.id)}
                      title={t("docStudio", "generateBtn")}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-[11px] font-bold transition-colors cursor-pointer border border-indigo-100"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      {language === "en" ? "Create Document" : language === "hi" ? "दस्तावेज़ बनाएं" : language === "zh" ? "生成单证" : language === "ar" ? "إنشاء مستند" : "Buat Dokumen"}
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(inq.id)}
                      title={confirmDelete === inq.id
                        ? (language === "en" ? "Click again to confirm delete" : "Klik sekali lagi untuk konfirmasi hapus")
                        : (language === "en" ? "Delete this inquiry" : "Hapus inquiry ini")}
                      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[11px] font-bold transition-all cursor-pointer border ${
                        confirmDelete === inq.id
                          ? "bg-rose-500 text-white border-rose-500 animate-pulse"
                          : "bg-slate-50 hover:bg-rose-50 text-slate-500 hover:text-rose-600 border-slate-200"
                      }`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      {confirmDelete === inq.id
                        ? (language === "en" ? "Are you sure?" : language === "hi" ? "क्या आप सुनिश्चित हैं?" : language === "zh" ? "确认删除？" : language === "ar" ? "هل أنت متأكد؟" : "Yakin hapus?")
                        : (language === "en" ? "Delete" : language === "hi" ? "हटाएं" : language === "zh" ? "删除" : language === "ar" ? "حذف" : "Hapus")}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
