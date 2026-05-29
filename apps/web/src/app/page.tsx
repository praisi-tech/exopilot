"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Loader2, Calculator, RefreshCw, HelpCircle, X,
  Globe, CalendarDays, Menu, Home, Ship,
  FileText, MessageSquare, Sun, Moon, Settings,
  Bell, CheckCircle2, MoreHorizontal,
} from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { DashboardHub } from "@/components/DashboardHub";
import { BuyerInquiries } from "@/components/BuyerInquiries";
import { ShipmentTracker } from "@/components/ShipmentTracker";
import { SupplierManagement } from "@/components/SupplierManagement";
import { CommodityPriceTracker } from "@/components/CommodityPriceTracker";
import { BuyerCRMModule } from "@/components/BuyerCRM";
import { NegotiationNotes } from "@/components/NegotiationNotes";
import { AIDocStudio } from "@/components/AIDocStudio";
import { UserSettings } from "@/components/UserSettings";
import { AuthScreen } from "@/components/AuthScreen";
import { LandingPage } from "@/components/LandingPage";
import { ContainerCalculator } from "@/components/ContainerCalculator";
import { CurrencyConverter } from "@/components/CurrencyConverter";
import { AdminDashboard } from "@/components/AdminDashboard";
import * as api from "@/lib/api";
import { useLanguage, LanguageCode } from "@/lib/LanguageContext";
import { useTheme } from "@/lib/ThemeContext";
import { useAuth } from "@/lib/AuthContext";
import { sanitizeSearchQuery } from "@/lib/security";

type AppTab =
  | "dashboard" | "inquiries" | "buyer-crm" | "shipments"
  | "suppliers" | "commodities" | "doc-generator"
  | "negotiation-notes" | "settings" | "admin";

type AppScreen = "landing" | "auth" | "app";

interface SessionUser { name: string; email: string; businessName: string; photoUrl?: string; role?: string; legalEntity?: string; phone?: string; }
interface SystemAlert { message: string; type: "success" | "error" | null; }

const LANG_INFO = {
  id: { flag: "🇮🇩", label: "ID", name: "Bahasa Indonesia" },
  en: { flag: "🇬🇧", label: "EN", name: "English" },
  hi: { flag: "🇮🇳", label: "HI", name: "हिन्दी" },
  zh: { flag: "🇨🇳", label: "ZH", name: "中文" },
  ar: { flag: "🇦🇪", label: "AR", name: "العربية" },
};

