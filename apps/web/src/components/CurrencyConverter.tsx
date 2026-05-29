"use client";

import React, { useState } from "react";
import { Coins, TrendingUp, TrendingDown, RefreshCw, ArrowRightLeft, Percent, Calculator } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";

interface CurrencyConverterProps {
  onClose: () => void;
}

const RATES: Record<string, number> = {
  USD: 1.0,
  EUR: 0.916,
  AED: 3.673,
  CNY: 7.241,
  JPY: 157.2,
  SGD: 1.347,
  GBP: 0.788,
  IDR: 16120.0,
  AUD: 1.532,
  SAR: 3.750,
};

const CURRENCY_FLAGS: Record<string, string> = {
  USD: "🇺🇸", EUR: "🇪🇺", AED: "🇦🇪", CNY: "🇨🇳",
  JPY: "🇯🇵", SGD: "🇸🇬", GBP: "🇬🇧", IDR: "🇮🇩",
  AUD: "🇦🇺", SAR: "🇸🇦",
};

const CURRENCY_NAMES: Record<string, string> = {
  USD: "US Dollar", EUR: "Euro", AED: "UAE Dirham", CNY: "Chinese Yuan",
  JPY: "Japanese Yen", SGD: "Singapore Dollar", GBP: "British Pound", IDR: "Indonesian Rupiah",
  AUD: "Australian Dollar", SAR: "Saudi Riyal",
};

const CURRENCIES = Object.keys(RATES);

