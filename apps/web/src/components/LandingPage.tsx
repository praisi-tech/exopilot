"use client";

import React, { useState } from "react";
import {
  Globe, Ship, FileText, TrendingUp, Users, MessageSquare,
  ChevronRight, Zap, ShieldCheck, BarChart3, ArrowRight,
  Star, Package, Anchor, Calculator, RefreshCw, Sparkles,
  Sun, Moon,
} from "lucide-react";
import { useTheme } from "@/lib/ThemeContext";
import { useLanguage, LanguageCode } from "@/lib/LanguageContext";

const LANG_INFO = {
  id: { flag: "🇮🇩", label: "ID", name: "Bahasa Indonesia" },
  en: { flag: "🇬🇧", label: "EN", name: "English" },
  hi: { flag: "🇮🇳", label: "HI", name: "हिन्दी" },
  zh: { flag: "🇨🇳", label: "ZH", name: "中文" },
  ar: { flag: "🇦🇪", label: "AR", name: "العربية" },
};

interface LandingPageProps {
  onGetStarted: () => void;
  onSignIn: () => void;
}

const FEATURES = [
  {
    icon: MessageSquare,
    titleKey: "featInquiryTitle",
    descKey: "featInquiryDesc",
    color: "from-blue-500 to-indigo-600",
    bg: "bg-blue-50",
    iconColor: "text-blue-600",
  },
  {
    icon: Ship,
    titleKey: "featShipmentTitle",
    descKey: "featShipmentDesc",
    color: "from-emerald-500 to-teal-600",
    bg: "bg-emerald-50",
    iconColor: "text-emerald-600",
  },
  {
    icon: FileText,
    titleKey: "featDocTitle",
    descKey: "featDocDesc",
    color: "from-violet-500 to-purple-600",
    bg: "bg-violet-50",
    iconColor: "text-violet-600",
  },
  {
    icon: TrendingUp,
    titleKey: "featPriceTitle",
    descKey: "featPriceDesc",
    color: "from-amber-500 to-orange-600",
    bg: "bg-amber-50",
    iconColor: "text-amber-600",
  },
  {
    icon: Users,
    titleKey: "featCrmTitle",
    descKey: "featCrmDesc",
    color: "from-rose-500 to-pink-600",
    bg: "bg-rose-50",
    iconColor: "text-rose-600",
  },
  {
    icon: Anchor,
    titleKey: "featSupplierTitle",
    descKey: "featSupplierDesc",
    color: "from-slate-500 to-slate-700",
    bg: "bg-slate-50",
    iconColor: "text-slate-600",
  },
];

const STEPS = [
  {
    num: "01",
    titleKey: "step1Title",
    descKey: "step1Desc",
    icon: Globe,
  },
  {
    num: "02",
    titleKey: "step2Title",
    descKey: "step2Desc",
    icon: Package,
  },
  {
    num: "03",
    titleKey: "step3Title",
    descKey: "step3Desc",
    icon: Sparkles,
  },
];

const STATS = [
  { value: "500+", labelKey: "statExporters" },
  { value: "$2M+", labelKey: "statPipeline" },
  { value: "10k+", labelKey: "statDocs" },
  { value: "98%", labelKey: "statSatisfaction" },
];

const TESTIMONIALS = [
  {
    name: "Ahmad Fauzi",
    role: "PT Rempah Nusantara Abadi",
    textKey: "review1Text",
    rating: 5,
  },
  {
    name: "Siti Rahayu",
    role: "CV Agro Mandiri Export",
    textKey: "review2Text",
    rating: 5,
  },
  {
    name: "Budi Santoso",
    role: "UD Spice International",
    textKey: "review3Text",
    rating: 5,
  },
];

