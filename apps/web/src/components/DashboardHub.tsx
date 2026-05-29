"use client";

import React from "react";
import {
  MessageSquare,
  Users,
  Ship,
  FileText,
  DollarSign,
  Bell,
  ChevronRight,
  Plus,
  TrendingUp,
  Anchor,
  ArrowUpRight,
  ArrowDownRight,
  Package,
} from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";

interface DashboardHubProps {
  summary: {
    totalInquiries: number;
    activeShipments: number;
    closedDeals: number;
    pipelineValue: string;
    sourcingSuppliers: number;
    monthlyIncreaseRate: string;
    followUpsDueToday: number;
    activeCommodities: number;
  };
  inquiries: any[];
  shipments: any[];
  commodityPrices: any[];
  onAddInquiry: () => void;
  onNavigate: (tab: string) => void;
  userName: string;
}

export function DashboardHub({
  summary,
  inquiries,
  shipments,
  commodityPrices,
  onAddInquiry,
  onNavigate,
  userName,
}: DashboardHubProps) {
  const { t, language } = useLanguage();

  /* ── First name ── */
  const safeUserName = userName ?? "";
  const firstName = safeUserName.split(" ")[0] || safeUserName || "There";

  /* ── Time-based greeting ── */
  const hour = new Date().getHours();
  const greeting =
    hour < 12
      ? language === "id" ? "Selamat Pagi" : language === "hi" ? "सुप्रभात" : language === "zh" ? "早上好" : language === "ar" ? "صباح الخير" : "Good Morning"
      : hour < 17
      ? language === "id" ? "Selamat Siang" : language === "hi" ? "नमस्ते" : language === "zh" ? "下午好" : language === "ar" ? "مساء الخير" : "Good Afternoon"
      : language === "id" ? "Selamat Malam" : language === "hi" ? "शुभ संध्या" : language === "zh" ? "晚上好" : language === "ar" ? "مساء الخير" : "Good Evening";

  const notifLabel =
    language === "en" ? "Recent Activity" :
    language === "hi" ? "हालिया गतिविधि" :
    language === "zh" ? "最近活动" :
    language === "ar" ? "النشاط الأخير" :
    "Aktivitas Terkini";

  /* ── Quick actions ── */
  const quickActions = [
    { label: t("common", "inquiries"),     tab: "inquiries",          icon: MessageSquare },
    { label: t("common", "buyer-crm"),     tab: "buyer-crm",          icon: Users         },
    { label: t("common", "shipments"),     tab: "shipments",          icon: Ship          },
    { label: t("common", "doc-generator"), tab: "doc-generator",      icon: FileText      },
  ];

  /* ── Recent activity ── */
  const notifications: {
    id: string; icon: React.ElementType;
    title: string; desc: string; tab: string; time: string;
  }[] = [
    ...inquiries.slice(0, 2).map((inq: any) => ({
      id: inq.id, icon: MessageSquare,
      title: inq.buyerName,
      desc: `${inq.product} · ${inq.country}`,
      tab: "inquiries", time: "Now",
    })),
    ...shipments.slice(0, 1).map((sh: any) => ({
      id: sh.id, icon: Ship,
      title: sh.containerNumber,
      desc: `${sh.status} · ETA ${sh.eta}`,
      tab: "shipments", time: "Active",
    })),
    ...commodityPrices.slice(0, 1).map((c: any) => ({
      id: c.commodity, icon: TrendingUp,
      title: c.commodity,
      desc: `$${c.currentPrice.toLocaleString()} / ${c.unit}`,
      tab: "commodities", time: "Live",
    })),
  ].slice(0, 4);

  /* ── Stat cards ── */
  const stats = [
    {
      label: t("dashboard", "totalInquiries"),
      value: summary.totalInquiries,
      icon: MessageSquare,
      tab: "inquiries",
      sub: summary.followUpsDueToday > 0
        ? `${summary.followUpsDueToday} follow-up today`
        : t("dashboard", "followUps"),
      trend: "+12%",
      up: true,
    },
    {
      label: t("dashboard", "activeShipments"),
      value: summary.activeShipments,
      icon: Ship,
      tab: "shipments",
      sub: t("shipments", "activeTab"),
      trend: "+3",
      up: true,
    },
    {
      label: t("dashboard", "pipelineValue"),
      value: summary.pipelineValue,
      icon: DollarSign,
      tab: "inquiries",
      sub: `${summary.monthlyIncreaseRate} ${t("dashboard", "monthlyIncrease")}`,
      trend: summary.monthlyIncreaseRate,
      up: true,
    },
    {
      label: t("dashboard", "suppliers"),
      value: summary.sourcingSuppliers,
      icon: Anchor,
      tab: "suppliers",
      sub: t("suppliers", "totalSuppliers"),
      trend: "Stable",
      up: null,
    },
  ];

  return (
    <div className="space-y-4 animate-fade-in">

      {/* ══════════════════════════════════════════
          GREETING BANNER — mobile-first compact
      ══════════════════════════════════════════ */}
      <div className="bg-white rounded-2xl overflow-hidden relative">
        {/* Soft decorative blobs — hidden on very small screens to avoid clutter */}
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-blue-50/80 pointer-events-none hidden sm:block" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-indigo-50/50 pointer-events-none hidden sm:block" />

        <div className="relative z-10 p-5 sm:p-8">
          {/* Top row: greeting + CTA */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold text-slate-400 tracking-widest uppercase">
                {greeting} ✦
              </p>
              <h1 className="text-2xl sm:text-[2.2rem] font-black text-slate-900 mt-0.5 leading-tight tracking-tight font-display truncate">
                Hi, {firstName}!
              </h1>
              <p className="text-xs text-slate-400 mt-1 font-medium hidden sm:block">
                {t("dashboard", "bannerDesc")}
              </p>
            </div>

            {/* CTA — always visible, compact on mobile */}
            <button
              onClick={onAddInquiry}
              className="shrink-0 bg-[#1d4ed8] hover:bg-blue-700 active:scale-95 text-white px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl text-[11px] font-black shadow-lg shadow-blue-500/20 flex items-center gap-1.5 cursor-pointer transition-all duration-150 whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">{t("dashboard", "logNewInquiry")}</span>
              <span className="xs:hidden">New</span>
            </button>
          </div>

          {/* Quick Action Pills — horizontally scrollable on mobile */}
          <div className="mt-5 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.tab}
                  onClick={() => onNavigate(action.tab)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#eff6ff] hover:bg-brand-blue-light active:scale-95 text-[#1d4ed8] text-[10px] font-bold whitespace-nowrap cursor-pointer transition-all duration-150 shrink-0 border border-[#bfdbfe]/40"
                >
                  <Icon className="w-3 h-3 shrink-0" strokeWidth={2.2} />
                  {action.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          STAT CARDS — 2×2 on mobile, 4-col on lg
      ══════════════════════════════════════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div
              key={i}
              onClick={() => onNavigate(stat.tab)}
              className="bg-white rounded-2xl p-4 cursor-pointer hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 group border border-slate-100/80 hover:border-[#bfdbfe]/60 hover:shadow-md"
            >
              {/* Icon row */}
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-xl bg-[#eff6ff] flex items-center justify-center group-hover:scale-105 transition-transform duration-150 shrink-0">
                  <Icon className="w-4 h-4 text-[#1d4ed8]" strokeWidth={1.85} />
                </div>
                {stat.up !== null ? (
                  <span className={`flex items-center gap-0.5 text-[9px] font-black px-1.5 py-0.5 rounded-full ${
                    stat.up ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                  }`}>
                    {stat.up
                      ? <ArrowUpRight className="w-2.5 h-2.5" />
                      : <ArrowDownRight className="w-2.5 h-2.5" />}
                    {stat.trend}
                  </span>
                ) : (
                  <span className="text-[9px] font-bold text-slate-300 px-1.5 py-0.5 rounded-full bg-slate-50">
                    {stat.trend}
                  </span>
                )}
              </div>

              {/* Value */}
              <p className="text-xl sm:text-2xl font-black text-slate-900 leading-none font-display">
                {stat.value}
              </p>
              {/* Label */}
              <p className="text-[10px] text-slate-500 font-semibold mt-1 leading-snug">
                {stat.label}
              </p>
              {/* Sub */}
              <p className="text-[9px] text-slate-400 font-medium mt-1 truncate hidden sm:block">
                {stat.sub}
              </p>
            </div>
          );
        })}
      </div>

      {/* ══════════════════════════════════════════
          BOTTOM ROW: Activity feed + Market strip
      ══════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* ── Recent Activity ── */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-100/80 dark:border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Bell className="w-3.5 h-3.5 text-[#1d4ed8]" strokeWidth={2} />
              {notifLabel}
            </h3>
            <button
              onClick={() => onNavigate("inquiries")}
              className="text-[10px] font-bold text-[#1d4ed8] hover:text-blue-800 dark:hover:text-indigo-400 cursor-pointer transition-colors flex items-center gap-0.5"
            >
              {t("dashboard", "viewAll")} <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-1">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <Package className="w-8 h-8 text-slate-200 dark:text-slate-700" strokeWidth={1.5} />
                <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center">
                  {t("inquiries", "emptyState")}
                </p>
              </div>
            ) : (
              notifications.map((notif) => {
                const Icon = notif.icon;
                return (
                  <button
                    key={notif.id}
                    onClick={() => onNavigate(notif.tab)}
                    className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-[#f8faff] active:bg-[#eff6ff] dark:hover:bg-slate-800 dark:active:bg-slate-700 transition-colors cursor-pointer text-left group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#eff6ff] dark:bg-indigo-950/60 flex items-center justify-center shrink-0">
                      <Icon className="w-3.5 h-3.5 text-[#1d4ed8] dark:text-indigo-400" strokeWidth={1.85} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200 truncate leading-tight">
                        {notif.title}
                      </p>
                      <p className="text-[9px] text-slate-400 dark:text-slate-400 truncate mt-0.5">
                        {notif.desc}
                      </p>
                    </div>
                    <div className="flex flex-col items-end shrink-0 gap-1">
                      <span className="text-[8px] font-bold text-slate-300 dark:text-slate-500 bg-slate-50 dark:bg-slate-800 px-1.5 py-0.5 rounded-full">
                        {notif.time}
                      </span>
                      <ChevronRight className="w-3 h-3 text-slate-200 dark:text-slate-600 group-hover:text-[#1d4ed8] dark:group-hover:text-indigo-400 transition-colors" />
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ── Market Snapshot ── */}
        {commodityPrices.length > 0 && (
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100/80">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wide">
                  {t("common", "commodities")}
                </h3>
                <p className="text-[9px] text-slate-400 mt-0.5">
                  {t("dashboard", "marketPrices")}
                </p>
              </div>
              <button
                onClick={() => onNavigate("commodities")}
                className="text-[10px] font-bold text-[#1d4ed8] hover:text-blue-800 cursor-pointer flex items-center gap-0.5 transition-colors"
              >
                {t("dashboard", "viewAll")} <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            {/* Horizontal scroll on mobile, vertical list on desktop sidebar */}
            <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible pb-1 lg:pb-0 scrollbar-none -mx-1 px-1">
              {commodityPrices.slice(0, 5).map((c: any) => {
                const isUp = c.change24h >= 0;
                return (
                  <div
                    key={c.commodity}
                    className="flex lg:flex lg:items-center lg:justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100 shrink-0 lg:shrink min-w-30 lg:min-w-0 cursor-pointer hover:border-[#bfdbfe]/60 hover:bg-[#f8faff] transition-all"
                    onClick={() => onNavigate("commodities")}
                  >
                    {/* On mobile: stacked, on desktop: row */}
                    <div className="lg:flex-1">
                      <p className="text-[9px] font-black text-slate-600 truncate max-w-25">
                        {c.commodity}
                      </p>
                      <p className="text-xs font-black text-slate-900 mt-0.5">
                        ${c.currentPrice.toLocaleString()}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center gap-0.5 text-[8px] font-black mt-1 lg:mt-0 px-1.5 py-0.5 rounded-full shrink-0 ${
                        isUp
                          ? "bg-emerald-50 text-emerald-600"
                          : "bg-rose-50 text-rose-600"
                      }`}
                    >
                      {isUp
                        ? <ArrowUpRight className="w-2.5 h-2.5" />
                        : <ArrowDownRight className="w-2.5 h-2.5" />}
                      {Math.abs(c.change24h)}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
