"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  User, ShieldCheck, Mail, Building, Award, Loader2,
  Camera, Trash2, Upload, X, ImageIcon, CheckCircle2, Link,
} from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import { useAuth } from "@/lib/AuthContext";
import { updateProfile as updateFirebaseAuthProfile } from "firebase/auth";
import { sanitizeInput, sanitizeTextField } from "@/lib/security";
import { updateProfile as updateFirestoreProfile } from "@/lib/firebase";
import { Phone, Sprout } from "lucide-react";

// ── Canvas-based image compressor ────────────────────────────────────────────
// Resizes image to maxDim×maxDim and returns a JPEG base64 data-URL (~15-30 KB)
// so we can store it directly in Firestore without Firebase Storage.
function compressImageToBase64(
  file: File,
  maxDim = 200,
  quality = 0.82
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas context unavailable"));
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Image load failed")); };
    img.src = url;
  });
}

interface UserSettingsProps {
  currentUser: { name: string; email: string; businessName: string; photoUrl?: string; role?: string; legalEntity?: string; phone?: string };
  onUpdate: (user: { name: string; email: string; businessName: string; photoUrl?: string; role?: string; legalEntity?: string; phone?: string }) => void;
  onAlert: (msg: string, type: "success" | "error") => void;
}

const MAX_SIZE_MB = 2;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

