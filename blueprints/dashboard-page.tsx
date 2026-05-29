// app/dashboard/page.tsx
"use client";

import React, { useState } from "react";
import {
  LayoutDashboard,
  UsersInboxes,
  Compass,
  FileText,
  Ship,
  TrendingUp,
  MapPin,
  ClipboardSpreadsheet,
  Plus,
  Mail,
  ShieldCheck,
  Globe,
  Loader2
} from "lucide-react";

// Local spice mock data for immediate layout render
const initialInquiries = [
  {
    id: "inq_1",
    buyerName: "Klausen Spice GmbH",
    country: "Germany",
    product: "Nutmeg (ABCD Grade)",
    quantity: "15 MT",
    status: "Negotiating",
    date: "2026-05-18"
  },
  {
    id: "inq_2",
    buyerName: "Tokyo Organic Imports",
    country: "Japan",
    product: "Cloves (Lal Pari Grade)",
    quantity: "8 MT",
    status: "Closed",
    date: "2026-05-20"
  },
  {
    id: "inq_3",
    buyerName: "Singapore Spice Trading Hub",
    country: "Singapore",
    product: "Mace (Whole High Grade)",
    quantity: "2 MT",
    status: "New",
    date: "2026-05-22"
  },
  {
    id: "inq_4",
    buyerName: "Sultan Spice Co.",
    country: "Turkey",
    product: "Cassia Cinnamon (Split)",
    quantity: "20 MT",
    status: "Negotiating",
    date: "2026-05-23"
  }
];

