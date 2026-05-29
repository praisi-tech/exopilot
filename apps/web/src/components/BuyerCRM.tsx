import React, { useState, useEffect } from "react";
import {
  User,
  MapPin,
  Star,
  Search,
  CheckCheck,
  MessageSquarePlus,
  X,
  Send,
  ClipboardList,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import * as api from "@/lib/api";
import { sanitizeSearchQuery } from "@/lib/security";

// ── Google Forms SVG Logo ─────────────────────────────────────────────────────
const GoogleFormsIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="4" y="1" width="16" height="22" rx="2" fill="#7248B9"/>
    <rect x="7" y="6" width="10" height="1.5" rx="0.75" fill="white" fillOpacity="0.9"/>
    <rect x="7" y="9.5" width="10" height="1.5" rx="0.75" fill="white" fillOpacity="0.9"/>
    <rect x="7" y="13" width="7" height="1.5" rx="0.75" fill="white" fillOpacity="0.9"/>
    <circle cx="7.75" cy="16.75" r="1" fill="white" fillOpacity="0.8"/>
    <circle cx="7.75" cy="19.25" r="1" fill="white" fillOpacity="0.8"/>
    <rect x="10" y="16" width="7" height="1.5" rx="0.75" fill="white" fillOpacity="0.7"/>
    <rect x="10" y="18.5" width="5" height="1.5" rx="0.75" fill="white" fillOpacity="0.7"/>
  </svg>
);

// ─── Configuration ───────────────────────────────────────────────────────────
// Default placeholder — users set their own Google Form URL in Settings.
const DEFAULT_GOOGLE_FORM_URL =
  "https://docs.google.com/forms/d/e/YOUR_FORM_ID/viewform";
const GOOGLE_FORM_BUYER_NAME_ENTRY = "entry.000000000"; // replace with real entry ID
const GOOGLE_FORM_RATING_ENTRY = "entry.000000001";     // replace with real entry ID
// ─────────────────────────────────────────────────────────────────────────────

interface Review {
  id: string;
  reviewer: string;
  rating: number;
  comment: string;
  date: string;
  source: "internal" | "google_form";
}

interface BuyerCRMProps {
  buyers: any[];
  onRefresh?: () => void;
  globalSearch?: string;
  googleFormUrl?: string; // user's own Google Form URL from profile
}

function buildFormUrl(baseUrl: string, buyerName: string): string {
  // If user hasn't set their form URL, return the base as-is
  if (!baseUrl || baseUrl.includes("YOUR_FORM_ID")) return baseUrl;
  const separator = baseUrl.includes("?") ? "&" : "?";
  const params = new URLSearchParams({
    [GOOGLE_FORM_BUYER_NAME_ENTRY]: buyerName,
    usp: "pp_url",
  });
  return `${baseUrl}${separator}${params.toString()}`;
}

function StarRating({
  value,
  onChange,
  size = "sm",
}: {
  value: number;
  onChange?: (v: number) => void;
  size?: "sm" | "lg";
}) {
  const [hovered, setHovered] = useState(0);
  const sz = size === "lg" ? "w-5 h-5" : "w-3.5 h-3.5";
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`${sz} transition-colors ${
            s <= (hovered || value)
              ? "text-amber-400 fill-amber-400"
              : "text-slate-200"
          } ${onChange ? "cursor-pointer" : ""}`}
          onMouseEnter={() => onChange && setHovered(s)}
          onMouseLeave={() => onChange && setHovered(0)}
          onClick={() => onChange && onChange(s)}
        />
      ))}
    </div>
  );
}