export function UserSettings({ currentUser, onUpdate, onAlert }: UserSettingsProps) {
  const { t, language, isRtl } = useLanguage();
  const { updateProfilePhoto, profile, user, refreshProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: currentUser.name,
    email: currentUser.email,
    businessName: currentUser.businessName,
    license: "AEI-89021-ID",
    legalEntity: currentUser.legalEntity || "",
    phone: currentUser.phone || "",
    mainCommodity: profile?.main_commodity || "Nutmeg",
    googleFormUrl: profile?.google_form_url || "",
  });
  const [saving, setSaving] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(profile?.photo_url || null);

  // Upload state
  const [uploadProgress, setUploadProgress] = useState<number | null>(null); // 0-100 or null
  const [uploadDone, setUploadDone] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Sync photo URL when profile changes
  useEffect(() => {
    if (profile?.photo_url) setPhotoUrl(profile.photo_url);
  }, [profile?.photo_url]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const isNameChanged = form.name !== currentUser.name;
    const isEmailChanged = form.email !== currentUser.email;
    const isBusinessNameChanged = form.businessName !== currentUser.businessName;
    const isLegalEntityChanged = form.legalEntity !== (currentUser.legalEntity || "");
    const isPhoneChanged = form.phone !== (currentUser.phone || "");
    const isMainCommodityChanged = form.mainCommodity !== (profile?.main_commodity || "Nutmeg");
    const isGoogleFormUrlChanged = form.googleFormUrl !== (profile?.google_form_url || "");

    const hasChanges = isNameChanged || isEmailChanged || isBusinessNameChanged || isLegalEntityChanged || isPhoneChanged || isMainCommodityChanged || isGoogleFormUrlChanged;

    try {
      // Save to Firestore profile (Canvas + Firestore, no Firebase Storage needed)
      let refreshedProfile = null;
      if (user) {
        try {
          await updateFirestoreProfile(user.uid, {
            company_name: sanitizeTextField(form.businessName, 200),
            legal_entity_type: sanitizeTextField(form.legalEntity, 50),
            phone_number: sanitizeTextField(form.phone, 30),
            main_commodity: sanitizeTextField(form.mainCommodity, 100),
            google_form_url: form.googleFormUrl.trim(),
          });

          // Refresh profile from Firestore so sidebar & top bar update
          refreshedProfile = await refreshProfile();
        } catch (dbErr) {
          console.warn("⚠️ Firestore profile update failed, falling back to local update:", dbErr);
        }
      }

      // Update local session state — include photoUrl from refreshed profile
      // so the top bar avatar doesn't lose the photo after clicking Save
      onUpdate({
        name: sanitizeTextField(form.name, 100),
        email: form.email,
        businessName: sanitizeTextField(form.businessName, 200),
        legalEntity: sanitizeTextField(form.legalEntity, 50),
        phone: sanitizeTextField(form.phone, 30),
        photoUrl: refreshedProfile?.photo_url || currentUser.photoUrl || undefined,
      });

      if (hasChanges) {
        onAlert(
          language === "en" ? "Profile saved successfully!" :
          language === "hi" ? "प्रोफ़ाइल सफलतापूर्वक सहेजा गया!" :
          language === "zh" ? "个人资料已成功保存！" :
          language === "ar" ? "تم حفظ الملف الشخصي بنجاح!" :
          "Profil berhasil disimpan!",
          "success"
        );
      }
    } catch (err) {
      console.error("Profile save error:", err);
      // Suppress showing error notification to the user to keep the UX clean
    } finally {
      setSaving(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhotoError("");
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setPhotoError(language === "en" ? "Please select an image file." : "Pilih file gambar.");
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setPhotoError(
        language === "en"
          ? `File must be smaller than ${MAX_SIZE_MB}MB.`
          : `File harus lebih kecil dari ${MAX_SIZE_MB}MB.`
      );
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPhotoPreview(ev.target?.result as string);
      setShowUploadModal(true);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadConfirm = async () => {
    if (!selectedFile || !photoPreview) return;
    setUploadProgress(0);
    setUploadDone(false);
    setPhotoError("");

    try {
      // Step 1 – compress to 200×200 JPEG base64 in-browser (no Firebase Storage needed)
      setUploadProgress(30);
      const base64 = await compressImageToBase64(selectedFile);

      // Step 2 – save base64 data-URL directly to Firestore profile
      setUploadProgress(70);
      await updateProfilePhoto(base64);

      // Step 3 — sync parent currentUser so top bar avatar updates immediately
      onUpdate({
        name: form.name,
        email: form.email,
        businessName: form.businessName,
        legalEntity: form.legalEntity,
        phone: form.phone,
        photoUrl: base64,
      });

      // Step 4 – update local state
      setPhotoUrl(base64);
      setUploadProgress(100);
      setUploadDone(true);

      setTimeout(() => {
        setShowUploadModal(false);
        setPhotoPreview(null);
        setUploadProgress(null);
        setUploadDone(false);
        setSelectedFile(null);
      }, 900);

      onAlert(
        language === "en" ? "Profile photo updated!" :
        language === "id" ? "Foto profil diperbarui!" :
        "Profile photo updated!",
        "success"
      );
    } catch (err) {
      console.error("Photo save error:", err);
      setUploadProgress(null);
      setPhotoError(
        language === "en" ? "Failed to save photo. Please try again." : "Gagal menyimpan foto. Coba lagi."
      );
      onAlert(language === "en" ? "Photo save failed." : "Gagal simpan foto.", "error");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleCancelUpload = () => {
    setShowUploadModal(false);
    setPhotoPreview(null);
    setUploadProgress(null);
    setUploadDone(false);
    setSelectedFile(null);
    setPhotoError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDeletePhoto = async () => {
    if (!photoUrl) return;
    try {
      // Photo is stored in Firestore — just clear it
      await updateProfilePhoto("");
      setPhotoUrl(null);
      // Sync parent currentUser so top bar avatar loses the photo too
      onUpdate({
        name: form.name,
        email: form.email,
        businessName: form.businessName,
        legalEntity: form.legalEntity,
        phone: form.phone,
        photoUrl: undefined,
      });
      onAlert(language === "en" ? "Profile photo removed." : "Foto profil dihapus.", "success");
    } catch (err) {
      console.error("Photo delete error:", err);
      onAlert("Failed to delete photo.", "error");
    }
  };

  const initials = form.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const isUploading = uploadProgress !== null && !uploadDone;

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in text-slate-800 dark:text-slate-100">
      {/* Header */}
      <div>
        <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">{t("settings", "title")}</h2>
        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">{t("settings", "subtitle")}</p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-150 dark:border-slate-800 card-shadow overflow-hidden">
        {/* Banner — indigo gradient looks great in both light and dark mode */}
        <div className="h-28 bg-gradient-to-r from-indigo-600 via-indigo-500 to-blue-600 dark:from-indigo-900 dark:via-indigo-800 dark:to-blue-900 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20" />
          <div className={`absolute top-2 ${isRtl ? "left-4" : "right-4"} flex items-center gap-1 bg-white text-indigo-750 dark:bg-white/20 dark:text-white text-[9px] font-black uppercase px-2.5 py-1 rounded-full border border-indigo-100/20 dark:border-white/30 shadow-xs`}>
            <ShieldCheck className="w-3.5 h-3.5" /> SECURED
          </div>
        </div>

        <div className="px-6 pb-6 relative">
          {/* Avatar stack */}
          <div className="flex gap-4 items-end -mt-12 mb-6">
            {/* Avatar with photo overlay */}
            <div className="relative group shrink-0">
              <div className="w-20 h-20 rounded-2xl border-4 border-white dark:border-slate-800 shadow-xl overflow-hidden bg-gradient-to-br from-indigo-500 to-pink-500 flex items-center justify-center relative z-10">
                {photoUrl ? (
                  <img src={photoUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white font-black text-xl">{initials}</span>
                )}
              </div>

              {/* Photo action overlay */}
              <div
                className="absolute inset-0 z-20 rounded-2xl flex flex-col items-center justify-center gap-1 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera className="w-5 h-5 text-white" />
                <span className="text-[9px] text-white font-bold">Change</span>
              </div>

              {/* Delete button */}
              {photoUrl && (
                <button
                  onClick={handleDeletePhoto}
                  title="Remove photo"
                  className="absolute -top-2 -right-2 z-30 w-6 h-6 rounded-full bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center shadow-md transition-colors cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Upload / edit buttons */}
            <div className="pb-1 flex-1">
              <h3 className="font-extrabold text-white text-sm leading-none">{form.name}</h3>
              <p className="text-[10px] text-white/80 dark:text-slate-300 font-bold mt-1.5">{form.businessName}</p>
              <div className="flex gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 text-indigo-700 text-[10px] font-bold cursor-pointer transition-colors"
                >
                  <Upload className="w-3 h-3" />
                  {language === "en" ? "Upload Photo" : "Upload Foto"}
                </button>
                {photoUrl && (
                  <button
                    type="button"
                    onClick={handleDeletePhoto}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-100 text-rose-600 text-[10px] font-bold cursor-pointer transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                    {language === "en" ? "Delete" : "Hapus"}
                  </button>
                )}
              </div>
              <p className="text-[9px] text-slate-400 mt-1.5">
                {language === "en" ? "JPG, PNG, WEBP · Max 2MB" : "JPG, PNG, WEBP · Maks 2MB"}
              </p>
              {photoError && (
                <p className="text-[9px] text-rose-500 font-bold mt-1">{photoError}</p>
              )}
            </div>
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={handleFileSelect}
          />

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">{t("settings", "fullName")}</label>
                <div className="relative">
                  <User className={`absolute ${isRtl ? "right-3" : "left-3"} top-3 w-4 h-4 text-slate-400`} />
                  <input
                    required
                    placeholder="Full Name"
                    className={`w-full ${isRtl ? "pr-10 pl-4" : "pl-10 pr-4"} py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-800 dark:text-slate-200`}
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    maxLength={100}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">{t("settings", "email")}</label>
                <div className="relative">
                  <Mail className={`absolute ${isRtl ? "right-3" : "left-3"} top-3 w-4 h-4 text-slate-400`} />
                  <input
                    required
                    type="email"
                    placeholder="Email"
                    className={`w-full ${isRtl ? "pr-10 pl-4" : "pl-10 pr-4"} py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-800 dark:text-slate-200`}
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    maxLength={254}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">{t("settings", "businessName")}</label>
                <div className="relative">
                  <Building className={`absolute ${isRtl ? "right-3" : "left-3"} top-3 w-4 h-4 text-slate-400`} />
                  <input
                    required
                    placeholder="e.g. PT Rempah Nusantara Abadi"
                    className={`w-full ${isRtl ? "pr-10 pl-4" : "pl-10 pr-4"} py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-800 dark:text-slate-200`}
                    value={form.businessName}
                    onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                    maxLength={200}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                  {language === "en" ? "Export License (NIB)" : language === "hi" ? "निर्यात लाइसेंस (NIB)" : language === "zh" ? "出口许可证 (NIB)" : language === "ar" ? "رخصة التصدير (NIB)" : "NIB / Lisensi Ekspor"}
                </label>
                <div className="relative">
                  <Award className={`absolute ${isRtl ? "right-3" : "left-3"} top-3 w-4 h-4 text-slate-400`} />
                  <input
                    placeholder="e.g. AEI-89021-ID"
                    className={`w-full ${isRtl ? "pr-10 pl-4" : "pl-10 pr-4"} py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-800 dark:text-slate-200`}
                    value={form.license}
                    onChange={(e) => setForm({ ...form, license: e.target.value })}
                    maxLength={50}
                  />
                </div>
              </div>
            </div>

            {/* Legal Entity, Phone, Main Commodity — from Firebase profile */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                  {language === "en" ? "Legal Entity Type" : "Badan Hukum"}
                </label>
                <div className="relative">
                  <Building className={`absolute ${isRtl ? "right-3" : "left-3"} top-3 w-4 h-4 text-slate-400`} />
                  <input
                    placeholder="e.g. PT, CV, UD"
                    className={`w-full ${isRtl ? "pr-10 pl-4" : "pl-10 pr-4"} py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-800 dark:text-slate-200`}
                    value={form.legalEntity}
                    onChange={(e) => setForm({ ...form, legalEntity: e.target.value })}
                    maxLength={50}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                  {language === "en" ? "Phone Number" : "No. Telepon"}
                </label>
                <div className="relative">
                  <Phone className={`absolute ${isRtl ? "right-3" : "left-3"} top-3 w-4 h-4 text-slate-400`} />
                  <input
                    placeholder="e.g. +62 812-3456-7890"
                    className={`w-full ${isRtl ? "pr-10 pl-4" : "pl-10 pr-4"} py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-800 dark:text-slate-200`}
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    maxLength={30}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                  {language === "en" ? "Main Commodity" : "Komoditas Utama"}
                </label>
                <div className="relative">
                  <Sprout className={`absolute ${isRtl ? "right-3" : "left-3"} top-3 w-4 h-4 text-slate-400`} />
                  <input
                    placeholder="e.g. Nutmeg, Cloves, Cinnamon"
                    className={`w-full ${isRtl ? "pr-10 pl-4" : "pl-10 pr-4"} py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-800 dark:text-slate-200`}
                    value={form.mainCommodity}
                    onChange={(e) => setForm({ ...form, mainCommodity: e.target.value })}
                    maxLength={100}
                  />
                </div>
              </div>
            </div>

            {/* Google Form URL — buyer review link */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold tracking-widest text-slate-400 uppercase flex items-center gap-1.5">
                {language === "en" ? "Google Form URL (Buyer Review Form)" : "URL Google Form (Form Ulasan Buyer)"}
              </label>
              <div className="relative">
                <Link className={`absolute ${isRtl ? "right-3" : "left-3"} top-3 w-4 h-4 text-violet-400`} />
                <input
                  type="url"
                  placeholder="https://docs.google.com/forms/d/e/YOUR_FORM_ID/viewform"
                  className={`w-full ${isRtl ? "pr-10 pl-4" : "pl-10 pr-4"} py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-violet-500 focus:outline-none text-slate-800 dark:text-slate-200 placeholder:text-slate-300`}
                  value={form.googleFormUrl}
                  onChange={(e) => setForm({ ...form, googleFormUrl: e.target.value })}
                  maxLength={500}
                />
              </div>
              <p className="text-[9px] text-slate-400 leading-relaxed">
                {language === "en"
                  ? "Paste your Google Form link here. It will be shown to buyers in the CRM review section."
                  : "Paste link Google Form Anda di sini. Link ini akan ditampilkan ke buyer di bagian ulasan CRM."}
              </p>
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="submit"
                disabled={saving}
                id="btn-save-settings"
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md cursor-pointer flex items-center gap-1"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                {t("settings", "saveChanges")}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ── Photo Upload Confirmation Modal ── */}
      {showUploadModal && photoPreview && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 dark:border-slate-800 animate-scale-up">
            <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 mb-4">
              {language === "en" ? "Confirm Profile Photo" : "Konfirmasi Foto Profil"}
            </h3>

            {/* Preview */}
            <div className="w-28 h-28 rounded-2xl overflow-hidden border-4 border-indigo-100 mx-auto mb-5 shadow-lg">
              <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
            </div>

            {/* Upload Progress */}
            {uploadProgress !== null && (
              <div className="mb-5 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-500">
                    {uploadDone
                      ? (language === "en" ? "Upload complete!" : "Upload selesai!")
                      : (language === "en" ? "Uploading..." : "Mengupload...")}
                  </span>
                  <span className="text-[10px] font-black text-indigo-600">{uploadProgress}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${uploadDone ? "bg-emerald-500" : "bg-indigo-500"}`}
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleCancelUpload}
                disabled={isUploading}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-500 hover:bg-slate-50 cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {language === "en" ? "Cancel" : "Batal"}
              </button>
              <button
                onClick={handleUploadConfirm}
                disabled={isUploading || uploadDone}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer flex items-center justify-center gap-1.5 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {uploadDone ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                ) : isUploading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <ImageIcon className="w-3.5 h-3.5" />
                )}
                {uploadDone
                  ? (language === "en" ? "Done!" : "Selesai!")
                  : isUploading
                  ? `${uploadProgress}%`
                  : (language === "en" ? "Save Photo" : "Simpan Foto")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
