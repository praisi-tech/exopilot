"use client";

import React, { useState } from "react";
import { Scale, Package, HelpCircle, Info, Minus, Plus } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";

interface ContainerCalculatorProps {
  onClose: () => void;
}

const PRESETS = [
  { labelId: "gunny", labelEn: "Gunny Bag", labelHi: "बोरी", labelZh: "麻袋", labelAr: "خيش", labelIdVal: "Karung 50kg", l: 60, w: 40, h: 25, wt: 50, desc: "Standard 50kg bag" },
  { labelId: "carton", labelEn: "Carton Box", labelHi: "कार्टन", labelZh: "纸箱", labelAr: "كرتون", labelIdVal: "Karton 25kg", l: 45, w: 35, h: 30, wt: 25, desc: "Medium 25kg box" },
  { labelId: "ppbag", labelEn: "PP Bag", labelHi: "पीपी बैग", labelZh: "PP 袋", labelAr: "حقيبة PP", labelIdVal: "PP Bag 25kg", l: 55, w: 40, h: 18, wt: 25, desc: "Flat 25kg woven bag" },
];

const CONTAINERS = [
  { label: "20ft GP", volM3: 28.0, maxWtKg: 21500, color: "text-[#1d4ed8]", strokeColor: "border-blue-200 bg-blue-50/50" },
  { label: "40ft GP", volM3: 58.0, maxWtKg: 26500, color: "text-[#1d4ed8]", strokeColor: "border-indigo-200 bg-indigo-50/50" },
  { label: "40ft HQ", volM3: 67.5, maxWtKg: 26500, color: "text-purple-600", strokeColor: "border-purple-200 bg-purple-50/50" },
];

