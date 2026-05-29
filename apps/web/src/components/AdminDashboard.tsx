"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  ShieldCheck, Users, MessageSquare, Ship, UserCheck, UserX, Loader2,
  Search, ShieldAlert, CheckCircle2, XCircle, RefreshCw, AlertCircle
} from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import { useAuth } from "@/lib/AuthContext";
import {
  getAllProfiles,
  updateUserRole,
  updateUserDisabled,
  getAdminStats,
  Profile
} from "@/lib/firebase";
import { sanitizeSearchQuery } from "@/lib/security";

interface AdminDashboardProps {
  onAlert: (msg: string, type: "success" | "error") => void;
}

export function AdminDashboard({ onAlert }: AdminDashboardProps) {
  const { language } = useLanguage();
  const { user: loggedInUser } = useAuth();
  
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [stats, setStats] = useState({ totalUsers: 0, totalInquiries: 0, totalShipments: 0 });
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [allProfiles, adminStats] = await Promise.all([
        getAllProfiles(),
        getAdminStats()
      ]);
      setProfiles(allProfiles);
      setStats(adminStats);
    } catch (error: any) {
      console.error("Admin dashboard fetch error:", error);
      onAlert(
        language === "en"
          ? "Failed to load administrator data."
          : "Gagal memuat data administrator.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRoleToggle = async (profile: Profile) => {
    const newRole = profile.role === "admin" ? "user" : "admin";
    if (profile.id === loggedInUser?.uid) {
      onAlert(
        language === "en"
          ? "You cannot demote yourself from administrator."
          : "Anda tidak dapat menurunkan peran administrator Anda sendiri.",
        "error"
      );
      return;
    }

    const confirmMsg =
      language === "en"
        ? `Are you sure you want to change ${profile.company_name || "this user"}'s role to ${newRole}?`
        : `Apakah Anda yakin ingin mengubah peran ${profile.company_name || "pengguna ini"} menjadi ${newRole}?`;

    if (!confirm(confirmMsg)) return;

    setActionLoadingId(profile.id);
    try {
      await updateUserRole(profile.id, newRole);
      onAlert(
        language === "en"
          ? "User role updated successfully!"
          : "Peran pengguna berhasil diubah!",
        "success"
      );
      await fetchData();
    } catch (error) {
      onAlert(
        language === "en" ? "Failed to update role." : "Gagal mengubah peran.",
        "error"
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDisableToggle = async (profile: Profile) => {
    const newDisabled = !profile.disabled;
    if (profile.id === loggedInUser?.uid) {
      onAlert(
        language === "en"
          ? "You cannot disable your own administrator account."
          : "Anda tidak dapat menonaktifkan akun administrator Anda sendiri.",
        "error"
      );
      return;
    }

    const confirmMsg = newDisabled
      ? language === "en"
        ? `Are you sure you want to DISABLE access for ${profile.company_name || "this user"}?`
        : `Apakah Anda yakin ingin MENONAKTIFKAN akses untuk ${profile.company_name || "pengguna ini"}?`
      : language === "en"
      ? `Are you sure you want to RESTORE access for ${profile.company_name || "this user"}?`
      : `Apakah Anda yakin ingin MENGAKTIFKAN KEMBALI akses untuk ${profile.company_name || "pengguna ini"}?`;

    if (!confirm(confirmMsg)) return;

    setActionLoadingId(profile.id);
    try {
      await updateUserDisabled(profile.id, newDisabled);
      onAlert(
        newDisabled
          ? language === "en" ? "User account has been disabled." : "Akun pengguna telah dinonaktifkan."
          : language === "en" ? "User account has been restored." : "Akun pengguna telah diaktifkan kembali.",
        "success"
      );
      await fetchData();
    } catch (error) {
      onAlert(
        language === "en" ? "Failed to update account status." : "Gagal memperbarui status akun.",
        "error"
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredProfiles = useMemo(() => {
    const cleanQuery = sanitizeSearchQuery(searchQuery).toLowerCase();
    if (!cleanQuery) return profiles;
    return profiles.filter((p) => {
      const company = (p.company_name || "").toLowerCase();
      const commodity = (p.main_commodity || "").toLowerCase();
      const type = (p.legal_entity_type || "").toLowerCase();
      const role = (p.role || "user").toLowerCase();
      return company.includes(cleanQuery) || commodity.includes(cleanQuery) || type.includes(cleanQuery) || role.includes(cleanQuery);
    });
  }, [profiles, searchQuery]);

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A";
    if (typeof timestamp.toDate === "function") {
      return timestamp.toDate().toLocaleDateString();
    }
    if (timestamp.seconds) {
      return new Date(timestamp.seconds * 1000).toLocaleDateString();
    }
    if (typeof timestamp === "number") {
      return new Date(timestamp * 1000).toLocaleDateString();
    }
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-slate-800 relative overflow-hidden shadow-sm">
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-indigo-50/50 dark:bg-indigo-950/20 pointer-events-none hidden sm:block" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              {language === "en" ? "Admin Control Center" : "Pusat Kontrol Admin"}
            </h1>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              {language === "en"
                ? "Monitor registered SME exporters, manage security roles, and enforce account lockouts."
                : "Pantau eksportir UKM terdaftar, kelola peran keamanan, dan berlakukan pemblokiran akun."}
            </p>
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-1.5 self-start sm:self-auto bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer active:scale-95 shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            {language === "en" ? "Sync Data" : "Sinkronkan"}
          </button>
        </div>
      </div>

      {/* Global Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Metric 1 */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-450 dark:text-slate-500">
              {language === "en" ? "Registered Exporters" : "Eksportir Terdaftar"}
            </p>
            <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 mt-0.5">
              {loading ? <Loader2 className="w-4 h-4 animate-spin text-slate-400 mt-1" /> : stats.totalUsers}
            </h3>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-450 dark:text-slate-500">
              {language === "en" ? "Total Inquiries" : "Total Permintaan"}
            </p>
            <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 mt-0.5">
              {loading ? <Loader2 className="w-4 h-4 animate-spin text-slate-400 mt-1" /> : stats.totalInquiries}
            </h3>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
            <Ship className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-450 dark:text-slate-500">
              {language === "en" ? "Tracked Shipments" : "Pengiriman Dilacak"}
            </p>
            <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 mt-0.5">
              {loading ? <Loader2 className="w-4 h-4 animate-spin text-slate-400 mt-1" /> : stats.totalShipments}
            </h3>
          </div>
        </div>
      </div>

      {/* User Management Section */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
        {/* Search Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 className="text-sm font-black text-slate-800 dark:text-slate-200">
            {language === "en" ? "User Directory" : "Direktori Pengguna"}
          </h2>
          
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
            <input
              type="text"
              placeholder={language === "en" ? "Search company, role..." : "Cari perusahaan, peran..."}
              value={searchQuery}
              maxLength={100}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 text-slate-900 dark:text-slate-150 text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
            />
          </div>
        </div>

        {/* Directory Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600 dark:text-indigo-400" />
              <p className="text-xs text-slate-400 font-semibold">
                {language === "en" ? "Loading users..." : "Memuat pengguna..."}
              </p>
            </div>
          ) : filteredProfiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-450 gap-2">
              <AlertCircle className="w-8 h-8 text-slate-300 dark:text-slate-700" />
              <p className="text-xs font-bold">
                {language === "en" ? "No users match your criteria." : "Tidak ada pengguna yang cocok."}
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/70 dark:bg-slate-800/30 text-slate-450 dark:text-slate-500 font-bold uppercase tracking-widest text-[9px] border-b border-slate-100 dark:border-slate-800 select-none">
                  <th className="py-4 px-5">{language === "en" ? "Company / SME" : "Perusahaan / UKM"}</th>
                  <th className="py-4 px-5">{language === "en" ? "Main Commodity" : "Komoditas Utama"}</th>
                  <th className="py-4 px-5">{language === "en" ? "Security Role" : "Peran Keamanan"}</th>
                  <th className="py-4 px-5">Status</th>
                  <th className="py-4 px-5">{language === "en" ? "Joined At" : "Bergabung"}</th>
                  <th className="py-4 px-5 text-right">{language === "en" ? "Actions" : "Aksi"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredProfiles.map((profile) => {
                  const isCurrent = profile.id === loggedInUser?.uid;
                  const isAdmin = profile.role === "admin";
                  
                  return (
                    <tr
                      key={profile.id}
                      className={`hover:bg-slate-50/40 dark:hover:bg-slate-800/10 transition-colors ${
                        profile.disabled ? "bg-slate-50/20 text-slate-400 dark:text-slate-500" : ""
                      }`}
                    >
                      {/* Company / User Info */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 font-bold text-[10px] shrink-0 overflow-hidden select-none border border-slate-200/40 dark:border-slate-700/40">
                            {profile.photo_url ? (
                              <img src={profile.photo_url} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                              (profile.company_name || "EX").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
                            )}
                          </div>
                          <div>
                            <p className="font-extrabold text-slate-800 dark:text-slate-200">
                              {profile.company_name || "Unnamed Enterprise"}
                              {isCurrent && (
                                <span className="ml-1.5 px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-md font-black text-[8px] uppercase tracking-wider">
                                  {language === "en" ? "You" : "Anda"}
                                </span>
                              )}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-0.5 font-medium">{profile.legal_entity_type || "PT"} · {profile.phone_number || "No Phone"}</p>
                          </div>
                        </div>
                      </td>

                      {/* Main Commodity */}
                      <td className="py-4 px-5">
                        <span className="font-semibold text-slate-600 dark:text-slate-350">
                          {profile.main_commodity || "Nutmeg"}
                        </span>
                      </td>

                      {/* Security Role Badge */}
                      <td className="py-4 px-5">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-black text-[9px] uppercase tracking-wider ${
                            isAdmin
                              ? "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 border border-purple-100 dark:border-purple-900/40"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/20"
                          }`}
                        >
                          {isAdmin ? (
                            <><ShieldCheck className="w-3 h-3" /> Admin</>
                          ) : (
                            "User"
                          )}
                        </span>
                      </td>

                      {/* Account Status */}
                      <td className="py-4 px-5">
                        <span
                          className={`inline-flex items-center gap-1.5 font-extrabold ${
                            profile.disabled
                              ? "text-rose-500"
                              : "text-emerald-500"
                          }`}
                        >
                          {profile.disabled ? (
                            <><XCircle className="w-3.5 h-3.5" /> {language === "en" ? "Disabled" : "Dinonaktifkan"}</>
                          ) : (
                            <><CheckCircle2 className="w-3.5 h-3.5" /> {language === "en" ? "Active" : "Aktif"}</>
                          )}
                        </span>
                      </td>

                      {/* Joined Date */}
                      <td className="py-4 px-5 text-slate-500 font-medium">
                        {formatDate(profile.created_at)}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          {actionLoadingId === profile.id ? (
                            <Loader2 className="w-4 h-4 animate-spin text-slate-400 mr-2" />
                          ) : (
                            <>
                              {/* Toggle Role Button */}
                              <button
                                onClick={() => handleRoleToggle(profile)}
                                disabled={isCurrent}
                                className={`px-2.5 py-1.5 rounded-lg border text-[10px] font-bold cursor-pointer transition-all active:scale-95 ${
                                  isCurrent
                                    ? "opacity-40 cursor-not-allowed border-slate-100 text-slate-350"
                                    : "bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300"
                                }`}
                                title={language === "en" ? "Toggle Admin Role" : "Ubah Peran Admin"}
                              >
                                {isAdmin
                                  ? language === "en" ? "Revoke Admin" : "Hapus Admin"
                                  : language === "en" ? "Make Admin" : "Jadikan Admin"}
                              </button>

                              {/* Toggle Disable/Block Button */}
                              <button
                                onClick={() => handleDisableToggle(profile)}
                                disabled={isCurrent}
                                className={`px-2.5 py-1.5 rounded-lg border text-[10px] font-bold cursor-pointer transition-all active:scale-95 flex items-center gap-1 ${
                                  isCurrent
                                    ? "opacity-40 cursor-not-allowed border-slate-100 text-slate-350"
                                    : profile.disabled
                                    ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 hover:bg-emerald-100 border-emerald-200 dark:border-emerald-900/30"
                                    : "bg-rose-50 dark:bg-rose-950/20 text-rose-600 hover:bg-rose-100 border-rose-200 dark:border-rose-900/30"
                                }`}
                                title={profile.disabled ? "Restore Access" : "Block Access"}
                              >
                                {profile.disabled ? (
                                  <><UserCheck className="w-3 h-3" /> {language === "en" ? "Enable" : "Aktifkan"}</>
                                ) : (
                                  <><UserX className="w-3 h-3" /> {language === "en" ? "Disable" : "Blokir"}</>
                                )}
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
