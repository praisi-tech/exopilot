"use client";

import React, { useState } from "react";
import {
  LayoutDashboard,
  MessageSquare,
  Package,
  Ship,
  Users,
  TrendingUp,
  FileText,
  StickyNote,
  Settings,
  LogOut,
  Anchor,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";

export interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  inquiryCount: number;
  shipmentCount: number;
  supplierCount: number;
  onLogout: () => void;
  isMobile?: boolean;
  isAdmin?: boolean;
}

const NAV_ITEMS = [
  { id: "dashboard",          icon: LayoutDashboard },
  { id: "inquiries",          icon: MessageSquare,  countKey: "inquiry"   },
  { id: "buyer-crm",          icon: Users                                 },
  { id: "shipments",          icon: Ship,           countKey: "shipment"  },
  { id: "suppliers",          icon: Anchor,         countKey: "supplier"  },
  { id: "commodities",        icon: TrendingUp                            },
  { id: "negotiation-notes",  icon: StickyNote                            },
  { id: "doc-generator",      icon: FileText                              },
  { id: "admin",              icon: ShieldCheck                           },
];

const EXPLANATIONS: Record<string, Record<string, string>> = {
  dashboard: {
    en: "Overview & key metrics",
    id: "Ringkasan & metrik bisnis",
    hi: "अवलोकन और मुख्य मेट्रिक्स",
    zh: "业务概览与关键指标",
    ar: "نظرة عامة والمقاييس الرئيسية",
  },
  inquiries: {
    en: "Manage buyer requests",
    id: "Kelola permintaan pembeli",
    hi: "खरीदार पूछताछ का प्रबंधन",
    zh: "管理买家询盘和需求",
    ar: "إدارة طلبات المشترين",
  },
  "buyer-crm": {
    en: "Client relationships",
    id: "Hubungan & data pelanggan",
    hi: "ग्राहक संबंध और डेटा",
    zh: "客户关系与往来记录",
    ar: "علاقات العملاء وسجلات البيانات",
  },
  shipments: {
    en: "Logistics tracking",
    id: "Pelacak kargo & logistik",
    hi: "रसद और कार्गो ट्रैकिंग",
    zh: "物流货运与出运跟踪",
    ar: "تتبع الشحنات والخدمات اللوجستية",
  },
  suppliers: {
    en: "Vendor connection list",
    id: "Jaringan penyuplai lokal",
    hi: "विक्रेता कनेक्शन सूची",
    zh: "本地供应商网络列表",
    ar: "قائمة الموردين المحليين",
  },
  commodities: {
    en: "Global market ticker",
    id: "Pantau harga pasar ekspor",
    hi: "वैश्विक बाजार मूल्य टिकर",
    zh: "全球出口市场价格行情",
    ar: "مؤشر أسعار أسواق التصدير",
  },
  "negotiation-notes": {
    en: "Tactical strategy logs",
    id: "Catatan strategi & taktik",
    hi: "सामरिक रणनीति नोट्स",
    zh: "谈判策略 with 备忘录",
    ar: "ملاحظات وتكتيكات التفاوض",
  },
  "doc-generator": {
    en: "AI document templates",
    id: "Buat invoice & draft AI",
    hi: "एआई दस्तावेज़ टेम्पलेट",
    zh: "使用 AI 自动生成出口单证",
    ar: "إنشاء قوالب مستندات التصدير",
  },
  admin: {
    en: "Admin Control Center",
    id: "Pusat Kontrol Admin",
    hi: "व्यवस्थापक नियंत्रण केंद्र",
    zh: "管理员控制中心",
    ar: "مركز التحكم للمشرف",
  },
  settings: {
    en: "Preferences & profile",
    id: "Profil & preferensi sistem",
    hi: "प्राथमिकताएं और प्रोफ़ाइल",
    zh: "系统偏好设置与个人资料",
    ar: "الملف الشخصي وتفضيلات النظام",
  },
};