export function ContainerCalculator({ onClose }: ContainerCalculatorProps) {
  const { t, language, isRtl } = useLanguage();
  const [form, setForm] = useState({ bagLength: 60, bagWidth: 40, bagHeight: 25, bagWeight: 50 });
  const [activePreset, setActivePreset] = useState("Gunny Bag");

  const bagVolCm = form.bagLength * form.bagWidth * form.bagHeight;
  const bagVolM3 = bagVolCm / 1_000_000;

  const handlePresetSelect = (p: typeof PRESETS[0]) => {
    setForm({ bagLength: p.l, bagWidth: p.w, bagHeight: p.h, bagWeight: p.wt });
    setActivePreset(p.labelEn);
  };

  const getDimensionLabel = (field: "bagLength" | "bagWidth" | "bagHeight") => {
    if (field === "bagLength") return language === "en" ? "Length" : language === "hi" ? "लंबाई" : language === "zh" ? "长度" : language === "ar" ? "الطول" : "Panjang";
    if (field === "bagWidth") return language === "en" ? "Width" : language === "hi" ? "चौड़ाई" : language === "zh" ? "宽度" : language === "ar" ? "العرض" : "Lebar";
    return language === "en" ? "Height" : language === "hi" ? "ऊंचाई" : language === "zh" ? "高度" : language === "ar" ? "الارتفاع" : "Tinggi";
  };

  const getPresetLabel = (p: typeof PRESETS[0]) => {
    if (language === "en") return p.labelEn;
    if (language === "hi") return p.labelHi;
    if (language === "zh") return p.labelZh;
    if (language === "ar") return p.labelAr;
    return p.labelIdVal;
  };

  const adjustValue = (field: keyof typeof form, delta: number) => {
    setForm(prev => {
      const val = Math.max(1, prev[field] + delta);
      return { ...prev, [field]: val };
    });
    setActivePreset("");
  };

  return (
    <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in text-slate-800 dark:text-slate-100">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200/80 dark:border-slate-700 animate-scale-up">
        
        {/* Header */}
        <div className="p-5 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-[#eff6ff] p-2.5 rounded-2xl border border-[#bfdbfe]/50">
              <Scale className="w-5 h-5 text-[#1d4ed8]" strokeWidth={2} />
            </div>
            <div>
              <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-800 dark:text-slate-100">
                {t("calculator", "title")}
              </h3>
              <p className="text-[10px] text-slate-400 dark:text-slate-400 mt-0.5 font-medium">
                {t("calculator", "subtitle")}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-50 hover:bg-slate-100 active:scale-95 text-slate-400 hover:text-slate-600 transition-all font-semibold cursor-pointer text-base"
          >
            ×
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-6 scrollbar-none">
          
          {/* Left: Input Dashboard Controls (7 cols) */}
          <div className="md:col-span-7 space-y-5">
            
            {/* Presets Grid */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                {language === "en" ? "Select Package TypePreset" :
                 language === "hi" ? "पैकेज प्रकार चुनें" :
                 language === "zh" ? "选择包装类型预设" :
                 language === "ar" ? "اختر نوع العبوة" :
                 "Pilih Tipe Paket Presets"}
              </label>
              
              <div className="grid grid-cols-3 gap-2.5">
                {PRESETS.map((p) => {
                  const isSelected = activePreset === p.labelEn;
                  return (
                    <button
                      key={p.labelEn}
                      type="button"
                      onClick={() => handlePresetSelect(p)}
                      className={`text-left p-2.5 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? "bg-[#eff6ff] border-[#1d4ed8] shadow-sm text-[#1d4ed8]"
                          : "bg-slate-50/50 border-slate-200/80 hover:bg-slate-50 text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      <Package className={`w-4 h-4 mb-1.5 shrink-0 ${isSelected ? "text-[#1d4ed8]" : "text-slate-400"}`} strokeWidth={2} />
                      <div>
                        <span className="text-[10px] font-black tracking-tight leading-none block">{getPresetLabel(p)}</span>
                        <span className="text-[8px] text-slate-400 leading-none mt-0.5 block">{p.wt} kg</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Adjustable Dimensions Inputs */}
            <div className="bg-slate-50/50 border border-slate-150 p-4 rounded-2xl space-y-4">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block border-b border-slate-100 pb-1">
                {language === "en" ? "Package Dimensions" : "Dimensi Paket"}
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(["bagLength", "bagWidth", "bagHeight"] as const).map((field) => (
                  <div key={field} className="space-y-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase block">{getDimensionLabel(field)} (cm)</span>
                    <div className="flex items-center bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                      <button
                        type="button"
                        onClick={() => adjustValue(field, -5)}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 cursor-pointer transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <input
                        type="number"
                        min="1"
                        className="w-full text-center py-1.5 text-xs font-black focus:outline-none text-slate-800 border-none bg-transparent"
                        value={form[field]}
                        onChange={(e) => {
                          const val = Math.max(1, parseInt(e.target.value) || 1);
                          setForm({ ...form, [field]: val });
                          setActivePreset("");
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => adjustValue(field, 5)}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 cursor-pointer transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Weight Adjustment */}
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-slate-400 uppercase block">
                  {language === "en" ? "Unit Weight (kg)" : "Berat per Unit (kg)"}
                </span>
                <div className="flex items-center bg-white border border-slate-200 rounded-xl max-w-xs shadow-sm">
                  <button
                    type="button"
                    onClick={() => adjustValue("bagWeight", -5)}
                    className="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <input
                    type="number"
                    min="1"
                    className="w-full text-center py-1.5 text-xs font-black focus:outline-none text-slate-800 border-none bg-transparent"
                    value={form.bagWeight}
                    onChange={(e) => {
                      const val = Math.max(1, parseInt(e.target.value) || 1);
                      setForm({ ...form, bagWeight: val });
                      setActivePreset("");
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => adjustValue("bagWeight", 5)}
                    className="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                  <span className="bg-slate-100/80 text-slate-500 px-3 py-2 text-[10px] font-bold select-none border-l border-slate-200">KG</span>
                </div>
              </div>
            </div>

            {/* Calculations metrics summary */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#eff6ff]/30 dark:bg-blue-950/30 border border-[#bfdbfe]/30 dark:border-blue-800/30 rounded-2xl p-3.5">
                <div className="text-[9px] font-bold text-slate-400 dark:text-blue-400 uppercase tracking-widest leading-none">
                  {language === "en" ? "Unit Volume" : "Volume per unit"}
                </div>
                <div className="text-lg font-black text-[#1d4ed8] dark:text-blue-300 mt-1 font-mono leading-none">
                  {bagVolM3.toFixed(4)} <span className="text-[10px] font-bold">m³</span>
                </div>
                <div className="text-[9px] text-slate-400 dark:text-blue-400 font-mono mt-1">
                  {bagVolCm.toLocaleString()} cm³
                </div>
              </div>

              <div className="bg-emerald-50/30 dark:bg-emerald-950/30 border border-emerald-200/30 dark:border-emerald-800/30 rounded-2xl p-3.5 flex flex-col justify-between">
                <div>
                  <div className="text-[9px] font-bold text-slate-400 dark:text-emerald-400 uppercase tracking-widest leading-none">
                    {language === "en" ? "Estimated Density" : "Estimasi Kepadatan"}
                  </div>
                  <div className="text-lg font-black text-emerald-700 dark:text-emerald-300 mt-1 font-mono leading-none">
                    {(form.bagWeight / bagVolM3).toFixed(1)} <span className="text-[10px] font-bold">kg/m³</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Info Limits Box */}
            <div className="p-3 bg-amber-50/50 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-800/50 text-amber-800 dark:text-amber-200 rounded-2xl flex items-start gap-2.5">
              <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="text-[9.5px] leading-relaxed">
                <strong className="font-extrabold uppercase tracking-wide">
                  {language === "en" ? "Capacity Limit Rules" : "Aturan Kapasitas Kontainer"}
                </strong>
                <p className="text-slate-600 dark:text-amber-300/80 mt-0.5">
                  Calculations factor in both **Volume (m³)** and standard **Payload Weight Limits** (e.g. 21.5 MT for 20ft GP). The actual limit will indicate if payload hits space constraints first (*Vol Limited*) or weight restrictions first (*Wt Limited*).
                </p>
              </div>
            </div>

          </div>

          {/* Right: Results + Dynamic filled illustration cards (5 cols) */}
          <div className="md:col-span-5 space-y-4">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
              {language === "en" ? "Container Capacity Results" : "Hasil Kapasitas Kontainer"}
            </label>

            {CONTAINERS.map((cont) => {
              const byVol = Math.floor(cont.volM3 / bagVolM3);
              const byWt = Math.floor(cont.maxWtKg / form.bagWeight);
              const finalBags = Math.min(byVol, byWt);
              const finalWtMT = (finalBags * form.bagWeight) / 1000;
              const utilVol = Math.min((finalBags * bagVolM3 / cont.volM3) * 100, 100);
              const isVolLimited = byVol < byWt;

              return (
                <div
                  key={cont.label}
                  className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm hover:border-[#bfdbfe]/50 hover:shadow-md transition-all duration-200 relative overflow-hidden group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black text-slate-800 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-200/60">
                      {cont.label}
                    </span>
                    <span className={`text-[8px] font-extrabold px-2 py-0.5 rounded-full ${
                      isVolLimited
                        ? "bg-sky-50 text-sky-700 border border-sky-100"
                        : "bg-amber-50 text-amber-700 border border-amber-100"
                    }`}>
                      {isVolLimited ? "Vol Limited" : "Weight Limited"}
                    </span>
                  </div>

                  {/* Large Output number */}
                  <div className="flex items-baseline gap-1.5 mt-1.5">
                    <span className="text-2xl font-black font-display text-slate-900 leading-none tracking-tight">
                      {finalBags.toLocaleString()}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                      {language === "en" ? "packages" : "paket"}
                    </span>
                  </div>

                  {/* Weight payload summary */}
                  <div className="text-[10px] text-slate-500 font-medium mt-1">
                    {language === "en" ? "Total payload weight:" : "Total payload berat:"} <strong className="text-slate-800">{finalWtMT.toFixed(2)} MT</strong>
                  </div>

                  {/* Filled illustrative graphic progress bar */}
                  <div className="mt-3.5">
                    <div className="flex items-center justify-between text-[9px] font-bold text-slate-400 mb-1">
                      <span>{language === "en" ? "Space Utilized" : "Utilitas Ruang"}</span>
                      <span className="font-mono text-[#1d4ed8]">{utilVol.toFixed(0)}%</span>
                    </div>
                    
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          utilVol > 90
                            ? "bg-emerald-500"
                            : utilVol > 70
                            ? "bg-[#1d4ed8]"
                            : "bg-amber-400"
                        }`}
                        style={{ width: `${utilVol}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>

        {/* Footer */}
        <div className="px-5 py-4 bg-slate-50/50 border-t border-slate-100 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-2xl bg-[#1d4ed8] hover:bg-blue-700 text-white font-black text-xs cursor-pointer shadow-md hover:shadow-lg active:scale-95 transition-all"
          >
            {t("common", "close")}
          </button>
        </div>

      </div>
    </div>
  );
}
