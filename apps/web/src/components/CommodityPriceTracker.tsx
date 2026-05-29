import React, { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, RefreshCw, Calendar, Search, Radio } from "lucide-react";

interface CommodityPriceTrackerProps {
  commodities: any[];
  globalSearch?: string;
}

export function CommodityPriceTracker({ commodities, globalSearch }: CommodityPriceTrackerProps) {
  const [search, setSearch] = useState("");
  const [selectedCommodity, setSelectedCommodity] = useState<any | null>(null);
  const [isLive, setIsLive] = useState(true);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date>(new Date());
  const [priceUpdates, setPriceUpdates] = useState<Record<string, number>>({});

  // Sync globalSearch from parent
  useEffect(() => {
    if (globalSearch !== undefined) {
      setSearch(globalSearch);
    }
  }, [globalSearch]);

  // Simulate real-time price updates
  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      setPriceUpdates((prev) => {
        const updates = { ...prev };
        commodities.forEach((c) => {
          const randomChange = (Math.random() - 0.5) * 2;
          updates[c.commodity] = randomChange;
        });
        return updates;
      });
      setLastUpdateTime(new Date());
    }, 3000); // Update every 3 seconds

    return () => clearInterval(interval);
  }, [isLive, commodities]);

  const filtered = commodities.filter((c) =>
    c.commodity.toLowerCase().includes(search.toLowerCase())
  );

  // If no commodity is selected, select the first one by default
  const active = selectedCommodity ?? filtered[0] ?? null;

  // Generate SVG path for historical chart
  const renderSparkline = (points: { price: number }[], width = 200, height = 40) => {
    if (!points || points.length === 0) return "";
    const prices = points.map((p) => p.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min || 1;

    const coords = points.map((p, i) => {
      const x = (i / (points.length - 1)) * width;
      const y = height - ((p.price - min) / range) * height;
      return `${x},${y}`;
    });

    return `M ${coords.join(" L ")}`;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Market Prices</h2>
          <p className="text-[11px] text-slate-400 mt-0.5">Real-time global agricultural commodity exchange trackers</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsLive(!isLive)}
            className={`flex items-center gap-2 text-[10px] font-bold px-3 py-1.5 rounded-xl border transition-all ${
              isLive
                ? "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                : "bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-150"
            }`}
          >
            <Radio className={`w-3 h-3 ${isLive ? "text-emerald-600" : "text-slate-400"}`} />
            <span>{isLive ? "LIVE" : "OFF"}</span>
          </button>
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Last: {lastUpdateTime.toLocaleTimeString()}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: List */}
        <div className="lg:col-span-1 space-y-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search commodity name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder:text-slate-400"
            />
          </div>

          <div className="space-y-2">
            {filtered.map((c) => {
              const isActive = active?.commodity === c.commodity;
              const isUp = c.change24h >= 0;
              return (
                <button
                  key={c.commodity}
                  onClick={() => setSelectedCommodity(c)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                    isActive
                      ? "bg-slate-900 border-slate-900 text-white shadow-xl shadow-slate-900/10"
                      : "bg-white border-slate-150 text-slate-800 hover:border-slate-350 card-shadow"
                  }`}
                >
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider">{c.commodity}</h3>
                    <p className={`text-[9px] mt-0.5 font-bold ${isActive ? "text-slate-400" : "text-slate-400"}`}>
                      {c.currency} / {c.unit}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-extrabold">${c.currentPrice.toLocaleString()}</p>
                    <span className={`inline-flex items-center gap-0.5 text-[9px] font-black mt-0.5 px-1.5 py-0.5 rounded-full ${
                      isActive
                        ? isUp ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300"
                        : isUp ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                    }`}>
                      {isUp ? "+" : ""}{c.change24h}%
                    </span>
                    {isLive && priceUpdates[c.commodity] && (
                      <span className={`inline-flex items-center gap-0.5 text-[9px] font-black mt-0.5 px-1.5 py-0.5 rounded-full ml-1 ${
                        priceUpdates[c.commodity] > 0
                          ? isActive ? "bg-emerald-500/20 text-emerald-300" : "bg-emerald-50 text-emerald-700"
                          : isActive ? "bg-rose-500/20 text-rose-300" : "bg-rose-50 text-rose-700"
                      }`}>
                        {priceUpdates[c.commodity] > 0 ? "↑" : "↓"} {Math.abs(priceUpdates[c.commodity]).toFixed(2)}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right column: Details / Sparkline Chart */}
        <div className="lg:col-span-2">
          {active ? (
            <div className="bg-white p-6 rounded-3xl border border-slate-150 card-shadow space-y-6">
              {/* Header inside */}
              <div className="flex items-start justify-between flex-wrap gap-4 pb-4 border-b border-slate-100">
                <div>
                  <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Selected Commodity</span>
                  <h3 className="text-lg font-black text-slate-800 tracking-tight mt-0.5">{active.commodity} Pricing Index</h3>
                </div>
                <div className="flex items-center gap-4 text-xs font-bold text-slate-700 bg-slate-50 border border-slate-150 p-2.5 rounded-xl">
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase">Rate (USD)</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-xs font-black">${active.currentPrice.toLocaleString()}</p>
                      {isLive && priceUpdates[active?.commodity] && (
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                          priceUpdates[active.commodity] > 0
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-rose-100 text-rose-700"
                        }`}>
                          {priceUpdates[active.commodity] > 0 ? "↑" : "↓"} {Math.abs(priceUpdates[active.commodity]).toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="border-l border-slate-200 pl-3">
                    <span className="text-[9px] font-bold text-slate-400 uppercase">24h Gain</span>
                    <p className={`mt-0.5 text-xs font-black ${active.change24h >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                      {active.change24h >= 0 ? "+" : ""}{active.change24h}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Chart sparkline */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <span>30-Day price movement</span>
                  <span>USD per Metric Ton</span>
                </div>
                <div className="h-48 w-full border border-slate-100 bg-slate-50/50 rounded-2xl p-4 flex flex-col justify-between sparkline-container">
                  <svg className="w-full h-full" viewBox="0 0 500 150" preserveAspectRatio="none">
                    <path
                      d={renderSparkline(active.historicalData, 500, 130)}
                      fill="none"
                      stroke="#4f46e5"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <div className="flex justify-between text-[9px] font-bold text-slate-400 mt-2">
                    <span>30 days ago</span>
                    <span>Today ({active.historicalData?.[29]?.date})</span>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: "High (30d)", value: `$${Math.max(...(active.historicalData?.map((h: any) => h.price) ?? [0])).toLocaleString()}` },
                  { label: "Low (30d)", value: `$${Math.min(...(active.historicalData?.map((h: any) => h.price) ?? [0])).toLocaleString()}` },
                  { label: "7-Day Change", value: `${active.change7d >= 0 ? "+" : ""}${active.change7d}%`, color: active.change7d >= 0 ? "text-emerald-600" : "text-rose-600" },
                  { label: "Contract Base", value: "FOB Jakarta Port" }
                ].map((s, i) => (
                  <div key={i} className="p-3 bg-slate-50 border border-slate-150 rounded-xl">
                    <span className="text-[9px] font-bold text-slate-400 uppercase">{s.label}</span>
                    <p className={`text-xs font-black text-slate-700 mt-0.5 ${s.color ?? ""}`}>{s.value}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-150 rounded-3xl p-12 text-center card-shadow">
              <p className="text-xs text-slate-400">Select a commodity to view price performance index.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