export default function ExopilotDashboard() {
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [inquiries, setInquiries] = useState(initialInquiries);
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState({ buyerName: "", country: "", product: "Nutmeg", quantity: "10 MT" });
  
  // Stats summary counts
  const totalInquiries = inquiries.length;
  const activeShipments = 3;
  const sourcingSuppliers = 8;

  const handleAddInquiry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.buyerName || !form.country || !form.quantity) return;
    
    const newInquiry = {
      id: "inq_" + Date.now(),
      buyerName: form.buyerName,
      country: form.country,
      product: form.product,
      quantity: form.quantity,
      status: "New" as const,
      date: new Date().toISOString().split("T")[0]
    };
    
    setInquiries([newInquiry, ...inquiries]);
    setForm({ buyerName: "", country: "", product: "Nutmeg", quantity: "10 MT" });
    setShowAddModal(false);
  };

  return (
    <div className="flex h-screen bg-[#F6F8FC] font-sans antialiased text-gray-800">
      
      {/* 1. MINIMALIST NAVIGATION SIDEBAR */}
      <aside className="w-64 bg-white border-r border-gray-150 flex flex-col justify-between">
        <div>
          {/* Brand/Logo */}
          <div className="p-6 border-b border-gray-100 flex items-center gap-3">
            <div className="bg-gradient-to-tr from-pink-500 to-indigo-600 p-2 rounded-xl text-white shadow-md">
              <Ship className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-extrabold text-lg tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-indigo-950">
                EXOPILOT
              </h1>
              <span className="text-[10px] font-semibold text-indigo-600 tracking-widest uppercase">
                Spice OS
              </span>
            </div>
          </div>

          {/* Navigation Menus */}
          <nav className="p-4 space-y-1.5">
            {[
              { name: "Dashboard", icon: LayoutDashboard },
              { name: "Inquiries", icon: ClipboardSpreadsheet },
              { name: "Shipments", icon: Ship },
              { name: "Document Generator", icon: FileText }
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.name;
              return (
                <button
                  key={item.name}
                  onClick={() => setActiveTab(item.name)}
                  className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-300 font-medium ${
                    isActive
                      ? "bg-indigo-50 text-indigo-700 shadow-sm border-l-4 border-indigo-600"
                      : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? "text-indigo-600" : "text-gray-400"}`} />
                  <span className="text-sm">{item.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Co-Op SME Indonesia Indicator */}
        <div className="p-4 mx-4 mb-6 rounded-2xl bg-gradient-to-tr from-indigo-900 via-indigo-950 to-slate-900 text-white shadow-xl relative overflow-hidden">
          <div className="absolute right-[-10px] bottom-[-10px] opacity-10">
            <Globe className="w-24 h-24" />
          </div>
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-[9px] uppercase tracking-wider text-indigo-300 font-bold">
              Verified Co-Op Export
            </span>
          </div>
          <h4 className="text-xs font-semibold leading-snug">PT Rempah Indo Abadi</h4>
          <p className="text-[10px] text-gray-300 mt-1">Origin: East Indonesia Group</p>
        </div>
      </aside>

      {/* MAIN LAYOUT CANVAS */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        {/* Top Operational Header */}
        <header className="bg-white border-b border-gray-150 h-16 px-8 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-sm font-semibold tracking-tight text-gray-500 uppercase">
              Sumatra-Ambon Logistics Gateway Active
            </h2>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs font-bold">Praisilia Anastasya</p>
              <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-widest">
                Export Director
              </p>
            </div>
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-rose-400 to-indigo-500 text-white font-extrabold text-xs flex items-center justify-center shadow-md">
              PA
            </div>
          </div>
        </header>

        {/* Dashboard Workspace */}
        <div className="p-8 max-w-7xl w-full mx-auto space-y-8">
          
          {/* Workspace Title bar */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h3 className="text-2xl font-black tracking-tight text-gray-900">
                SME Operational Dashboard
              </h3>
              <p className="text-sm text-gray-500">
                Indonesia Spice Exporters (WhatsApp & Excel Replacement Prototype)
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-indigo-600 text-white hover:bg-indigo-700 font-semibold px-4 py-2.5 rounded-xl flex items-center gap-2 text-xs shadow-md shadow-indigo-100 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Log Buyer Inquiry
            </button>
          </div>

          {/* 2. THREE STATUS CARDS AT THE TOP */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* CARD 1: Total Inquiries */}
            <div className="bg-white p-6 rounded-2xl border border-gray-150 hover:shadow-lg transition-all duration-300 relative overflow-hidden group">
              <div className="absolute right-0 top-0 bg-yellow-50 p-6 rounded-bl-full group-hover:scale-115 transition-transform duration-300">
                <ClipboardSpreadsheet className="w-5 h-5 text-yellow-600" />
              </div>
              <p className="text-xs font-extrabold tracking-wider text-gray-400 uppercase">
                Total Inquiries
              </p>
              <p className="text-3xl font-black text-gray-900 mt-2">{totalInquiries}</p>
              <div className="text-xs flex items-center gap-1.5 mt-4 text-emerald-600 font-bold">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>+15.5% this month</span>
              </div>
            </div>

            {/* CARD 2: Active Shipments */}
            <div className="bg-white p-6 rounded-2xl border border-gray-150 hover:shadow-lg transition-all duration-300 relative overflow-hidden group">
              <div className="absolute right-0 top-0 bg-pink-50 p-6 rounded-bl-full group-hover:scale-115 transition-transform duration-300">
                <Ship className="w-5 h-5 text-pink-600" />
              </div>
              <p className="text-xs font-extrabold tracking-wider text-gray-400 uppercase">
                Active Shipments
              </p>
              <p className="text-3xl font-black text-gray-900 mt-2">{activeShipments}</p>
              <p className="text-[11px] text-gray-500 mt-4 font-bold flex items-center gap-1">
                <MapPin className="w-3 h-3 text-indigo-500" /> 2 Sea Container in transit, 1 Clearance
              </p>
            </div>

            {/* CARD 3: Sourcing Suppliers */}
            <div className="bg-white p-6 rounded-2xl border border-gray-150 hover:shadow-lg transition-all duration-300 relative overflow-hidden group">
              <div className="absolute right-0 top-0 bg-indigo-50 p-6 rounded-bl-full group-hover:scale-115 transition-transform duration-300">
                <Compass className="w-5 h-5 text-indigo-600" />
              </div>
              <p className="text-xs font-extrabold tracking-wider text-gray-400 uppercase">
                Sourcing Suppliers
              </p>
              <p className="text-3xl font-black text-gray-900 mt-2">{sourcingSuppliers}</p>
              <div className="text-xs flex items-center gap-1.5 mt-4 text-indigo-600 font-bold">
                <span>Indonesian Farmers Network Partnered</span>
              </div>
            </div>

          </div>

          {/* 3. RECENT BUYER INQUIRIES DATA TABLE */}
          <div className="bg-white rounded-2xl border border-gray-150 overflow-hidden shadow-sm">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div>
                <h4 className="font-extrabold text-sm tracking-wide text-gray-900 uppercase">
                  Recent Cargo Buyer Inquiries
                </h4>
                <p className="text-xs text-gray-400 mt-0.5">
                  Real-time B2B spice pipeline tracking
                </p>
              </div>
              <span className="bg-indigo-100 text-indigo-700 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
                ACTIVE PIPELINE
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/20 text-[11px] font-extrabold text-gray-400 uppercase tracking-widest border-b border-gray-100">
                    <th className="py-4 px-6">Buyer Institution</th>
                    <th className="py-4 px-6">Export Destination</th>
                    <th className="py-4 px-6">Spice Produce</th>
                    <th className="py-4 px-6">Cargo Quantity</th>
                    <th className="py-4 px-6">Quote Offer</th>
                    <th className="py-4 px-6 text-center">Status</th>
                    <th className="py-4 px-6">Creation Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs">
                  {inquiries.map((inq) => (
                    <tr key={inq.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="py-4 px-6 font-bold text-gray-900">{inq.buyerName}</td>
                      <td className="py-4 px-6">
                        <span className="flex items-center gap-1.5 font-semibold text-gray-600">
                          <Globe className="w-3.5 h-3.5 text-gray-400" />
                          {inq.country}
                        </span>
                      </td>
                      <td className="py-4 px-6 font-medium text-gray-700">{inq.product}</td>
                      <td className="py-4 px-6 font-bold text-indigo-650">{inq.quantity}</td>
                      <td className="py-4 px-6 font-semibold text-emerald-700">{"$8,500/MT"}</td>
                      <td className="py-4 px-6 text-center">
                        <span
                          className={`inline-block text-[10px] font-extrabold px-3 py-1 rounded-full text-center tracking-wide uppercase ${
                            inq.status === "Closed"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : inq.status === "Negotiating"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-indigo-50 text-indigo-700 border border-indigo-200"
                          }`}
                        >
                          {inq.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-gray-400 font-medium">{inq.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {inquiries.length === 0 && (
              <div className="p-12 text-center text-gray-400 font-medium text-xs">
                No active buyer inquiries registered yet.
              </div>
            )}
          </div>
        </div>
      </main>

      {/* INPUT FORM MODAL SPECIFICATION */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-gray-150 animate-scale-up">
            <div className="p-6 border-b border-gray-100 bg-gradient-to-tr from-indigo-900 to-indigo-950 text-white flex justify-between items-center">
              <h3 className="font-extrabold text-sm tracking-wide uppercase">
                New Buyer Inquiry Record
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-indigo-300 hover:text-white font-bold text-lg">
                &times;
              </button>
            </div>

            <form onSubmit={handleAddInquiry} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold tracking-widest uppercase text-gray-400">
                  Buyer Company Name
                </label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Klausen Spice GmbH"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  value={form.buyerName}
                  onChange={(e) => setForm({ ...form, buyerName: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold tracking-widest uppercase text-gray-400">
                  Export Country Destination
                </label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Germany, Japan"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  value={form.country}
                  onChange={(e) => setForm({ ...form, country: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold tracking-widest uppercase text-gray-400">
                    Spice Produce Category
                  </label>
                  <select
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    value={form.product}
                    onChange={(e) => setForm({ ...form, product: e.target.value })}
                  >
                    <option value="Nutmeg (ABCD Grade)">Nutmeg</option>
                    <option value="Cloves (Lal Pari Grade)">Cloves</option>
                    <option value="Mace (Whole Grade)">Mace</option>
                    <option value="Split Cassia split">Cinnamon</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold tracking-widest uppercase text-gray-400">
                    Cargo Target Volume
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. 15 MT"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-500 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-650 text-white font-bold text-xs hover:bg-indigo-750 shadow-md shadow-indigo-100"
                >
                  Save to Pipeline
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