function AddReviewPanel({
  buyerName,
  onClose,
  onSubmit,
}: {
  buyerName: string;
  onClose: () => void;
  onSubmit: (r: Omit<Review, "id" | "date" | "source">) => void;
}) {
  const { t, language } = useLanguage();
  const [rating, setRating] = useState(5);
  const [reviewer, setReviewer] = useState("");
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewer.trim() || !comment.trim()) return;
    onSubmit({ reviewer, rating, comment });
    setSubmitted(true);
    setTimeout(onClose, 1200);
  };

  return (
    <div className="fixed inset-0 bg-slate-955/50 dark:bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-150 overflow-hidden animate-scale-up">
        {/* Header */}
        <div className="bg-gradient-to-tr from-slate-900 to-indigo-950 p-5 flex items-start justify-between">
          <div>
            <h3 className="text-sm font-black text-white tracking-wide uppercase flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-indigo-300" />
              {t("buyerCrm", "addReview")}
            </h3>
            <p className="text-[10px] text-indigo-200 mt-0.5">
              {language === "en" ? "Review for" : "Ulasan untuk"} <span className="font-black text-white">{buyerName}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-indigo-300 hover:text-white transition-colors cursor-pointer mt-0.5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {submitted ? (
          <div className="p-10 text-center space-y-2">
            <CheckCheck className="w-8 h-8 text-emerald-500 mx-auto" />
            <p className="text-xs font-black text-slate-700">{t("common", "success")}!</p>
          </div>
        ) : (
          <form onSubmit={handle} className="p-6 space-y-5">
            {/* Reviewer name */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                {t("common", "fullName")}
              </label>
              <input
                required
                placeholder="e.g. Rina — Export Manager"
                value={reviewer}
                onChange={(e) => setReviewer(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder:text-slate-300 text-slate-800"
              />
            </div>

            {/* Star rating */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                {t("buyerCrm", "rating")}
              </label>
              <StarRating value={rating} onChange={setRating} size="lg" />
            </div>

            {/* Comment */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                {t("buyerCrm", "reviews")}
              </label>
              <textarea
                required
                rows={3}
                placeholder={t("buyerCrm", "reviewText")}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder:text-slate-300 resize-none text-slate-800"
              />
            </div>

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-500 hover:bg-slate-50 cursor-pointer transition-colors"
              >
                {t("common", "cancel")}
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md cursor-pointer transition-colors flex items-center justify-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                {t("buyerCrm", "submitReview")}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export function BuyerCRMModule({ buyers, onRefresh, globalSearch, googleFormUrl }: BuyerCRMProps) {
  const { t, language, isRtl } = useLanguage();
  const [search, setSearch] = useState("");
  const [selectedBuyer, setSelectedBuyer] = useState<any | null>(null);
  const [showAddReview, setShowAddReview] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showReviews, setShowReviews] = useState(true);

  // Sync globalSearch from parent
  useEffect(() => {
    if (globalSearch !== undefined) {
      setSearch(globalSearch);
    }
  }, [globalSearch]);


  // Add Booking state
  const [showAddBooking, setShowAddBooking] = useState(false);
  const [newBooking, setNewBooking] = useState({
    date: new Date().toISOString().split("T")[0],
    product: "Nutmeg ABCD",
    quantity: "10 MT",
    incoterms: "FOB",
    value: "$80,000"
  });
  const [addingBooking, setAddingBooking] = useState(false);

  const handleAddBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!active) return;
    setAddingBooking(true);
    try {
      const updatedDealHistory = [
        ...(active.dealHistory || []),
        {
          date: newBooking.date,
          product: newBooking.product,
          quantity: newBooking.quantity,
          incoterms: newBooking.incoterms,
          value: newBooking.value
        }
      ];
      // Sync to total volume too
      let totalV = 0;
      updatedDealHistory.forEach(d => {
        totalV += Number(d.quantity.replace(/[^0-9.]/g, "")) || 0;
      });
      const totalVolumeStr = `${totalV} MT`;

      await api.updateBuyerCRM(active.id, { 
        dealHistory: updatedDealHistory,
        totalVolume: totalVolumeStr
      });
      setShowAddBooking(false);
      setNewBooking({
        date: new Date().toISOString().split("T")[0],
        product: "Nutmeg ABCD",
        quantity: "10 MT",
        incoterms: "FOB",
        value: "$80,000"
      });
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error("Failed to add booking:", err);
    } finally {
      setAddingBooking(false);
    }
  };

  // Local reviews store (per buyer, keyed by buyer id)
  const [reviewsMap, setReviewsMap] = useState<Record<string, Review[]>>({});

  const filtered = buyers.filter(
    (b) =>
      b.buyerName?.toLowerCase().includes(search.toLowerCase()) ||
      b.company?.toLowerCase().includes(search.toLowerCase()) ||
      b.country?.toLowerCase().includes(search.toLowerCase())
  );

  const parseNum = (v: string) => Number(String(v).replace(/[^0-9.-]/g, "")) || 0;
  const active = selectedBuyer ?? filtered[0] ?? null;
  const activeReviews: Review[] = active ? (reviewsMap[active.id] ?? []) : [];

  const avgRating =
    activeReviews.length > 0
      ? activeReviews.reduce((s, r) => s + r.rating, 0) / activeReviews.length
      : null;

  const resolvedFormUrl = googleFormUrl || DEFAULT_GOOGLE_FORM_URL;
  const hasUserForm = !!googleFormUrl && !googleFormUrl.includes("YOUR_FORM_ID");
  const formUrl = active ? buildFormUrl(resolvedFormUrl, active.buyerName) : "#";

  const handleCopyLink = () => {
    if (!active) return;
    navigator.clipboard.writeText(formUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleAddReview = (r: Omit<Review, "id" | "date" | "source">) => {
    if (!active) return;
    const newReview: Review = {
      ...r,
      id: Date.now().toString(),
      date: new Date().toLocaleDateString(language === "ar" ? "ar-EG" : language === "zh" ? "zh-CN" : "en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
      source: "internal",
    };
    setReviewsMap((prev) => ({
      ...prev,
      [active.id]: [newReview, ...(prev[active.id] ?? [])],
    }));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            {t("buyerCrm", "title")}
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {t("buyerCrm", "subtitle")}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left: Buyer List ── */}
        <div className="lg:col-span-1 space-y-4">
          <div className="relative">
            <Search className={`absolute ${isRtl ? 'right-3.5' : 'left-3.5'} top-3 w-4 h-4 text-slate-400`} />
            <input
              type="text"
              placeholder={language === "en" ? "Search buyer CRM catalog..." : language === "hi" ? "कैटलॉग खोजें..." : language === "zh" ? "搜索客户目录..." : language === "ar" ? "البحث في دليل العملاء..." : "Cari katalog buyer..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              maxLength={100}
              className={`w-full ${isRtl ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder:text-slate-400 text-slate-800`}
            />
          </div>

          <div className="space-y-2">
            {filtered.map((b) => {
              const isActive = active?.id === b.id;
              const bReviews = reviewsMap[b.id] ?? [];
              const bAvg =
                bReviews.length > 0
                  ? bReviews.reduce((s, r) => s + r.rating, 0) /
                    bReviews.length
                  : null;
              return (
                <button
                  key={b.id}
                  onClick={() => setSelectedBuyer(b)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                    isActive
                      ? "bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-600/10"
                      : "bg-white border-slate-150 text-slate-800 hover:border-slate-300 card-shadow"
                  } ${isRtl ? 'text-right' : 'text-left'}`}
                >
                  <div>
                    <h3 className="text-xs font-black truncate max-w-[130px]">
                      {b.buyerName}
                    </h3>
                    <p
                      className={`text-[9px] font-bold mt-0.5 ${
                        isActive ? "text-indigo-200" : "text-slate-400"
                      }`}
                    >
                      {b.company}
                    </p>
                    {bAvg !== null && (
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                        <span
                          className={`text-[9px] font-black ${
                            isActive ? "text-amber-200" : "text-amber-600"
                          }`}
                        >
                          {bAvg.toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>
                  <span
                    className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {b.country}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Right: Buyer Detail ── */}
        <div className="lg:col-span-2">
          {active ? (
            <div className="bg-white p-6 rounded-3xl border border-slate-150 card-shadow space-y-6">
              {/* Profile header */}
              <div className="flex items-start justify-between flex-wrap gap-4 pb-4 border-b border-slate-100">
                <div className="flex gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-800 tracking-tight">
                      {active.buyerName}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold mt-0.5 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" />
                      {active.company} ({active.country})
                    </p>
                    {avgRating !== null && (
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <StarRating value={Math.round(avgRating)} size="sm" />
                        <span className="text-[10px] font-black text-amber-600">
                          {avgRating.toFixed(1)}
                        </span>
                        <span className="text-[9px] text-slate-400">
                          ({activeReviews.length} {language === "en" ? "reviews" : "ulasan"})
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Trust stars */}
                <div className="flex flex-col items-end">
                  <span className="text-[9px] font-bold text-slate-400 uppercase">
                    Trust Tier
                  </span>
                  <div className="flex gap-0.5 mt-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-3.5 h-3.5 ${
                          s <= active.trustLevel
                            ? "text-amber-500 fill-amber-500"
                            : "text-slate-200"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* ── Review Actions Banner ── */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between flex-wrap gap-3 w-full">
                  <div>
                    <p className="text-xs font-black text-slate-800">
                      {t("buyerCrm", "reviews")}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {t("buyerCrm", "shareGoogleForm")}
                    </p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {/* Open Google Form — with Google Forms logo */}
                    <a
                      href={formUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      id={`btn-open-form-${active.id}`}
                      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[10px] font-black shadow-sm transition-colors ${
                        !hasUserForm
                          ? "bg-slate-350 cursor-not-allowed opacity-50 pointer-events-none text-slate-500"
                          : "bg-slate-900 hover:bg-indigo-950 text-white"
                      }`}
                    >
                      <GoogleFormsIcon size={14} />
                      Google Form
                    </a>

                  {/* Copy shareable link — with Google Forms logo */}
                  <button
                    onClick={handleCopyLink}
                    disabled={!hasUserForm}
                    id={`btn-copy-link-${active.id}`}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[10px] font-black border transition-all cursor-pointer ${
                      !hasUserForm
                        ? "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed opacity-50"
                        : copied
                        ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-300"
                        : "bg-white dark:bg-slate-800 border-indigo-200 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/30"
                    }`}
                  >
                    {copied ? (
                      <>
                        <CheckCheck className="w-3.5 h-3.5" /> Link Copied!
                      </>
                    ) : (
                      <>
                        {language === "en" ? "Copy Link" : "Salin Link"}
                      </>
                    )}
                  </button>

                  {/* Internal add review */}
                  <button
                    onClick={() => setShowAddReview(true)}
                    id={`btn-add-review-${active.id}`}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-[10px] font-black shadow-sm border border-slate-200 transition-colors cursor-pointer"
                  >
                    <MessageSquarePlus className="w-3.5 h-3.5" />
                    {t("buyerCrm", "addReview")}
                  </button>
                </div>
              </div>

              {!hasUserForm && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-250 dark:border-amber-900/55 rounded-2xl flex items-start gap-2 animate-pulse">
                  <span className="text-xs">⚠️</span>
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-black text-amber-800 dark:text-amber-300">
                      {language === "en" ? "Google Form URL Not Configured" : "URL Google Form Belum Dikonfigurasi"}
                    </p>
                    <p className="text-[9px] text-amber-700 dark:text-amber-400 leading-relaxed">
                      {language === "en"
                        ? "Go to Settings to add your own Google Form URL so buyers can fill review forms directly."
                        : "Buka menu Settings untuk memasukkan URL Google Form Anda sendiri agar buyer dapat mengisi ulasan secara langsung."}
                    </p>
                  </div>
                </div>
              )}
            </div>

              {/* Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-3 bg-slate-50 dark:bg-slate-800 border border-slate-150 dark:border-slate-700 rounded-xl">
                  <span className="text-[9px] font-bold text-slate-400 dark:text-slate-400 uppercase">
                    {language === "en" ? "Lifetime Export Volume" : "Total Volume Ekspor"}
                  </span>
                  <p className="text-sm font-black text-slate-800 dark:text-slate-100 mt-0.5">
                    {active.totalVolume}
                  </p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800 border border-slate-150 dark:border-slate-700 rounded-xl">
                  <span className="text-[9px] font-bold text-slate-400 dark:text-slate-400 uppercase">
                    {language === "en" ? "Payment Consistency" : "Konsistensi Pembayaran"}
                  </span>
                  <div className="mt-1">
                    <span className="inline-flex items-center text-[10px] font-bold px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300">
                      {active.paymentHistory === "Excellent" ? (language === "en" ? "Excellent" : "Sempurna") : active.paymentHistory === "Good" ? (language === "en" ? "Good" : "Baik") : (language === "en" ? "Fair" : "Cukup")}
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800 border border-slate-150 dark:border-slate-700 rounded-xl">
                  <span className="text-[9px] font-bold text-slate-400 dark:text-slate-400 uppercase">
                    {language === "en" ? "Contract Terms Preference" : "Preferensi Kontrak"}
                  </span>
                  <p className="text-xs font-black text-indigo-600 dark:text-indigo-400 mt-0.5">
                    {active.preferences}
                  </p>
                </div>
              </div>

              {/* Preferred products */}
              <div className="space-y-1.5">
                <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">
                  {language === "en" ? "Preferred Products" : "Produk Favorit"}
                </span>
                <div className="flex gap-1.5 flex-wrap">
                  {active.preferredProducts?.map((p: string) => (
                    <span
                      key={p}
                      className="text-[10px] font-bold bg-slate-100 border border-slate-200 px-3 py-1 rounded-xl text-slate-600"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </div>

              {/* Relationship log */}
              {active.communicationNotes && (
                <div className="space-y-1.5">
                  <span className="text-[9px] font-black uppercase text-slate-400 dark:text-indigo-400 tracking-wider">
                    Relationship Supervisor Log
                  </span>
                  <p className="text-[11px] leading-relaxed text-slate-600 dark:text-indigo-200 font-semibold bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-800/50 p-4 rounded-2xl italic">
                    &ldquo;{active.communicationNotes}&rdquo;
                  </p>
                </div>
              )}

              {/* ── Reviews Section ── */}
              <div className="space-y-3">
                <button
                  onClick={() => setShowReviews((v) => !v)}
                  className="w-full flex items-center justify-between text-[9px] font-black uppercase text-slate-400 tracking-wider cursor-pointer hover:text-slate-600 transition-colors"
                >
                  <span>
                    {t("buyerCrm", "reviews")}{" "}
                    {activeReviews.length > 0 && (
                      <span className="bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full text-[8px] font-black ml-1">
                        {activeReviews.length}
                      </span>
                    )}
                  </span>
                  {showReviews ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>

                {showReviews && (
                  <>
                    {activeReviews.length === 0 ? (
                      <div className="border border-dashed border-slate-200 rounded-2xl p-8 text-center">
                        <MessageSquarePlus className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                        <p className="text-[11px] text-slate-400 font-semibold">
                          {t("buyerCrm", "reviewsPlaceholder")}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {activeReviews.map((r) => (
                          <div
                            key={r.id}
                            className="p-4 bg-slate-50 border border-slate-150 rounded-2xl space-y-2 text-slate-800"
                          >
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white font-black text-[9px]">
                                  {r.reviewer
                                    .split(" ")
                                    .map((w) => w[0])
                                    .join("")
                                    .slice(0, 2)
                                    .toUpperCase()}
                                </div>
                                <div>
                                  <p className="text-[10px] font-black text-slate-700">
                                    {r.reviewer}
                                  </p>
                                  <p className="text-[9px] text-slate-400">
                                    {r.date} ·{" "}
                                    <span
                                      className={`font-bold ${
                                        r.source === "internal"
                                          ? "text-indigo-500"
                                          : "text-emerald-500"
                                      }`}
                                    >
                                      {r.source === "internal"
                                        ? "Internal"
                                        : "Google Form"}
                                    </span>
                                  </p>
                                </div>
                              </div>
                              <StarRating value={r.rating} size="sm" />
                            </div>
                            <p className="text-[11px] leading-relaxed text-slate-600 font-medium italic">
                              &ldquo;{r.comment}&rdquo;
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Transaction History */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">
                    {language === "en" ? "Past Export Bookings" : "Riwayat Kontrak Ekspor"}
                  </span>
                  <button
                    onClick={() => setShowAddBooking(true)}
                    className="px-3 py-1 bg-slate-900 dark:bg-slate-800 hover:bg-indigo-950 dark:hover:bg-slate-700 text-white font-extrabold text-[9px] rounded-lg shadow-sm cursor-pointer transition-colors uppercase tracking-wider flex items-center gap-1"
                  >
                    + Add Booking
                  </button>
                </div>
                <div className="border border-slate-150 dark:border-slate-800 rounded-2xl overflow-hidden card-shadow">
                  <table className="w-full text-left border-collapse text-[10px] font-bold">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-150 dark:border-slate-700 text-slate-400">
                        <th className="px-4 py-2.5 uppercase font-bold tracking-wider">
                          {language === "en" ? "Date" : "Tanggal"}
                        </th>
                        <th className="px-4 py-2.5 uppercase font-bold tracking-wider">
                          {language === "en" ? "Product" : "Produk"}
                        </th>
                        <th className="px-4 py-2.5 uppercase font-bold tracking-wider">
                          {language === "en" ? "Volume" : "Volume"}
                        </th>
                        <th className="px-4 py-2.5 uppercase font-bold tracking-wider text-center text-slate-400">
                          Incoterms
                        </th>
                        <th className="px-4 py-2.5 uppercase font-bold tracking-wider text-right text-slate-400 dark:text-slate-400">
                          {language === "en" ? "Value" : "Nilai"}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-slate-700 dark:text-slate-300">
                      {active.dealHistory?.map((deal: any, i: number) => {
                        return (
                        <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                          <td className="px-4 py-2.5">{deal.date}</td>
                          <td className="px-4 py-2.5 text-slate-900 dark:text-slate-100 font-extrabold">
                            {deal.product}
                          </td>
                          <td className="px-4 py-2.5">{deal.quantity}</td>
                          <td className="px-4 py-2.5 text-center">
                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                              deal.incoterms === "CIF"
                                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-900/30"
                                : "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-100 dark:border-blue-900/30"
                            }`}>
                              {deal.incoterms || "FOB"}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-right text-indigo-600 dark:text-indigo-400 font-bold">
                            {deal.value}
                          </td>
                        </tr>
                      );})}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl p-12 text-center card-shadow">
              <p className="text-xs text-slate-400">
                {t("buyerCrm", "noBuyers")}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Add Review Modal */}
      {showAddReview && active && (
        <AddReviewPanel
          buyerName={active.buyerName}
          onClose={() => setShowAddReview(false)}
          onSubmit={handleAddReview}
        />
      )}

      {/* Add Booking Modal */}
      {showAddBooking && active && (
        <div className="fixed inset-0 bg-slate-955/50 dark:bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md shadow-2xl border border-slate-150 dark:border-slate-800 overflow-hidden animate-scale-up">
            <div className="bg-gradient-to-tr from-slate-900 to-indigo-950 p-5 flex items-start justify-between">
              <div>
                <h3 className="text-sm font-black text-white tracking-wide uppercase">
                  {language === "en" ? "Add Past Export Booking" : "Tambah Kontrak Ekspor"}
                </h3>
                <p className="text-[10px] text-indigo-200 mt-0.5">
                  {language === "en" ? "Record deals for" : "Catat transaksi untuk"} <span className="font-black text-white">{active.buyerName}</span>
                </p>
              </div>
              <button
                onClick={() => setShowAddBooking(false)}
                className="text-indigo-300 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddBookingSubmit} className="p-6 space-y-4 text-slate-800 dark:text-slate-200">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    {language === "en" ? "Booking Date" : "Tanggal"}
                  </label>
                  <input
                    type="date"
                    required
                    value={newBooking.date}
                    onChange={(e) => setNewBooking({ ...newBooking, date: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-250 dark:border-slate-700 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    {language === "en" ? "Incoterms" : "Incoterms"}
                  </label>
                  <select
                    value={newBooking.incoterms}
                    onChange={(e) => setNewBooking({ ...newBooking, incoterms: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-250 dark:border-slate-700 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                  >
                    <option value="FOB">FOB</option>
                    <option value="CIF">CIF</option>
                    <option value="CFR">CFR</option>
                    <option value="FAS">FAS</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  {language === "en" ? "Product Name" : "Nama Produk"}
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Nutmeg ABCD / Cloves Lal Pari"
                  value={newBooking.product}
                  onChange={(e) => setNewBooking({ ...newBooking, product: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-250 dark:border-slate-700 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    {language === "en" ? "Volume" : "Volume"}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 15 MT"
                    value={newBooking.quantity}
                    onChange={(e) => setNewBooking({ ...newBooking, quantity: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-250 dark:border-slate-700 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    {language === "en" ? "Value" : "Nilai Kontrak"}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. $127,500"
                    value={newBooking.value}
                    onChange={(e) => setNewBooking({ ...newBooking, value: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-250 dark:border-slate-700 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddBooking(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-250 dark:border-slate-700 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                >
                  {t("common", "cancel")}
                </button>
                <button
                  type="submit"
                  disabled={addingBooking}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md cursor-pointer transition-colors flex items-center justify-center gap-1.5"
                >
                  {addingBooking ? (
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  ) : null}
                  {language === "en" ? "Save Booking" : "Simpan Kontrak"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