export function Sidebar({
  activeTab,
  onTabChange,
  inquiryCount,
  shipmentCount,
  supplierCount,
  onLogout,
  isMobile = false,
  isAdmin = false,
}: SidebarProps) {
  const { t, language, isRtl } = useLanguage();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const counts: Record<string, number> = {
    inquiry:  inquiryCount,
    shipment: shipmentCount,
    supplier: supplierCount,
  };

  const tipPos   = isRtl ? "right-full mr-3" : "left-full ml-3";
  const tipArrow = isRtl
    ? "absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-slate-900"
    : "absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900";

  const showCollapsed = isCollapsed && !isMobile;

  const NavBtn = ({
    id,
    icon: Icon,
    countKey,
  }: {
    id: string;
    icon: React.ElementType;
    countKey?: string;
  }) => {
    const isActive = activeTab === id;
    const count    = countKey ? counts[countKey] : 0;

    return (
      <div className="relative group/nav w-full">
        <button
          id={`nav-${id}`}
          onClick={() => onTabChange(id)}
          className={`w-full h-11 flex items-center ${
            showCollapsed ? "justify-center" : "justify-start px-3.5 gap-3"
          } rounded-lg transition-all duration-150 cursor-pointer relative border ${
            isActive
              ? "bg-[#eff6ff] dark:bg-indigo-950/40 border-[#bfdbfe]/50 dark:border-indigo-900/50 text-[#1d4ed8] dark:text-[#93c5fd] shadow-sm font-semibold"
              : "bg-transparent border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-350"
          }`}
        >
          <Icon
            className={`w-4.5 h-4.5 shrink-0 transition-colors ${
              isActive ? "text-[#1d4ed8] dark:text-[#93c5fd]" : "text-slate-400 dark:text-slate-500"
            }`}
            strokeWidth={1.75}
          />
          
          {/* Explanation labels next to icon when expanded */}
          {!showCollapsed && (
            <div className="flex-1 text-left min-w-0 flex flex-col select-none">
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-250 truncate leading-tight">
                {t("common", id)}
              </span>
              <span className="text-[9px] text-slate-400 dark:text-slate-500 font-medium truncate mt-0.5 leading-none">
                {EXPLANATIONS[id]?.[language] || EXPLANATIONS[id]?.en || ""}
              </span>
            </div>
          )}

          {count > 0 && (
            <span
              className={`${
                showCollapsed
                  ? "absolute top-1.5 right-1.5 text-[7px]"
                  : "text-[8px] ml-auto shrink-0"
              } px-1.5 py-0.5 bg-[#1d4ed8] text-white font-black rounded-full leading-none`}
            >
              {count}
            </span>
          )}
        </button>

        {/* Tooltip ONLY when collapsed */}
        {showCollapsed && (
          <div
            className={`absolute ${tipPos} top-1/2 -translate-y-1/2 px-2.5 py-1.5 bg-slate-900 text-white text-[10px] font-bold rounded-xl pointer-events-none opacity-0 group-hover/nav:opacity-100 transition-all duration-150 z-60 whitespace-nowrap shadow-xl`}
          >
            {t("common", id)}
            <div className={tipArrow} />
          </div>
        )}
      </div>
    );
  };

  return (
    <aside
      className={`shrink-0 ${
        isMobile ? "w-full h-full flex" : "hidden md:flex w-60"
      } ${
        showCollapsed ? "w-17!" : ""
      } bg-white dark:bg-slate-900 flex flex-col py-5 z-20 ${
        isRtl ? "border-l" : "border-r"
      } border-slate-200 dark:border-slate-800 transition-all duration-300 ease-in-out`}
    >
      {/* ── Logo ── */}
      {showCollapsed ? (
        <div className="w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center mb-6 shrink-0 mx-auto">
          <img src="/logo.png" alt="Exopilot" className="w-8 h-8 object-contain" />
        </div>
      ) : (
        <div className="w-full px-4 flex items-center gap-3 mb-6 shrink-0 transition-all duration-300">
          <div className="w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center shrink-0">
            <img src="/logo.png" alt="Exopilot" className="w-8 h-8 object-contain" />
          </div>
          <div className="flex flex-col select-none">
            <span className="font-display font-black text-slate-800 dark:text-slate-200 text-sm tracking-wide leading-none">EXOPILOT</span>
            <span className="text-[8px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-widest mt-0.5">Export OS</span>
          </div>
        </div>
      )}

      {/* ── Main Nav ── */}
      <nav className="flex-1 flex flex-col gap-1 w-full px-2 overflow-y-auto">
        {NAV_ITEMS.filter((item) => item.id !== "admin" || isAdmin).map((item) => (
          <NavBtn key={item.id} {...item} />
        ))}
      </nav>

      {/* ── Bottom Panel ── */}
      <div className="flex flex-col gap-1 w-full px-2 shrink-0 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
        
        {/* Settings */}
        <NavBtn id="settings" icon={Settings} />

        {/* Logout */}
        <div className="relative group/nav w-full">
          <button
            onClick={onLogout}
            id="btn-logout"
            className={`w-full h-11 flex items-center ${
              showCollapsed ? "justify-center" : "justify-start px-3.5 gap-3"
            } rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all cursor-pointer border border-transparent hover:border-rose-100 dark:hover:border-rose-900/30`}
          >
            <LogOut className="w-4.5 h-4.5 text-slate-300 dark:text-slate-650 group-hover/nav:text-rose-500 transition-colors shrink-0" strokeWidth={1.75} />
            {!showCollapsed && (
              <div className="flex-1 text-left min-w-0 flex flex-col select-none">
                <span className="text-[11px] font-bold text-slate-555 dark:text-slate-400 group-hover/nav:text-rose-600 dark:group-hover/nav:text-rose-400 truncate leading-tight">
                  {t("common", "logout")}
                </span>
                <span className="text-[9px] text-slate-300 dark:text-slate-600 group-hover/nav:text-rose-400 dark:group-hover/nav:text-rose-500 font-medium truncate mt-0.5 leading-none">
                  {EXPLANATIONS.settings?.[language] === "Kelola preferensi" ? "Keluar dari sesi" : "End active session"}
                </span>
              </div>
            )}
          </button>
          
          {showCollapsed && (
            <div
              className={`absolute ${tipPos} top-1/2 -translate-y-1/2 px-2.5 py-1.5 bg-slate-900 text-white text-[10px] font-bold rounded-xl pointer-events-none opacity-0 group-hover/nav:opacity-100 transition-all duration-150 z-60 whitespace-nowrap shadow-xl`}
            >
              {t("common", "logout")}
              <div className={tipArrow} />
            </div>
          )}
        </div>

        {/* Collapse / Expand Toggle Button - Hide on mobile */}
        {!isMobile && (
          <div className="w-full mt-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className={`w-full h-10 flex items-center ${
                showCollapsed ? "justify-center" : "justify-between px-3.5"
              } rounded-lg hover:bg-slate-55/40 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-all border border-transparent hover:border-slate-200/60 dark:hover:border-slate-700/60 cursor-pointer`}
              title={showCollapsed ? "Expand Menu" : "Collapse Menu"}
            >
              {!showCollapsed && <span className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Collapse View</span>}
              {showCollapsed ? (
                isRtl ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
              ) : (
                isRtl ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />
              )}
            </button>
          </div>
        )}

      </div>
    </aside>
  );
}