export function LandingPage({ onGetStarted, onSignIn }: LandingPageProps) {
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t, isRtl } = useLanguage();
  const [showLangDropdown, setShowLangDropdown] = useState(false);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-x-hidden" dir={isRtl ? "rtl" : "ltr"}>
      {/* ── Navigation ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl border-b border-slate-100/80 dark:border-slate-800/80 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-center relative">
          {/* Logo */}
          <div className="absolute left-4 sm:left-6 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center shadow-md shadow-blue-500/25">
              <img src="/logo.png" alt="Exopilot" className="w-8 h-8 object-contain" />
            </div>
            <span className="font-black text-slate-900 dark:text-slate-100 text-base sm:text-lg tracking-tight">Exopilot</span>
          </div>

          {/* Nav links — centered */}
          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-500 dark:text-slate-400">
            <a href="#features" className="hover:text-slate-900 dark:hover:text-slate-200 transition-colors">{t("landing", "navFeatures")}</a>
            <a href="#how-it-works" className="hover:text-slate-900 dark:hover:text-slate-200 transition-colors">{t("landing", "navHowItWorks")}</a>
            <a href="#testimonials" className="hover:text-slate-900 dark:hover:text-slate-200 transition-colors">{t("landing", "navReviews")}</a>
          </div>

          {/* CTA Buttons */}
          <div className="absolute right-4 sm:right-6 flex items-center gap-1.5 sm:gap-2">
            {/* Language Switcher */}
            <div className="relative">
              <button
                onClick={() => setShowLangDropdown(!showLangDropdown)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-305 hover:text-[#1d4ed8] dark:hover:text-blue-400 cursor-pointer transition-all text-xs font-bold shrink-0"
              >
                <Globe className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{LANG_INFO[language].flag} {LANG_INFO[language].label}</span>
                <span className="sm:hidden">{LANG_INFO[language].flag}</span>
              </button>
              {showLangDropdown && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowLangDropdown(false)} />
                  <div className={`absolute ${isRtl ? "left-0" : "right-0"} mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-xl z-50 py-1.5 animate-scale-up`}>
                    {Object.entries(LANG_INFO).map(([code, info]) => (
                      <button
                        key={code}
                        onClick={() => { setLanguage(code as LanguageCode); setShowLangDropdown(false); }}
                        className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold transition-colors cursor-pointer ${language === code
                            ? "bg-indigo-50 dark:bg-indigo-950/45 text-[#1d4ed8] dark:text-blue-400"
                            : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                          } ${isRtl ? "text-right" : "text-left"}`}
                      >
                        <span className="text-base">{info.flag}</span>
                        <span className="flex-1">{info.name}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 cursor-pointer transition-colors flex-shrink-0"
              title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
            >
              {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>
            {/* Sign In — hidden on extra-small screens */}
            <button
              onClick={onSignIn}
              className="hidden sm:block px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 transition-colors cursor-pointer"
            >
              {t("landing", "navSignIn")}
            </button>
            <button
              onClick={onGetStarted}
              className="px-3 sm:px-4 py-2 rounded-xl bg-[#1d4ed8] hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer whitespace-nowrap"
            >
              <span>{t("landing", "navGetStarted")}</span>
            </button>
          </div>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <section className="pt-28 sm:pt-32 pb-16 sm:pb-20 px-4 sm:px-6 relative overflow-hidden">
        {/* Background elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 right-0 w-[600px] h-[600px] rounded-full bg-blue-50/70 dark:bg-blue-950/30 blur-3xl -translate-y-1/4 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-indigo-50/60 dark:bg-indigo-950/30 blur-3xl translate-y-1/4 -translate-x-1/4" />
        </div>

        <div className="max-w-7xl mx-auto relative">
          <div className="max-w-3xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-1.5 sm:gap-2 bg-blue-50 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-800 text-blue-700 dark:text-blue-400 text-[10px] sm:text-xs font-bold px-3 sm:px-4 py-1.5 sm:py-2 rounded-full mb-5 sm:mb-6 animate-fade-in">
              <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
              <span>{t("landing", "heroBadge")}</span>
            </div>

            {/* Headline */}
            <h1 className="text-[2rem] sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white leading-tight tracking-tight mb-5 sm:mb-6 animate-fade-in">
              {language === "en" && "The"}{" "}
              <span className="text-[#1d4ed8] dark:text-blue-400 relative">
                {t("landing", "heroTitleHighlight")}
                <svg className="absolute -bottom-1 left-0 w-full" height="6" viewBox="0 0 300 6" fill="none">
                  <path d="M0 5 Q75 0 150 5 Q225 10 300 5" stroke="#93c5fd" className="dark:stroke-blue-400" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                </svg>
              </span>{" "}
              {t("landing", "heroTitlePart2")}
            </h1>

            {/* Subheadline */}
            <p className="text-base sm:text-lg text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-2xl mx-auto mb-8 sm:mb-10 animate-fade-in">
              {t("landing", "heroSubtitle")}
            </p>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 animate-fade-in">
              <button
                onClick={onGetStarted}
                id="hero-get-started"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#1d4ed8] hover:bg-blue-700 active:scale-[0.98] text-white font-black text-sm shadow-xl shadow-blue-500/25 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4" />
                {t("landing", "heroGetStarted")}
                <ArrowRight className="w-4 h-4 flex-shrink-0" />
              </button>
              <button
                onClick={onSignIn}
                id="hero-sign-in"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl border-2 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-300 font-black text-sm transition-all cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                {t("landing", "heroSignIn")}
              </button>
            </div>
          </div>

          {/* Dashboard Preview */}
          <div className="mt-12 sm:mt-16 relative max-w-5xl mx-auto animate-slide-in-up">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl shadow-slate-200/80 dark:shadow-slate-950/80 overflow-hidden">
              {/* Mock browser bar */}
              <div className="bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 px-3 sm:px-4 py-2.5 sm:py-3 flex items-center gap-1.5 sm:gap-2">
                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-rose-300" />
                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-amber-300" />
                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-emerald-300" />
                <div className="flex-1 mx-2 sm:mx-4 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-2 sm:px-3 py-1 sm:py-1.5 text-[8px] sm:text-[10px] text-slate-400 dark:text-slate-500 font-mono truncate">
                  app.exopilot.id/dashboard
                </div>
              </div>
              {/* Mock dashboard */}
              <div className="p-3 sm:p-6 bg-[#f0f6ff] dark:bg-slate-800/50">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-3 sm:mb-4">
                  {[
                    { labelKey: "mockActiveInquiries", val: "24", color: "text-blue-700 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-950/50" },
                    { labelKey: "mockLiveShipments", val: "8", color: "text-emerald-700 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/50" },
                    { labelKey: "mockPipelineValue", val: "$284K", color: "text-violet-700 dark:text-violet-400", bg: "bg-violet-50 dark:bg-violet-950/50" },
                    { labelKey: "mockSuppliers", val: "12", color: "text-amber-700 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/50" },
                  ].map((s) => (
                    <div key={s.labelKey} className={`${s.bg} rounded-xl p-2 sm:p-3 border border-white/80 dark:border-slate-700`}>
                      <p className="text-[7px] sm:text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase leading-tight">{t("landing", s.labelKey)}</p>
                      <p className={`text-base sm:text-xl font-black ${s.color} mt-0.5 sm:mt-1`}>{s.val}</p>
                    </div>
                  ))}
                </div>
                {/* Bottom panels — stack on mobile, side-by-side on sm+ */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                  <div className="sm:col-span-2 bg-white dark:bg-slate-900 rounded-xl p-3 sm:p-4 border border-slate-100 dark:border-slate-700">
                    <p className="text-[8px] sm:text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase mb-2 sm:mb-3">{t("landing", "mockRecentInquiries")}</p>
                    {[
                      { name: "Klausen Spice GmbH", country: language === "ar" ? "🇩🇪 ألمانيا" : language === "hi" ? "🇩🇪 जर्मनी" : language === "zh" ? "🇩🇪 德国" : "🇩🇪 Germany", status: language === "ar" ? "تفاوض" : language === "hi" ? "बातचीत" : language === "zh" ? "谈判中" : language === "id" ? "Negosiasi" : "Negotiating", color: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400" },
                      { name: "Tokyo Herbs Co.", country: language === "ar" ? "🇯🇵 اليابان" : language === "hi" ? "🇯🇵 जापान" : language === "zh" ? "🇯🇵 日本" : "🇯🇵 Japan", status: language === "ar" ? "صفقة مغلقة" : language === "hi" ? "सौदा बंद" : language === "zh" ? "已成交" : language === "id" ? "Deal Selesai" : "Closed Deal", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400" },
                      { name: "Al Salam Trading", country: language === "ar" ? "🇦🇪 الإمارات" : language === "hi" ? "🇦🇪 यूएई" : language === "zh" ? "🇦🇪 阿联酋" : "🇦🇪 UAE", status: language === "ar" ? "استفسار جديد" : language === "hi" ? "नई पूछताछ" : language === "zh" ? "新询盘" : language === "id" ? "Inquiry Baru" : "New Inquiry", color: "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400" },
                    ].map((row) => (
                      <div key={row.name} className="flex items-center justify-between py-1.5 border-b border-slate-50 dark:border-slate-700 last:border-0">
                        <div className={isRtl ? "text-right" : "text-left"}>
                          <p className="text-[10px] font-bold text-slate-700 dark:text-slate-200">{row.name}</p>
                          <p className="text-[9px] text-slate-400 dark:text-slate-500">{row.country}</p>
                        </div>
                        <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ml-2 ${row.color}`}>{row.status}</span>
                      </div>
                    ))}
                  </div>
                  <div className="bg-white dark:bg-slate-900 rounded-xl p-3 sm:p-4 border border-slate-100 dark:border-slate-700">
                    <p className="text-[8px] sm:text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase mb-2 sm:mb-3">{t("landing", "mockMarketPrices")}</p>
                    {[
                      { name: language === "ar" ? "جوزة الطيب" : language === "hi" ? "जायफल" : language === "zh" ? "肉豆蔻" : language === "id" ? "Pala" : "Nutmeg", price: "$8,500", up: true },
                      { name: language === "ar" ? "قرنفل" : language === "hi" ? "लौंग" : language === "zh" ? "丁香" : language === "id" ? "Cengkih" : "Cloves", price: "$4,200", up: false },
                      { name: language === "ar" ? "قشرة جوزة الطيب" : language === "hi" ? "जावित्री" : language === "zh" ? "肉豆蔻皮" : language === "id" ? "Fuli" : "Mace", price: "$12,000", up: true },
                    ].map((c) => (
                      <div key={c.name} className="flex items-center justify-between py-1.5 border-b border-slate-50 dark:border-slate-700 last:border-0">
                        <p className="text-[9px] font-bold text-slate-600 dark:text-slate-300">{c.name}</p>
                        <span className={`text-[9px] font-black ${c.up ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500 dark:text-rose-400"}`}>
                          {c.up ? "▲" : "▼"} {c.price}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            {/* Glow effect */}
            <div className="absolute -inset-4 bg-blue-500/10 rounded-3xl blur-2xl -z-10" />
          </div>
        </div>
      </section>

      {/* ── Stats Strip ── */}
      <section className="py-10 sm:py-12 bg-[#1d4ed8] dark:bg-blue-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8 text-center">
            {STATS.map((stat) => (
              <div key={stat.labelKey}>
                <p className="text-2xl sm:text-3xl font-black text-white">{stat.value}</p>
                <p className="text-blue-200 dark:text-blue-300 text-xs sm:text-sm font-medium mt-1">{t("landing", stat.labelKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features Section ── */}
      <section id="features" className="py-16 sm:py-24 px-4 sm:px-6 bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-16">
            <p className="text-xs font-black tracking-widest uppercase text-blue-600 dark:text-blue-400 mb-3">{t("landing", "featuresSub")}</p>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white leading-tight">
              {t("landing", "featuresTitle")}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-base mt-4 leading-relaxed">
              {t("landing", "featuresDesc")}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.titleKey}
                  className="group p-6 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-blue-100 dark:hover:border-blue-900 hover:shadow-lg hover:shadow-blue-50/80 dark:hover:shadow-blue-950/50 transition-all duration-200 cursor-default bg-white dark:bg-slate-900"
                >
                  <div className={`w-11 h-11 ${f.bg} dark:bg-slate-800 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200`}>
                    <Icon className={`w-5 h-5 ${f.iconColor}`} strokeWidth={2} />
                  </div>
                  <h3 className="font-black text-slate-900 dark:text-slate-100 text-sm mb-2">{t("landing", f.titleKey)}</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">{t("landing", f.descKey)}</p>
                </div>
              );
            })}
          </div>

          {/* Extra tool pills */}
          <div className="mt-10 flex flex-wrap justify-center gap-2">
            {[
              { icon: Calculator, labelKey: "pillCalculator" },
              { icon: RefreshCw, labelKey: "pillConverter" },
              { icon: BarChart3, labelKey: "pillNotes" },
              { icon: ShieldCheck, labelKey: "pillSecure" },
            ].map((tItem) => {
              const Icon = tItem.icon;
              return (
                <div key={tItem.labelKey} className="flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800">
                  <Icon className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                  {t("landing", tItem.labelKey)}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="py-16 sm:py-24 px-4 sm:px-6 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-16">
            <p className="text-xs font-black tracking-widest uppercase text-blue-600 dark:text-blue-400 mb-3">{t("landing", "howSub")}</p>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white leading-tight">
              {t("landing", "howTitle")}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-8">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={step.num} className="relative">
                  {/* Connector line */}
                  {i < STEPS.length - 1 && (
                    <div className="hidden md:block absolute top-8 left-full w-full h-px bg-gradient-to-r from-blue-200 dark:from-blue-800 to-transparent -translate-x-1/2 z-0" />
                  )}
                  <div className="relative z-10 bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-3xl font-black text-slate-100 dark:text-slate-700">{step.num}</span>
                      <div className="w-10 h-10 rounded-xl bg-[#1d4ed8] dark:bg-blue-600 flex items-center justify-center shadow-md shadow-blue-500/20">
                        <Icon className="w-5 h-5 text-white" strokeWidth={2} />
                      </div>
                    </div>
                    <h3 className="font-black text-slate-900 dark:text-slate-100 text-sm mb-2">{t("landing", step.titleKey)}</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">{t("landing", step.descKey)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section id="testimonials" className="py-16 sm:py-24 px-4 sm:px-6 bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-16">
            <p className="text-xs font-black tracking-widest uppercase text-blue-600 dark:text-blue-400 mb-3">{t("landing", "reviewSub")}</p>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white leading-tight">
              {t("landing", "reviewTitle")}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((tItem, i) => (
              <div
                key={tItem.name}
                onClick={() => setActiveTestimonial(i)}
                className={`p-6 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${activeTestimonial === i
                    ? "border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/40 shadow-lg shadow-blue-100/60 dark:shadow-blue-950/40"
                    : "border-slate-100 dark:border-slate-800 hover:border-blue-100 dark:hover:border-blue-900 bg-white dark:bg-slate-900"
                  }`}
              >
                {/* Stars */}
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: tItem.rating }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-5">"{t("landing", tItem.textKey)}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-black">
                    {tItem.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                  </div>
                  <div className={isRtl ? "text-right" : "text-left"}>
                    <p className="text-xs font-black text-slate-800 dark:text-slate-200">{tItem.name}</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{tItem.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 bg-[#0f172a] dark:bg-slate-950 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-blue-600/10 blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full bg-indigo-600/10 blur-3xl" />
        </div>
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white leading-tight mb-4">
            {t("landing", "ctaTitle")}
          </h2>
          <p className="text-slate-400 dark:text-slate-500 text-base mb-10 leading-relaxed">
            {t("landing", "ctaDesc")}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={onGetStarted}
              id="final-cta-get-started"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#1d4ed8] hover:bg-blue-600 text-white font-black text-sm shadow-2xl shadow-blue-500/30 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4" />
              {t("landing", "ctaGetStarted")}
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={onSignIn}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl border border-slate-700 hover:border-slate-500 text-slate-300 dark:text-slate-400 font-bold text-sm transition-all cursor-pointer hover:bg-slate-800"
            >
              {t("landing", "ctaAlreadyAccount")}
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-8 px-4 sm:px-6 bg-[#0f172a] dark:bg-slate-950 border-t border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg overflow-hidden flex items-center justify-center">
              <img src="/logo.png" alt="Exopilot" className="w-7 h-7 object-contain" />
            </div>
            <span className="font-black text-white text-sm">Exopilot</span>
            <span className="text-slate-600 dark:text-slate-500 text-xs">© 2026</span>
          </div>
          <p className="text-slate-600 dark:text-slate-500 text-xs text-center sm:text-right">
            {t("landing", "footerSubtitle")}
            <span className="hidden sm:inline"> · {t("landing", "footerBuiltBy")}</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