export default function ExopilotApp() {
  const { language, setLanguage, t, isRtl } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { user, profile, loading: authLoading, logout: firebaseLogout, isAdmin } = useAuth();

  const [currentUser, setCurrentUser]     = useState<SessionUser | null>(null);
  const [activeTab, setActiveTab]         = useState<AppTab>("dashboard");
  const [globalSearch, setGlobalSearch]   = useState("");

  const changeTab = (tab: AppTab, searchQuery: string = "") => {
    setActiveTab(tab);
    setGlobalSearch(searchQuery);
  };
  const [appScreen, setAppScreen]         = useState<AppScreen>("landing");
  const [authMode, setAuthMode]           = useState<"login" | "register">("login");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [systemAlert, setSystemAlert]     = useState<SystemAlert>({ message: "", type: null });
  const [showAddModal, setShowAddModal]   = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [showConverter, setShowConverter]   = useState(false);
  const [showHelp, setShowHelp]             = useState(false);
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMobileToolbar, setShowMobileToolbar] = useState(false);


  // Data
  const [inquiries, setInquiries]               = useState<any[]>([]);
  const [shipments, setShipments]               = useState<any[]>([]);
  const [suppliers, setSuppliers]               = useState<any[]>([]);
  const [buyerCRM, setBuyerCRM]                 = useState<any[]>([]);
  const [commodityPrices, setCommodityPrices]   = useState<any[]>([]);
  const [negotiationNotes, setNegotiationNotes] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({
    totalInquiries: 0, activeShipments: 0, closedDeals: 0,
    pipelineValue: "$0", sourcingSuppliers: 0, monthlyIncreaseRate: "+0%",
    followUpsDueToday: 0, activeCommodities: 0,
  });

  // Firebase auth wiring — when Firebase user logs in, sync local session
  useEffect(() => {
    if (authLoading) return;
    if (user) {
      const name = profile?.company_name || user.displayName || user.email?.split("@")[0] || "User";
      const sessionUser: SessionUser = {
        name,
        email: user.email || "",
        businessName: profile?.company_name || "",
        photoUrl: profile?.photo_url || undefined,
        role: profile?.role || "user",
        legalEntity: profile?.legal_entity_type || "",
        phone: profile?.phone_number || "",
      };
      setCurrentUser(sessionUser);
      localStorage.setItem("exo_session_user", JSON.stringify(sessionUser));
      setAppScreen("app");
    } else {
      // Check if they had a session (e.g. demo mode)
      const stored = localStorage.getItem("exo_session_user");
      if (stored) {
        try { setCurrentUser(JSON.parse(stored)); setAppScreen("app"); } catch {}
      }
    }
  }, [user, profile, authLoading]);

  // When profile.photo_url changes (e.g. after upload/delete photo in UserSettings),
  // sync it to currentUser so the top bar avatar updates immediately
  useEffect(() => {
    if (profile?.photo_url !== undefined) {
      setCurrentUser((prev) => {
        if (prev && prev.photoUrl === profile.photo_url) return prev; // no change
        const updated = { ...prev, photoUrl: profile.photo_url || undefined } as SessionUser;
        localStorage.setItem("exo_session_user", JSON.stringify(updated));
        return updated;
      });
    }
  }, [profile?.photo_url]);

  useEffect(() => {
    fetchData();
  }, []);


  const fetchData = async () => {
    try {
      const data = await api.fetchDashboard();
      setInquiries(data.inquiries ?? []);
      setShipments(data.shipments ?? []);
      setSuppliers(data.suppliers ?? []);
      setBuyerCRM(data.buyerCRM ?? []);
      setCommodityPrices(data.commodityPrices ?? []);
      setNegotiationNotes(data.negotiationNotes ?? []);
      setSummary(data.summary ?? summary);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to load dashboard data";
      console.error("❌ Dashboard fetch error:", errorMsg);
      // Suppress dashboard fetch error alerts so the user doesn't see error notifications on load
    } finally {
      setIsPageLoading(false);
    }
  };

  const showAlert = (message: string, type: "success" | "error") => {
    setSystemAlert({ message, type });
    setTimeout(() => setSystemAlert({ message: "", type: null }), 4000);
  };

  const handleLogin = (user: SessionUser) => {
    setCurrentUser(user);
    localStorage.setItem("exo_session_user", JSON.stringify(user));
    setAppScreen("app");
  };

  const handleLogout = async () => {
    try { await firebaseLogout(); } catch {}
    setCurrentUser(null);
    localStorage.removeItem("exo_session_user");
    changeTab("dashboard");
    setAppScreen("landing");
  };

  // Inquiry handlers
  const handleDeleteInquiry = async (id: string) => {
    if (!confirm(t("inquiries", "deleteConfirm"))) return;
    try { const d = await api.deleteInquiry(id); setInquiries(d.inquiries ?? []); showAlert(t("inquiries", "deleteSuccess"), "success"); }
    catch { showAlert("Gagal menghapus.", "error"); }
  };
  const handleUpdateInquiryStatus = async (id: string, status: string) => {
    try { const d = await api.updateInquiry(id, { status }); setInquiries(d.inquiries ?? []); } catch {}
  };
  const handleMarkEmailSent = async (id: string) => {
    try {
      const d = await api.updateInquiry(id, { firstEmailSentAt: new Date().toISOString() });
      setInquiries(d.inquiries ?? []);
      showAlert("Follow-up email marked as sent!", "success");
    } catch {
      showAlert("Failed to mark email as sent.", "error");
    }
  };
  const handleAddInquiry = async (body: Record<string, string>) => {
    try { const d = await api.createInquiry(body); setInquiries(d.inquiries ?? []); fetchData(); showAlert(t("inquiries", "saveSuccess"), "success"); }
    catch { showAlert("Gagal menyimpan.", "error"); }
  };

  // Shipment handlers
  const handleAddShipment = async (body: Record<string, string>) => {
    try { const d = await api.createShipment(body); setShipments(d.shipments ?? []); showAlert("Pengiriman ditambahkan!", "success"); fetchData(); }
    catch { showAlert("Gagal menambahkan pengiriman.", "error"); }
  };
  const handleToggleDocument = async (shipmentId: string, docType: string) => {
    try { const d = await api.toggleShipmentDocument(shipmentId, docType); setShipments(d.shipments ?? []); } catch {}
  };

  // Supplier handlers
  const handleAddSupplier = async (body: Record<string, unknown>) => {
    try { const d = await api.createSupplier(body); setSuppliers(d.suppliers ?? []); showAlert("Pemasok berhasil didaftarkan!", "success"); fetchData(); }
    catch { showAlert("Gagal menambahkan pemasok.", "error"); }
  };
  const handleDeleteSupplier = async (id: string) => {
    if (!confirm("Hapus pemasok ini?")) return;
    try { const d = await api.deleteSupplier(id); setSuppliers(d.suppliers ?? []); showAlert("Pemasok dihapus.", "success"); } catch {}
  };
  const handleUpdateReliability = async (id: string, score: number) => {
    try { const d = await api.updateSupplier(id, { reliabilityScore: score }); setSuppliers(d.suppliers ?? []); } catch {}
  };

  // Note handlers
  const handleAddNote = async (body: Record<string, unknown>) => {
    try { const d = await api.createNote(body); setNegotiationNotes(d.notes ?? []); showAlert("Catatan tersimpan!", "success"); }
    catch { showAlert("Gagal menyimpan catatan.", "error"); }
  };
  const handleDeleteNote = async (id: string) => {
    try { const d = await api.deleteNote(id); setNegotiationNotes(d.notes ?? []); showAlert("Catatan dihapus.", "success"); } catch {}
  };

  const buyerNames = [...new Set([...inquiries.map((i) => i.buyerName), ...buyerCRM.map((b) => b.buyerName)])];
  const activeShipmentCount = shipments.filter((s) => s.status !== "Completed" && s.status !== "Arrived").length;
  
  // Full categorised follow-up list for the notification panel
  const followUpNotifications = useMemo(() => {
    const now = Date.now();
    const todayStr = new Date().toISOString().slice(0, 10);
    const threeDaysMs = 3 * 24 * 60 * 60 * 1000;

    return inquiries
      .filter((inq) => {
        const isClosedOrLost = inq.status === "Closed Deal" || inq.status === "Lost" || inq.status === "Closed";
        if (isClosedOrLost) return false;
        // Include if has reminder date set, OR if first email was sent (needs follow-up tracking)
        return inq.followUpReminderDate || inq.firstEmailSentAt;
      })
      .map((inq) => {
        const reminderDate = inq.followUpReminderDate || null;
        const emailSentAt = inq.firstEmailSentAt ? new Date(inq.firstEmailSentAt).getTime() : null;
        const daysSinceEmail = emailSentAt ? Math.floor((now - emailSentAt) / 86400000) : null;

        let urgency: "overdue" | "today" | "upcoming" | "needs-reply" = "needs-reply";
        let daysLabel = "";

        if (reminderDate) {
          if (reminderDate < todayStr) {
            urgency = "overdue";
            const diff = Math.floor((now - new Date(reminderDate).getTime()) / 86400000);
            daysLabel = diff === 1 ? "1 day overdue" : `${diff} days overdue`;
          } else if (reminderDate === todayStr) {
            urgency = "today";
            daysLabel = "Due today";
          } else {
            urgency = "upcoming";
            const diff = Math.ceil((new Date(reminderDate).getTime() - now) / 86400000);
            daysLabel = diff === 1 ? "Due tomorrow" : `In ${diff} days`;
          }
        } else if (daysSinceEmail !== null) {
          urgency = daysSinceEmail >= 3 ? "overdue" : "needs-reply";
          daysLabel = daysSinceEmail === 0 ? "Email sent today" : `Email sent ${daysSinceEmail}d ago`;
        }

        return { ...inq, urgency, daysLabel };
      })
      .sort((a, b) => {
        const order: Record<string, number> = { overdue: 0, today: 1, "needs-reply": 2, upcoming: 3 };
        return (order[a.urgency] ?? 9) - (order[b.urgency] ?? 9);
      });
  }, [inquiries]);

  // Badge count: only truly urgent (overdue + today)
  const dueFollowUpsList = followUpNotifications.filter(n => n.urgency === "overdue" || n.urgency === "today");
  const followUpsDueCount = dueFollowUpsList.length;

  /* ── Screen guards ── */

  // Show landing page
  if (appScreen === "landing") {
    return (
      <LandingPage
        onGetStarted={() => { setAuthMode("register"); setAppScreen("auth"); }}
        onSignIn={() => { setAuthMode("login"); setAppScreen("auth"); }}
      />
    );
  }

  // Show auth screen
  if (appScreen === "auth" && !currentUser) {
    return (
      <AuthScreen
        onLogin={handleLogin}
        initialMode={authMode}
        onBack={() => setAppScreen("landing")}
      />
    );
  }

  // Auth loading
  if (authLoading || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center page-bg dark:bg-slate-950 transition-colors duration-200">
        <div className="text-center space-y-4">
          <div className="w-14 h-14 rounded-[18px] overflow-hidden flex items-center justify-center mx-auto shadow-xl shadow-indigo-500/30 animate-pulse">
            <img src="/logo.png" alt="Exopilot" className="w-12 h-12 object-contain" />
          </div>
          <Loader2 className="w-5 h-5 text-indigo-400 animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400">{t("common", "loading")}</p>
        </div>
      </div>
    );
  }

  if (isPageLoading) return (
    <div className="min-h-screen flex items-center justify-center page-bg dark:bg-slate-950 transition-colors duration-200">
      <div className="text-center space-y-4">
        <div className="w-14 h-14 rounded-[18px] overflow-hidden flex items-center justify-center mx-auto shadow-xl shadow-indigo-500/30 animate-pulse">
            <img src="/logo.png" alt="Exopilot" className="w-12 h-12 object-contain" />
          </div>
        <Loader2 className="w-5 h-5 text-indigo-400 animate-spin mx-auto" />
        <p className="text-xs font-bold text-slate-500 dark:text-slate-400">{t("common", "loading")}</p>
      </div>
    </div>
  );

  /* ── Formatted date ── */
  const dateStr = new Date().toLocaleDateString(
    language === "ar" ? "ar-EG" : language === "zh" ? "zh-CN" : language === "hi" ? "hi-IN" : "en-US",
    { day: "numeric", month: "long", year: "numeric" }
  );

  const topBarBtn = "w-8 h-8 rounded-xl bg-[#f3f6fc] dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-[#93c5fd] cursor-pointer transition-all shrink-0";

  /* ── Render ── */
  return (
    <div
      className={`flex h-screen page-bg dark:bg-slate-950 font-sans overflow-hidden ${isRtl ? "rtl" : "ltr"} text-slate-800 dark:text-slate-100 transition-colors duration-200`}
      dir={isRtl ? "rtl" : "ltr"}
    >
      {/* System Alert */}
      {systemAlert.type && (
        <div
          className={`fixed top-4 ${isRtl ? "right-4 animate-slide-in-right" : "left-4 animate-fade-in"} z-100 px-5 py-3 rounded-2xl text-xs font-bold shadow-2xl flex items-center gap-2 ${
            systemAlert.type === "success" ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
          }`}
        >
          {systemAlert.message}
        </div>
      )}

      {/* Mobile Sidebar Backdrop & Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden animate-fade-in">
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm transition-opacity" onClick={() => setMobileMenuOpen(false)} />
          <div className="relative flex max-w-xs w-full bg-white dark:bg-slate-900 shadow-2xl animate-slide-in-right h-full border-r border-slate-200 dark:border-slate-800">
            <div className="absolute top-3.5 right-3.5 z-50">
              <button onClick={() => setMobileMenuOpen(false)} className="w-7 h-7 rounded-full bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 cursor-pointer shadow border border-slate-200/60 dark:border-slate-700">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <Sidebar
              activeTab={activeTab}
              onTabChange={(tab) => { changeTab(tab as AppTab); setMobileMenuOpen(false); }}
              inquiryCount={followUpsDueCount}
              shipmentCount={activeShipmentCount}
              supplierCount={suppliers.length}
              onLogout={handleLogout}
              isMobile={true}
              isAdmin={isAdmin}
            />
          </div>
        </div>
      )}

      {/* ── Sidebar ── */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={(tab) => changeTab(tab as AppTab)}
        inquiryCount={followUpsDueCount}
        shipmentCount={activeShipmentCount}
        supplierCount={suppliers.length}
        onLogout={handleLogout}
        isAdmin={isAdmin}
      />

      {/* ── Right column: header + main ── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* ── Header ── */}
        <header className="relative h-17 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex items-center px-3 sm:px-6 gap-2 shrink-0 transition-colors duration-200">

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 cursor-pointer shrink-0 transition-colors"
            title="Open navigation menu"
          >
            <Menu className="w-4 h-4" />
          </button>



          {/* Date — centered — hidden on small screens */}
          <div className="flex-1 hidden lg:flex items-center justify-center gap-1.5">
            <CalendarDays className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">{dateStr}</span>
          </div>
          {/* Spacer on mobile */}
          <div className="flex-1 lg:hidden" />

          {/* Right tools — desktop secondary tools hidden on mobile */}
          <div className="flex items-center gap-1 shrink-0 overflow-visible">

            {/* Calculator — desktop only */}
            <button onClick={() => setShowCalculator(true)} id="btn-trigger-calc" title={t("common", "calculator")} className={`${topBarBtn} hidden md:flex`}>
              <Calculator className="w-3.5 h-3.5" />
            </button>

            {/* Converter — desktop only */}
            <button onClick={() => setShowConverter(true)} id="btn-trigger-conv" title={t("common", "conversion")} className={`${topBarBtn} hidden md:flex`}>
              <RefreshCw className="w-3.5 h-3.5" />
            </button>

            {/* Help — desktop only */}
            <button onClick={() => setShowHelp(true)} title={t("common", "help")} className={`${topBarBtn} hidden md:flex`}>
              <HelpCircle className="w-3.5 h-3.5" />
            </button>

            {/* Theme Toggle — desktop only */}
            <button onClick={toggleTheme} title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"} className={`${topBarBtn} hidden md:flex`}>
              {theme === "light" ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
            </button>

            {/* Mobile tools toggle — shows/hides secondary tools strip */}
            <button
              onClick={() => setShowMobileToolbar(!showMobileToolbar)}
              title="More Tools"
              className={`md:hidden ${topBarBtn} ${showMobileToolbar ? "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400" : ""}`}
            >
              {showMobileToolbar
                ? <X className="w-3.5 h-3.5" />
                : <MoreHorizontal className="w-3.5 h-3.5" />}
            </button>

            {/* Notification Bell for Follow-up Reminders */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                id="btn-trigger-notifications"
                title="Buyer Follow-up Reminders"
                className={`${topBarBtn} relative`}
              >
                <Bell className={`w-3.5 h-3.5 ${followUpsDueCount > 0 ? "text-amber-500 animate-pulse" : ""}`} />
                {followUpsDueCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 px-1 py-0.5 bg-rose-500 text-white font-black text-[7px] rounded-full leading-none animate-bounce shrink-0 shadow-sm border border-white">
                    {followUpsDueCount}
                  </span>
                )}
              </button>

              {/* Notification panel — bottom sheet on mobile, dropdown on desktop */}
              {showNotifications && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />

                  {/* ── Mobile: full bottom sheet ── */}
                  <div className="md:hidden fixed inset-x-0 bottom-0 z-50 animate-slide-in-up">
                    <div className="bg-white dark:bg-slate-900 rounded-t-3xl border-t border-slate-100 dark:border-slate-800 shadow-2xl max-h-[80vh] flex flex-col">
                      {/* drag handle */}
                      <div className="flex justify-center pt-3 pb-1">
                        <div className="w-10 h-1 rounded-full bg-slate-200 dark:bg-slate-700" />
                      </div>
                      {/* Header */}
                      <div className="px-4 pt-2 pb-3 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                        <div>
                          <h4 className="text-sm font-black text-slate-800 dark:text-slate-200">
                            🔔 {language === "en" ? "Follow-Up Reminders" : "Pengingat Follow-Up"}
                          </h4>
                          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                            {followUpNotifications.length === 0
                              ? (language === "en" ? "No active follow-ups" : "Tidak ada follow-up aktif")
                              : (language === "en"
                                ? `${followUpNotifications.length} buyer${followUpNotifications.length > 1 ? "s" : ""} tracked`
                                : `${followUpNotifications.length} buyer terpantau`)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full shrink-0 ${
                            followUpsDueCount > 0
                              ? "bg-rose-50 dark:bg-rose-950/30 text-rose-600"
                              : "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600"
                          }`}>
                            {followUpsDueCount > 0 ? `${followUpsDueCount} URGENT` : "ALL GOOD"}
                          </span>
                          <button onClick={() => setShowNotifications(false)} className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 cursor-pointer">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      {/* Body */}
                      <div className="flex-1 overflow-y-auto p-3 space-y-2 pb-safe">
                        {followUpNotifications.length === 0 ? (
                          <div className="text-center py-12">
                            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{language === "en" ? "All clear!" : "Semua aman!"}</p>
                            <p className="text-xs text-slate-400 mt-1 leading-relaxed">{language === "en" ? "No buyers need follow-up right now." : "Tidak ada buyer yang perlu ditindaklanjuti saat ini."}</p>
                          </div>
                        ) : (
                          followUpNotifications.map((inq) => {
                            type UrgencyCfg = { bg: string; border: string; badge: string; dot: string };
                            const urgencyMap: Record<string, UrgencyCfg> = {
                              overdue:       { bg: "bg-rose-50 dark:bg-rose-950/20",   border: "border-rose-200 dark:border-rose-900/50",   badge: "bg-rose-500 text-white",                                            dot: "bg-rose-500"  },
                              today:         { bg: "bg-amber-50 dark:bg-amber-950/20", border: "border-amber-200 dark:border-amber-900/50", badge: "bg-amber-500 text-white",                                           dot: "bg-amber-500" },
                              "needs-reply": { bg: "bg-blue-50 dark:bg-blue-950/20",   border: "border-blue-200 dark:border-blue-900/50",   badge: "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300",     dot: "bg-blue-500"  },
                              upcoming:      { bg: "bg-slate-50 dark:bg-slate-800/40", border: "border-slate-200 dark:border-slate-700",    badge: "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400", dot: "bg-slate-400" },
                            };
                            const urgencyConfig = urgencyMap[inq.urgency as string] ?? urgencyMap["upcoming"];
                            return (
                              <div key={inq.id} onClick={() => { changeTab("inquiries", inq.buyerName); setShowNotifications(false); }}
                                className={`p-3 rounded-xl border cursor-pointer transition-all active:scale-[0.98] group ${urgencyConfig.bg} ${urgencyConfig.border}`}>
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex items-start gap-2 min-w-0">
                                    <div className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${urgencyConfig.dot}`} />
                                    <div className="min-w-0">
                                      <p className="text-xs font-extrabold text-slate-800 dark:text-slate-200 truncate">{inq.buyerName}</p>
                                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">{inq.product} · {inq.country} · <span className="font-semibold">{inq.status}</span></p>
                                    </div>
                                  </div>
                                  <span className={`shrink-0 text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${urgencyConfig.badge}`}>{inq.daysLabel}</span>
                                </div>
                                {inq.followUpReminderDate && (<p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 pl-4">📅 {inq.followUpReminderDate}</p>)}
                              </div>
                            );
                          })
                        )}
                      </div>
                      {followUpNotifications.length > 0 && (
                        <div className="px-4 pb-6 pt-2 border-t border-slate-100 dark:border-slate-800">
                          <button onClick={() => { changeTab("inquiries"); setShowNotifications(false); }}
                            className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-black tracking-wide transition-colors cursor-pointer">
                            {language === "en" ? "View All Inquiries →" : "Lihat Semua Inquiries →"}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ── Desktop: dropdown ── */}
                  <div className={`hidden md:block absolute ${isRtl ? "left-0" : "right-0"} mt-2 w-80 bg-white/97 dark:bg-slate-900/97 backdrop-blur-xl border border-slate-100 dark:border-slate-800 rounded-2xl shadow-2xl z-50 animate-scale-up overflow-hidden`}>
                    <div className="px-4 pt-4 pb-3 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                      <div>
                        <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">🔔 {language === "en" ? "Follow-Up Reminders" : "Pengingat Follow-Up"}</h4>
                        <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5">
                          {followUpNotifications.length === 0 ? (language === "en" ? "No active follow-ups" : "Tidak ada follow-up aktif") : (language === "en" ? `${followUpNotifications.length} buyer${followUpNotifications.length > 1 ? "s" : ""} tracked` : `${followUpNotifications.length} buyer terpantau`)}
                        </p>
                      </div>
                      <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full shrink-0 ${followUpsDueCount > 0 ? "bg-rose-50 dark:bg-rose-950/30 text-rose-600" : "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600"}`}>
                        {followUpsDueCount > 0 ? `${followUpsDueCount} URGENT` : "ALL GOOD"}
                      </span>
                    </div>
                    <div className="max-h-80 overflow-y-auto p-3 space-y-1.5">
                      {followUpNotifications.length === 0 ? (
                        <div className="text-center py-8">
                          <CheckCircle2 className="w-9 h-9 text-emerald-500 mx-auto mb-2" />
                          <p className="text-[10px] font-bold text-slate-700 dark:text-slate-200">{language === "en" ? "All clear!" : "Semua aman!"}</p>
                          <p className="text-[9px] text-slate-400 mt-1 leading-relaxed">{language === "en" ? "No buyers need follow-up right now." : "Tidak ada buyer yang perlu ditindaklanjuti saat ini."}</p>
                        </div>
                      ) : (
                        followUpNotifications.map((inq) => {
                          type UrgencyCfg = { bg: string; border: string; badge: string; dot: string };
                          const urgencyMap: Record<string, UrgencyCfg> = {
                            overdue:       { bg: "bg-rose-50 dark:bg-rose-950/20",   border: "border-rose-200 dark:border-rose-900/50",   badge: "bg-rose-500 text-white",                                            dot: "bg-rose-500"  },
                            today:         { bg: "bg-amber-50 dark:bg-amber-950/20", border: "border-amber-200 dark:border-amber-900/50", badge: "bg-amber-500 text-white",                                           dot: "bg-amber-500" },
                            "needs-reply": { bg: "bg-blue-50 dark:bg-blue-950/20",   border: "border-blue-200 dark:border-blue-900/50",   badge: "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300",     dot: "bg-blue-500"  },
                            upcoming:      { bg: "bg-slate-50 dark:bg-slate-800/40", border: "border-slate-200 dark:border-slate-700",    badge: "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400", dot: "bg-slate-400" },
                          };
                          const urgencyConfig = urgencyMap[inq.urgency as string] ?? urgencyMap["upcoming"];
                          return (
                            <div key={inq.id} onClick={() => { changeTab("inquiries", inq.buyerName); setShowNotifications(false); }}
                              className={`p-2.5 rounded-xl border cursor-pointer transition-all hover:scale-[1.01] hover:shadow-sm group ${urgencyConfig.bg} ${urgencyConfig.border}`}>
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-start gap-2 min-w-0">
                                  <div className={`w-1.5 h-1.5 rounded-full shrink-0 mt-1.5 ${urgencyConfig.dot}`} />
                                  <div className="min-w-0">
                                    <p className="text-[10px] font-extrabold text-slate-800 dark:text-slate-200 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{inq.buyerName}</p>
                                    <p className="text-[8px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">{inq.product} · {inq.country} · <span className="font-semibold">{inq.status}</span></p>
                                  </div>
                                </div>
                                <span className={`shrink-0 text-[7px] font-black uppercase px-1.5 py-0.5 rounded-md ${urgencyConfig.badge}`}>{inq.daysLabel}</span>
                              </div>
                              {inq.followUpReminderDate && (<p className="text-[7.5px] text-slate-400 dark:text-slate-500 mt-1.5 pl-3.5">📅 Reminder: {inq.followUpReminderDate}</p>)}
                            </div>
                          );
                        })
                      )}
                    </div>
                    {followUpNotifications.length > 0 && (
                      <div className="px-3 pb-3">
                        <button onClick={() => { changeTab("inquiries"); setShowNotifications(false); }}
                          className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black tracking-wide transition-colors cursor-pointer">
                          {language === "en" ? "View All Inquiries →" : "Lihat Semua Inquiries →"}
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Divider */}
            <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-0.5 hidden sm:block" />


            {/* Language */}
            <div className="relative">
              <button
                onClick={() => setShowLangDropdown(!showLangDropdown)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#f3f6fc] dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-350 hover:text-indigo-600 cursor-pointer transition-all text-[11px] font-bold shrink-0"
              >
                <Globe className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{LANG_INFO[language].flag} {LANG_INFO[language].label}</span>
                <span className="sm:hidden">{LANG_INFO[language].flag}</span>
              </button>
              {showLangDropdown && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowLangDropdown(false)} />
                  <div className={`absolute ${isRtl ? "left-0" : "right-0"} mt-2 w-48 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-xl z-50 py-1.5 animate-scale-up`}>
                    {Object.entries(LANG_INFO).map(([code, info]) => (
                      <button
                        key={code}
                        onClick={() => { setLanguage(code as LanguageCode); setShowLangDropdown(false); }}
                        className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold transition-colors cursor-pointer ${
                          language === code
                            ? "bg-indigo-50 dark:bg-indigo-950/45 text-indigo-600 dark:text-indigo-400"
                            : "text-slate-600 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-750"
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

            {/* Divider */}
            <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-0.5" />

            {/* User avatar + Firebase profile */}
            <div
              className="flex items-center gap-2.5 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => changeTab("settings")}
              title="Settings"
            >
              <div className="w-8 h-8 rounded-full bg-linear-to-br from-indigo-500 to-pink-500 flex items-center justify-center text-white font-black text-[9px] shrink-0 ring-2 ring-white dark:ring-slate-800 shadow-md overflow-hidden">
                {currentUser.photoUrl ? (
                  <img src={currentUser.photoUrl} alt={currentUser.name} className="w-full h-full object-cover" />
                ) : (
                  currentUser.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
                )}
              </div>
              <div className="hidden xl:block">
                <div className="flex items-center gap-1.5">
                  <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200 leading-tight">{currentUser.name}</p>
                  {currentUser.role === "admin" && (
                    <span className="text-[7px] font-black text-amber-500 bg-amber-50 dark:bg-amber-950/30 px-1 py-0.5 rounded uppercase tracking-wider">★ Admin</span>
                  )}
                </div>
                <p className="text-[9px] text-slate-400 dark:text-slate-500 leading-tight truncate max-w-30">{currentUser.email}</p>
              </div>
            </div>
          </div>
          {/* ── Mobile tools expandable strip — slides down below header ── */}
          {showMobileToolbar && (
            <div className="md:hidden absolute top-full left-0 right-0 z-30 animate-slide-in-top">
              <div className="bg-white/98 dark:bg-slate-900/98 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800 shadow-lg px-4 py-3 flex items-center gap-2">
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mr-1">Tools</span>
                <button
                  onClick={() => { setShowCalculator(true); setShowMobileToolbar(false); }}
                  className={`${topBarBtn} flex`}
                  title={t("common", "calculator")}
                >
                  <Calculator className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => { setShowConverter(true); setShowMobileToolbar(false); }}
                  className={`${topBarBtn} flex`}
                  title={t("common", "conversion")}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => { setShowHelp(true); setShowMobileToolbar(false); }}
                  className={`${topBarBtn} flex`}
                  title={t("common", "help")}
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => { toggleTheme(); }}
                  className={`${topBarBtn} flex`}
                  title={theme === "light" ? "Dark Mode" : "Light Mode"}
                >
                  {theme === "light" ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
                </button>
                <div className="flex-1" />
                <span className="text-[9px] text-slate-300 dark:text-slate-600">tap to use</span>
              </div>
            </div>
          )}
        </header>

        {/* ── Main Content ── */}
        <main className="flex-1 overflow-y-auto p-6 pb-24 md:pb-6">
          {activeTab === "dashboard" && (
            <DashboardHub
              summary={summary} inquiries={inquiries} shipments={shipments}
              commodityPrices={commodityPrices} onAddInquiry={() => setShowAddModal(true)}
              onNavigate={(tab) => changeTab(tab as AppTab)} userName={currentUser.name}
            />
          )}
          {activeTab === "inquiries" && (
            <BuyerInquiries
              inquiries={inquiries} onAddInquiry={() => setShowAddModal(true)}
              onDeleteInquiry={handleDeleteInquiry} onUpdateStatus={handleUpdateInquiryStatus}
              onGenerateDoc={() => changeTab("doc-generator")}
              onMarkEmailSent={handleMarkEmailSent}
              globalSearch={globalSearch}
            />
          )}
          {activeTab === "buyer-crm"         && (
            <BuyerCRMModule
              buyers={buyerCRM}
              onRefresh={fetchData}
              globalSearch={globalSearch}
              googleFormUrl={profile?.google_form_url}
            />
          )}
          {activeTab === "shipments"         && (
            <ShipmentTracker shipments={shipments} onAddShipment={handleAddShipment} onToggleDocument={handleToggleDocument} />
          )}
          {activeTab === "suppliers"         && (
            <SupplierManagement suppliers={suppliers} onAddSupplier={handleAddSupplier} onDeleteSupplier={handleDeleteSupplier} onUpdateReliability={handleUpdateReliability} globalSearch={globalSearch} />
          )}
          {activeTab === "commodities"       && <CommodityPriceTracker commodities={commodityPrices} globalSearch={globalSearch} />}
          {activeTab === "negotiation-notes" && (
            <NegotiationNotes notes={negotiationNotes} buyerNames={buyerNames} onAddNote={handleAddNote} onDeleteNote={handleDeleteNote} globalSearch={globalSearch} />
          )}
          {activeTab === "doc-generator"     && <AIDocStudio inquiries={inquiries} currentUser={currentUser} onAlert={showAlert} />}
          {activeTab === "settings"          && (
            <UserSettings
              currentUser={currentUser}
              onUpdate={(u) => { setCurrentUser(u); localStorage.setItem("exo_session_user", JSON.stringify(u)); }}
              onAlert={showAlert}
            />
          )}
          {activeTab === "admin" && isAdmin && (
            <AdminDashboard onAlert={showAlert} />
          )}
        </main>
      </div>

      {/* ── Modals ── */}
      {showAddModal   && <AddInquiryModal onClose={() => setShowAddModal(false)} onSubmit={handleAddInquiry} />}
      {showCalculator && <ContainerCalculator onClose={() => setShowCalculator(false)} />}
      {showConverter  && <CurrencyConverter  onClose={() => setShowConverter(false)} />}

      {/* Help modal */}
      {showHelp && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 z-50 animate-fade-in" onClick={() => setShowHelp(false)}>
          <div className="bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 dark:border-slate-800 animate-slide-in-up sm:animate-scale-up flex flex-col max-h-[85vh]" onClick={(e) => e.stopPropagation()}>
            {/* Drag handle on mobile */}
            <div className="flex justify-center pt-3 pb-1 sm:hidden">
              <div className="w-10 h-1 rounded-full bg-slate-200 dark:bg-slate-700" />
            </div>
            <div className="flex items-center justify-between px-6 pt-4 pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <h3 className="text-sm font-black text-slate-800 dark:text-slate-150">{t("common", "quick-guide")}</h3>
              <button onClick={() => setShowHelp(false)} className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-350 cursor-pointer">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 px-6 py-4 space-y-2.5 pb-safe">
              {[
                { label: t("common", "inquiries"),     desc: t("inquiries", "emptyState") },
                { label: t("common", "buyer-crm"),     desc: t("buyerCrm",  "subtitle") },
                { label: t("common", "shipments"),     desc: t("shipments", "subtitle") },
                { label: t("common", "suppliers"),     desc: t("suppliers", "subtitle") },
                { label: t("common", "doc-generator"), desc: t("docStudio", "subtitle") },
                { label: t("common", "calculator"),    desc: t("calculator","subtitle") },
                { label: t("common", "conversion"),    desc: t("converter", "subtitle") },
              ].map((item) => (
                <div key={item.label} className="flex gap-3 p-3 rounded-2xl bg-[#f5f7fc] dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800/80">
                  <div className="w-2 h-2 rounded-full bg-indigo-500 shrink-0 mt-1.5" />
                  <div>
                    <p className="text-[11px] font-black text-slate-800 dark:text-slate-200">{item.label}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-455 mt-0.5 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Mobile Floating Bottom Nav ── */}
      <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 md:hidden animate-pop-in select-none">
        <div className="bg-white/96 dark:bg-slate-900/96 backdrop-blur-xl rounded-[28px] border border-slate-200/70 dark:border-slate-800/70 shadow-[0_8px_32px_rgba(0,0,0,0.12)] px-3 py-2.5 flex items-center gap-1">
          {([
            { id: "dashboard",     icon: Home,          label: "Home"     },
            { id: "inquiries",     icon: MessageSquare, label: "Inquiries"},
            { id: "shipments",     icon: Ship,          label: "Shipments"},
            { id: "doc-generator", icon: FileText,      label: "Docs"     },
          ] as { id: string; icon: React.ElementType; label: string }[]).map(({ id, icon: Icon, label }) => {
            const isActive = activeTab === id;
            return isActive ? (
              <div key={id} className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#1d4ed8] text-white shadow-md transition-all duration-300">
                <Icon className="w-4.25 h-4.25 shrink-0" strokeWidth={2.2} />
                <span className="text-[11px] font-black tracking-wide leading-none">{label}</span>
              </div>
            ) : (
              <button
                key={id}
                onClick={() => changeTab(id as AppTab)}
                className="flex flex-col items-center justify-center w-11 h-11 rounded-full text-slate-400 dark:text-slate-500 hover:text-[#1d4ed8] dark:hover:text-blue-450 hover:bg-[#eff6ff] dark:hover:bg-slate-800 transition-all duration-200 cursor-pointer group relative"
                title={label}
              >
                <Icon className="w-4.5 h-4.5 transition-colors" strokeWidth={1.85} />
              </button>
            );
          })}

          {/* More / Menu trigger */}
          {mobileMenuOpen ? (
            <div className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#1d4ed8] text-white shadow-md transition-all duration-300">
              <Menu className="w-4.25 h-4.25 shrink-0" strokeWidth={2.2} />
              <span className="text-[11px] font-black tracking-wide leading-none">Menu</span>
            </div>
          ) : (
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="flex flex-col items-center justify-center w-11 h-11 rounded-full text-slate-400 dark:text-slate-500 hover:text-[#1d4ed8] dark:hover:text-blue-400 hover:bg-[#eff6ff] dark:hover:bg-slate-800 transition-all duration-200 cursor-pointer group relative"
              title="More"
            >
              <Menu className="w-4.5 h-4.5 transition-colors" strokeWidth={1.85} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   Add Inquiry Modal
══════════════════════════════════════════════════════════ */
function AddInquiryModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (b: Record<string, string>) => Promise<void>; }) {
  const { t, isRtl } = useLanguage();
  const [form, setForm] = useState({
    buyerName: "", country: "", product: "Nutmeg (ABCD Grade)",
    quantity: "15 MT", price: "$8,500/MT", source: "Direct",
    negotiationNotes: "", followUpReminderDate: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1);

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    await onSubmit(form);
    setSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800 animate-pop-in">
        {/* Header */}
        <div className="p-6 bg-linear-to-tr from-slate-900 to-indigo-950 text-white">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-extrabold text-sm tracking-wide uppercase">{t("inquiries", "addInquiry")}</h3>
              <p className="text-[10px] text-indigo-300 mt-0.5">{t("inquiries", "pipelineSubtitle")}</p>
            </div>
            <button onClick={onClose} className="text-indigo-300 hover:text-white font-black text-xl cursor-pointer leading-none mt-0.5">×</button>
          </div>
          <div className="flex items-center gap-2 mt-4">
            {[1, 2].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <button type="button" onClick={() => setStep(s)} className={`w-6 h-6 rounded-full text-[10px] font-black flex items-center justify-center cursor-pointer transition-all ${step === s ? "bg-white text-indigo-900" : step > s ? "bg-indigo-500 text-white" : "bg-white/20 text-indigo-200"}`}>{s}</button>
                <span className={`text-[10px] font-bold ${step === s ? "text-white" : "text-indigo-300"}`}>{s === 1 ? t("inquiries", "infoBuyer") : t("inquiries", "detailProduct")}</span>
                {s < 2 && <div className="w-8 h-px bg-white/20 mx-1" />}
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handle} className="p-6 space-y-4">
          {step === 1 && (
            <>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold tracking-widest uppercase text-slate-400 dark:text-slate-500">{t("inquiries", "companyField")} <span className="text-rose-500">*</span></label>
                <input required placeholder="e.g. Klausen Spice GmbH" className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-indigo-400 dark:focus:ring-indigo-700 focus:outline-none placeholder:text-slate-300 dark:placeholder:text-slate-600 text-slate-800 dark:text-slate-200 bg-[#f9fafc] dark:bg-slate-800" value={form.buyerName} onChange={(e) => setForm({ ...form, buyerName: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold tracking-widest uppercase text-slate-400 dark:text-slate-500">{t("inquiries", "countryField")} <span className="text-rose-500">*</span></label>
                <input required placeholder="e.g. Germany, Japan, UAE" className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-indigo-400 dark:focus:ring-indigo-700 focus:outline-none placeholder:text-slate-300 dark:placeholder:text-slate-600 text-slate-800 dark:text-slate-200 bg-[#f9fafc] dark:bg-slate-800" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold tracking-widest uppercase text-slate-400 dark:text-slate-500">{t("inquiries", "sourceField")}</label>
                <select className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs bg-[#f9fafc] dark:bg-slate-800 focus:ring-2 focus:ring-indigo-400 dark:focus:ring-indigo-700 focus:outline-none cursor-pointer text-slate-800 dark:text-slate-200" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}>
                  {["Alibaba", "LinkedIn", "Facebook", "Direct", "Website", "Other"].map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="pt-2 flex justify-end">
                <button type="button" onClick={() => { if (!form.buyerName || !form.country) return; setStep(2); }} disabled={!form.buyerName || !form.country} className="px-5 py-2.5 rounded-2xl bg-indigo-500 hover:bg-indigo-600 disabled:opacity-40 text-white font-bold text-xs shadow-md cursor-pointer transition-colors">
                  {t("inquiries", "nextBtn")}
                </button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold tracking-widest uppercase text-slate-400 dark:text-slate-500">{t("inquiries", "productField")}</label>
                  <select className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs bg-[#f9fafc] dark:bg-slate-800 focus:ring-2 focus:ring-indigo-400 dark:focus:ring-indigo-700 focus:outline-none cursor-pointer text-slate-800 dark:text-slate-200" value={form.product} onChange={(e) => setForm({ ...form, product: e.target.value })}>
                    {["Nutmeg (ABCD Grade)", "Cloves (Lal Pari Grade)", "Mace (Whole Grade)", "Cassia Cinnamon (Split)", "Cocoa Bean", "Coffee (Robusta)"].map((p) => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold tracking-widest uppercase text-slate-400 dark:text-slate-500">{t("inquiries", "volumeField")}</label>
                  <input required placeholder="e.g. 15 MT" className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-indigo-400 dark:focus:ring-indigo-700 focus:outline-none placeholder:text-slate-300 dark:placeholder:text-slate-600 text-slate-800 dark:text-slate-200 bg-[#f9fafc] dark:bg-slate-800" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold tracking-widest uppercase text-slate-400 dark:text-slate-500">{t("inquiries", "targetPriceField")}</label>
                  <input placeholder="e.g. $8,500/MT" className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-indigo-400 dark:focus:ring-indigo-700 focus:outline-none placeholder:text-slate-300 dark:placeholder:text-slate-600 text-slate-800 dark:text-slate-200 bg-[#f9fafc] dark:bg-slate-800" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold tracking-widest uppercase text-slate-400 dark:text-slate-500">{t("inquiries", "reminderField")}</label>
                  <input type="date" className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-indigo-400 dark:focus:ring-indigo-700 focus:outline-none text-slate-800 dark:text-slate-200 bg-[#f9fafc] dark:bg-slate-800" value={form.followUpReminderDate} onChange={(e) => setForm({ ...form, followUpReminderDate: e.target.value })} />
                </div>
              </div>
              <div className="pt-2 flex gap-3 justify-between">
                <button type="button" onClick={() => setStep(1)} className="px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors">{t("inquiries", "backBtn")}</button>
                <div className="flex gap-2">
                  <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors">{t("common", "cancel")}</button>
                  <button type="submit" disabled={submitting} className="px-5 py-2.5 rounded-2xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-xs shadow-md cursor-pointer flex items-center gap-1 transition-colors">
                    {submitting ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> {t("inquiries", "saving")}</> : t("inquiries", "saveBtn")}
                  </button>
                </div>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