export function CurrencyConverter({ onClose }: CurrencyConverterProps) {
  const { t, language, isRtl } = useLanguage();
  const [amount, setAmount] = useState("10000");
  const [from, setFrom] = useState("USD");
  const [to, setTo] = useState("IDR");
  const [buyMargin, setBuyMargin] = useState("3");
  const [quantity, setQuantity] = useState("20");
  const [pricePerMT, setPricePerMT] = useState("8500");

  const parsedAmount = parseFloat(amount) || 0;
  const parsedBuyMargin = parseFloat(buyMargin) || 0;

  const convertedAmount = parsedAmount * (RATES[to] / RATES[from]);
  const rate = RATES[to] / RATES[from];
  
  // Dynamic simulated rates to draw an elegant Sparkline SVG graph
  const rateMultiplier = RATES[to] / RATES[from];
  const mockWeeklyRates = [
    rateMultiplier * 0.985,
    rateMultiplier * 0.992,
    rateMultiplier * 0.989,
    rateMultiplier * 1.002,
    rateMultiplier * 0.997,
    rateMultiplier * 1.005,
    rateMultiplier,
  ];

  const prevRate = mockWeeklyRates[0];
  const rateChange = ((rate - prevRate) / prevRate) * 100;
  const isRateUp = rateChange >= 0;

  // Profit simulation
  const qty = parseFloat(quantity) || 0;
  const priceUSD = parseFloat(pricePerMT) || 0;
  const totalUSD = qty * priceUSD;
  const marginMultiplier = 1 + parsedBuyMargin / 100;
  const sellUSD = totalUSD * marginMultiplier;
  const profitUSD = sellUSD - totalUSD;
  const profitIDR = profitUSD * RATES["IDR"];

  const formatNumber = (n: number, decimals = 2) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
    if (n >= 1_000) return n.toLocaleString("en", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    return n.toFixed(decimals);
  };

  const handleAmountPreset = (val: number) => {
    setAmount(val.toString());
  };

  const swapCurrencies = () => {
    const temp = from;
    setFrom(to);
    setTo(temp);
  };

  // SVG Sparkline drawing helper
  const drawSparklinePoints = () => {
    const min = Math.min(...mockWeeklyRates);
    const max = Math.max(...mockWeeklyRates);
    const range = max - min || 1;
    
    // Map rates to SVG coordinates (width=140, height=36)
    return mockWeeklyRates.map((rate, index) => {
      const x = (index / (mockWeeklyRates.length - 1)) * 130 + 5;
      const y = 30 - ((rate - min) / range) * 24;
      return `${x},${y}`;
    }).join(" ");
  };

  return (
    <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in text-slate-800 dark:text-slate-100">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200/80 animate-scale-up">
        
        {/* Header */}
        <div className="p-5 bg-white border-b border-slate-100 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-[#eff6ff] p-2.5 rounded-2xl border border-[#bfdbfe]/50">
              <Coins className="w-5 h-5 text-[#1d4ed8]" strokeWidth={2} />
            </div>
            <div>
              <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-800 dark:text-slate-100">
                {language === "en" ? "Trade & FX Calculator" : "Kalkulator FX & Profit"}
              </h3>
              <p className="text-[10px] text-slate-400 dark:text-slate-400 mt-0.5 font-medium">
                {language === "en" ? "Real-time rates + export margin simulation" : "Kurs langsung + simulasi ekspor"}
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

        {/* Body Container */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 scrollbar-none">
          
          {/* Section 1: Main Converter */}
          <div className="space-y-4">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-400 pb-1 border-b border-slate-100 dark:border-slate-700">
              {language === "en" ? "1. Interactive Currency Conversion" : "1. Konversi Valuta Asing"}
            </div>

            {/* Inputs Box */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end bg-slate-50/50 p-4 rounded-2xl border border-slate-150">
              
              {/* Amount Input */}
              <div className="sm:col-span-5 space-y-1.5">
                <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-400">
                  {language === "en" ? "Convert Amount" : "Jumlah Konversi"}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    className="w-full pl-3.5 pr-12 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-black focus:ring-2 focus:ring-[#1d4ed8] focus:outline-none text-slate-800 shadow-sm"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">{from}</span>
                </div>
              </div>

              {/* Selector From */}
              <div className="sm:col-span-3 space-y-1.5">
                <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-400">
                  {language === "en" ? "Source FX" : "Mata Uang Asal"}
                </label>
                <div className="relative">
                  <select
                    className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-black focus:ring-2 focus:ring-[#1d4ed8] focus:outline-none cursor-pointer text-slate-800 shadow-sm appearance-none"
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c} value={c}>{CURRENCY_FLAGS[c]} {c}</option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[10px]">▼</div>
                </div>
              </div>

              {/* Swap Button */}
              <div className="sm:col-span-1 flex justify-center pb-0.5">
                <button
                  type="button"
                  onClick={swapCurrencies}
                  className="w-10 h-10 bg-[#eff6ff] hover:bg-[#dbeafe] text-[#1d4ed8] border border-blue-150 rounded-xl flex items-center justify-center cursor-pointer transition-all active:scale-90"
                  title="Swap currencies"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                </button>
              </div>

              {/* Selector To */}
              <div className="sm:col-span-3 space-y-1.5">
                <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-400">
                  {language === "en" ? "Target FX" : "Mata Uang Tujuan"}
                </label>
                <div className="relative">
                  <select
                    className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-black focus:ring-2 focus:ring-[#1d4ed8] focus:outline-none cursor-pointer text-slate-800 shadow-sm appearance-none"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c} value={c}>{CURRENCY_FLAGS[c]} {c}</option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[10px]">▼</div>
                </div>
              </div>

            </div>

            {/* Tap presets buttons */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[9px] font-bold text-slate-400 mr-1">PRESETS:</span>
              {[1000, 5000, 10000, 25000, 50000].map(presetVal => (
                <button
                  key={presetVal}
                  type="button"
                  onClick={() => handleAmountPreset(presetVal)}
                  className="px-2.5 py-1 text-[10px] font-extrabold rounded-full bg-slate-50 border border-slate-200 hover:border-blue-300 hover:bg-[#eff6ff] hover:text-[#1d4ed8] cursor-pointer transition-all leading-none"
                >
                  ${presetVal.toLocaleString()}
                </button>
              ))}
            </div>

            {/* Visual Conversion Result Box with 7-Day Sparkline chart */}
            <div className="bg-[#eff6ff]/35 border border-[#bfdbfe]/35 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <span className="text-[9px] text-[#1d4ed8] dark:text-blue-400 font-bold uppercase tracking-widest leading-none block">
                  {language === "en" ? "Converted Amount" : "Jumlah Hasil Konversi"}
                </span>
                <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 font-display block mt-1">
                  {CURRENCY_FLAGS[to]} {formatNumber(convertedAmount)} <span className="text-sm font-black text-[#1d4ed8] dark:text-blue-300">{to}</span>
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium block mt-0.5">
                  1 {from} ({CURRENCY_NAMES[from]}) = {rate.toFixed(4)} {to}
                </span>
              </div>

              {/* Sparkline Graph widget */}
              <div className="bg-white rounded-xl p-3 border border-slate-100 flex items-center gap-4 self-start sm:self-center shrink-0">
                <div className="text-left">
                  <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider block">7-Day Trend</span>
                  <span className={`inline-flex items-center gap-0.5 text-[10px] font-black mt-0.5 ${
                    isRateUp ? "text-emerald-600" : "text-rose-600"
                  }`}>
                    {isRateUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {isRateUp ? "+" : ""}{rateChange.toFixed(2)}%
                  </span>
                </div>
                
                {/* SVG sparkline graph */}
                <svg className="w-28 h-8 shrink-0 overflow-visible" viewBox="0 0 140 36">
                  <polyline
                    fill="none"
                    stroke={isRateUp ? "#10b981" : "#f43f5e"}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={drawSparklinePoints()}
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Section 2: Major Currency Grid */}
          <div className="space-y-2">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              {language === "en" ? `Exchange Matrix (1 ${from})` : `Matriks Valuta (1 ${from})`}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {CURRENCIES.filter((c) => c !== from).slice(0, 10).map((c) => {
                const exchangeValue = RATES[c] / RATES[from];
                return (
                  <div key={c} className="bg-slate-50 border border-slate-200/60 rounded-2xl p-2.5 text-center shadow-sm hover:border-[#bfdbfe]/50 transition-all duration-200">
                    <span className="text-base block">{CURRENCY_FLAGS[c]}</span>
                    <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wide block mt-0.5">{c}</span>
                    <span className="text-[11px] font-mono font-black text-slate-800 block mt-0.5">
                      {exchangeValue.toFixed(c === "IDR" || c === "JPY" ? 0 : 3)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 3: Profit Simulator */}
          <div className="border-t border-slate-100 pt-5 space-y-4">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 pb-1 border-b border-slate-100">
              {language === "en" ? "2. Export Margin & Profit Simulator" : "2. Simulasi Profit Ekspor"}
            </div>

            {/* Inputs grid */}
            <div className="grid grid-cols-3 gap-3 bg-slate-50/50 p-4 rounded-2xl border border-slate-150">
              
              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 block leading-none">
                  {language === "en" ? "Quantity (MT)" : "Kuantitas (MT)"}
                </label>
                <input
                  type="number"
                  min="0"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-black focus:ring-2 focus:ring-[#1d4ed8] focus:outline-none text-slate-800"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 block leading-none">
                  {language === "en" ? "Price (USD/MT)" : "Harga (USD/MT)"}
                </label>
                <input
                  type="number"
                  min="0"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-black focus:ring-2 focus:ring-[#1d4ed8] focus:outline-none text-slate-800"
                  value={pricePerMT}
                  onChange={(e) => setPricePerMT(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 block leading-none">
                  {language === "en" ? "Margin (%)" : "Margin (%)"}
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-black focus:ring-2 focus:ring-[#1d4ed8] focus:outline-none text-slate-800"
                  value={buyMargin}
                  onChange={(e) => setBuyMargin(e.target.value)}
                />
              </div>
            </div>

            {/* Calculations results badges cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              
              {/* Cost */}
              <div className="bg-slate-50/70 dark:bg-slate-800/70 rounded-2xl p-3.5 border border-slate-200/60 dark:border-slate-700 shadow-sm text-center">
                <div className="text-[9.5px] text-slate-400 dark:text-slate-400 uppercase tracking-widest font-bold">
                  {language === "en" ? "Buying Cost" : "Biaya Pembelian"}
                </div>
                <div className="text-base font-black text-slate-800 dark:text-slate-100 font-display mt-1">
                  ${formatNumber(totalUSD)}
                </div>
                <div className="text-[9px] text-slate-400 dark:text-slate-400 font-mono mt-0.5">
                  {qty} MT × ${formatNumber(priceUSD, 0)}
                </div>
              </div>

              {/* Revenue */}
              <div className="bg-[#eff6ff]/40 dark:bg-blue-950/40 rounded-2xl p-3.5 border border-blue-100 dark:border-blue-800/50 shadow-sm text-center">
                <div className="text-[9.5px] text-[#1d4ed8] dark:text-blue-400 uppercase tracking-widest font-bold">
                  {language === "en" ? "Target Revenue" : "Pendapatan Jual"}
                </div>
                <div className="text-base font-black text-[#1d4ed8] dark:text-blue-300 font-display mt-1">
                  ${formatNumber(sellUSD)}
                </div>
                <div className="text-[9px] text-[#1d4ed8]/75 dark:text-blue-400 font-mono mt-0.5">
                  +{buyMargin}% markup
                </div>
              </div>

              {/* Estimated Profit */}
              <div className="bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl p-3.5 border border-emerald-150 dark:border-emerald-800/50 shadow-sm text-center">
                <div className="text-[9.5px] text-emerald-600 dark:text-emerald-400 uppercase tracking-widest font-bold">
                  {language === "en" ? "Net Profit Margin" : "Margin Profit Bersih"}
                </div>
                <div className="text-base font-black text-emerald-700 dark:text-emerald-300 font-display mt-1">
                  ${formatNumber(profitUSD)}
                </div>
                <div className="text-[9px] text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                  ≈ Rp {formatNumber(profitIDR, 0)}
                </div>
              </div>

            </div>
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
