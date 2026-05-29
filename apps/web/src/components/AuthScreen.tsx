"use client";

import React, { useState, useEffect } from "react";
import {
  Globe, Loader2, TrendingUp, ShieldCheck, FileText, Ship,
  Eye, EyeOff, ArrowLeft, CheckCircle2, AlertCircle,
} from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import { useAuth } from "@/lib/AuthContext";
import {
  sanitizeInput,
  validateEmail,
  validatePassword,
  generateCSRFToken,
  validateCSRFToken,
  recordLoginAttempt,
  clearLoginAttempts,
  checkRateLimit,
} from "@/lib/security";

interface AuthScreenProps {
  onLogin: (user: { name: string; email: string; businessName: string }) => void;
  initialMode?: "login" | "register";
  onBack?: () => void;
}

const FEATURES = [
  { icon: TrendingUp, text: "Real-time buyer pipeline & CRM" },
  { icon: Ship,       text: "Shipment tracking with document checklist" },
  { icon: FileText,   text: "Gemini AI-powered export documents" },
  { icon: ShieldCheck,text: "Secure & encrypted data with Firebase" },
];

export function AuthScreen({ onLogin, initialMode = "login", onBack }: AuthScreenProps) {
  const { t, language } = useLanguage();
  const { signup, login } = useAuth();

  const [isLogin, setIsLogin]       = useState(initialMode === "login");
  const [isLoading, setIsLoading]   = useState(false);
  const [showPw, setShowPw]         = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [errorMsg, setErrorMsg]     = useState("");
  const [form, setForm] = useState({
    name: "", email: "", password: "", confirmPassword: "", businessName: "",
  });

  const [csrfToken, setCsrfToken] = useState("");

  // Generate CSRF token on mount
  useEffect(() => {
    const token = generateCSRFToken();
    setCsrfToken(token);
  }, []);

  const parseFirebaseError = (code: string): string => {
    switch (code) {
      case "auth/wrong-password":
      case "auth/invalid-credential":
        return language === "en" ? "Incorrect email or password." : "Email atau password salah.";
      case "auth/user-not-found":
        return language === "en" ? "No account found with this email." : "Akun dengan email ini tidak ditemukan.";
      case "auth/email-already-in-use":
        return language === "en" ? "This email is already registered." : "Email ini sudah terdaftar.";
      case "auth/weak-password":
        return language === "en" ? "Password must be at least 6 characters." : "Password minimal 6 karakter.";
      case "auth/invalid-email":
        return language === "en" ? "Please enter a valid email address." : "Format email tidak valid.";
      case "auth/too-many-requests":
        return language === "en" ? "Too many attempts. Please try again later." : "Terlalu banyak percobaan. Coba lagi nanti.";
      default:
        return language === "en" ? `Something went wrong: ${code}` : `Terjadi kesalahan: ${code}`;
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg("");
    setIsLoading(true);

    // 1. Verify CSRF Token
    const formToken = (e.currentTarget.elements.namedItem("csrf_token") as HTMLInputElement)?.value;
    if (!validateCSRFToken(formToken)) {
      setErrorMsg(language === "en" ? "Security verification failed. Please reload the page." : "Verifikasi keamanan gagal. Silakan muat ulang halaman.");
      setIsLoading(false);
      return;
    }

    // 2. Rate Limiting Check
    const rateStatus = checkRateLimit();
    if (rateStatus.isLocked) {
      setErrorMsg(
        language === "en"
          ? `Too many failed attempts. Locked out. Please try again in ${rateStatus.timeRemaining}.`
          : `Terlalu banyak kegagalan. Akun terkunci. Silakan coba lagi dalam ${rateStatus.timeRemaining}.`
      );
      setIsLoading(false);
      return;
    }

    // 3. Input Validation
    const emailVal = validateEmail(form.email);
    if (!emailVal.valid) {
      setErrorMsg(emailVal.error || "Invalid email format.");
      setIsLoading(false);
      return;
    }

    // 4. Password Strength Verification for Registration
    if (!isLogin) {
      const strength = validatePassword(form.password);
      if (strength.score < 4) {
        const missingList = strength.errors.length > 0
          ? ` Missing: ${strength.errors.join(", ")}.`
          : "";
        setErrorMsg(
          language === "en"
            ? `Your password does not meet all security requirements.${missingList}`
            : `Kata sandi tidak memenuhi semua syarat keamanan.${missingList}`
        );
        setIsLoading(false);
        return;
      }
    }

    // 4.5. Password Confirmation Check
    if (!isLogin && form.password !== form.confirmPassword) {
      setErrorMsg(
        language === "en"
          ? "Password invalid."
          : "password tidak valid"
      );
      setIsLoading(false);
      return;
    }

    // 5. Sanitize Fields
    const emailSanitized = sanitizeInput(form.email);
    const nameSanitized = sanitizeInput(form.name);
    const businessNameSanitized = sanitizeInput(form.businessName);

    try {
      if (isLogin) {
        await login(emailSanitized, form.password);
        clearLoginAttempts();
        onLogin({
          name: emailSanitized.split("@")[0],
          email: emailSanitized,
          businessName: "",
        });
      } else {
        await signup(emailSanitized, form.password, nameSanitized || businessNameSanitized, "PT");
        onLogin({
          name: nameSanitized || emailSanitized.split("@")[0],
          email: emailSanitized,
          businessName: businessNameSanitized,
        });
      }
    } catch (err: any) {
      if (isLogin) {
        recordLoginAttempt();
      }
      const code = err?.code || err?.message || "Unknown error";
      setErrorMsg(parseFirebaseError(code));
    } finally {
      setIsLoading(false);
    }
  };

  const field = (
    id: string,
    label: string,
    type: string,
    placeholder: string,
    key: keyof typeof form,
    required = true,
    extra?: React.ReactNode,
  ) => (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-[10px] font-black tracking-widest text-slate-500 uppercase">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={type}
          required={required}
          autoComplete={type === "password" ? (isLogin ? "current-password" : "new-password") : type}
          placeholder={placeholder}
          value={form[key]}
          maxLength={type === "email" ? 254 : 100}
          onChange={(e) => { setForm({ ...form, [key]: e.target.value }); setErrorMsg(""); }}
          className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
        />
        {extra}
      </div>
    </div>
  );

  const passwordStrength = !isLogin ? validatePassword(form.password) : null;

  return (
    <div className="min-h-screen flex">
      {/* ── Left branding panel ── */}
      <div className="hidden lg:flex flex-col justify-between w-[480px] shrink-0 bg-[#0f172a] p-10 relative overflow-hidden">
        {/* Background blobs */}
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-blue-600/15 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-indigo-600/10 blur-3xl pointer-events-none" />

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center shadow-lg shadow-blue-500/30">
              <img src="/logo.png" alt="Exopilot" className="w-10 h-10 object-contain" />
            </div>
            <div>
              <p className="text-white font-black text-lg leading-none">Exopilot</p>
              <p className="text-blue-400 text-[9px] font-bold tracking-[0.2em] uppercase mt-0.5">Export Operating System</p>
            </div>
          </div>

          <h2 className="text-3xl font-black text-white leading-tight mb-4">
            Your entire export<br />business, in one place.
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed mb-10">
            Trusted by 500+ exporters in Indonesia to manage buyers, shipments, and documents efficiently.
          </p>

          {/* Feature list */}
          <div className="space-y-4">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.text} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-600/30 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-blue-400" strokeWidth={2} />
                  </div>
                  <p className="text-slate-300 text-xs font-semibold">{f.text}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom quote */}
        <div className="relative z-10 border-t border-slate-800 pt-8">
          <p className="text-slate-400 text-xs leading-relaxed italic">
            "Exopilot completely changed how we manage our international buyers. The AI documents alone save us hours every week."
          </p>
          <div className="flex items-center gap-2.5 mt-4">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-[9px] font-black">AF</div>
            <div>
              <p className="text-slate-200 text-[10px] font-bold">Ahmad Fauzi</p>
              <p className="text-slate-500 text-[9px]">PT Rempah Nusantara Abadi</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 bg-white relative overflow-y-auto">
        {/* Back to landing — top-right so it doesn't overlap the form/logo */}
        {onBack && (
          <button
            onClick={onBack}
            className="absolute top-5 right-5 flex items-center gap-1.5 text-slate-400 hover:text-slate-700 text-xs font-bold transition-colors cursor-pointer bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-full"
          >
            Back <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
          </button>
        )}

        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center">
              <img src="/logo.png" alt="Exopilot" className="w-8 h-8 object-contain" />
            </div>
            <span className="font-black text-slate-900 text-base">Exopilot</span>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-2xl font-black text-slate-900 leading-tight">
              {isLogin ? "Welcome back" : "Create your account"}
            </h1>
            <p className="text-slate-500 text-xs mt-1.5">
              {isLogin
                ? "Sign in to your export dashboard"
                : "Start managing your export business for free"}
            </p>
          </div>

          {/* Tab switcher */}
          <div className="flex gap-1 p-1 bg-slate-100 rounded-xl mb-7">
            {[
              { label: t("auth", "signIn"),   isL: true  },
              { label: t("auth", "register"), isL: false },
            ].map(({ label, isL }) => (
              <button
                key={label}
                onClick={() => { setIsLogin(isL); setErrorMsg(""); }}
                className={`flex-1 py-2.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  isLogin === isL
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* CSRF Token */}
            <input type="hidden" name="csrf_token" value={csrfToken} />

            {/* Register-only fields */}
            {!isLogin && (
              <>
                {field("auth-name", t("auth", "fullName"), "text", "Ahmad Fauzi", "name")}
                {field("auth-biz", t("auth", "businessName"), "text", "PT Rempah Nusantara", "businessName")}
              </>
            )}

            {/* Email */}
            {field("auth-email", t("auth", "email"), "email", "ahmad@rempah.co.id", "email")}

            {/* Password with show/hide toggle */}
            <div className="space-y-1.5">
              <label htmlFor="auth-pw" className="block text-[10px] font-black tracking-widest text-slate-500 uppercase">
                {t("auth", "password")}
              </label>
              <div className="relative">
                <input
                  id="auth-pw"
                  type={showPw ? "text" : "password"}
                  required
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  placeholder="••••••••"
                  value={form.password}
                  maxLength={100}
                  onChange={(e) => { setForm({ ...form, password: e.target.value }); setErrorMsg(""); }}
                  className="w-full px-4 py-3 pr-11 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer transition-colors"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password Strength Indicator */}
              {!isLogin && form.password && passwordStrength && (
                <div className="mt-2 space-y-1.5 p-2.5 rounded-xl bg-slate-50 border border-slate-100 animate-fade-in">
                  <div className="flex justify-between items-center text-[9px] font-bold">
                    <span className="text-slate-400 uppercase tracking-widest">Strength:</span>
                    <span className={`font-black uppercase tracking-widest ${
                      passwordStrength.label === "Weak" ? "text-rose-500" :
                      passwordStrength.label === "Fair" ? "text-amber-500" :
                      passwordStrength.label === "Good" ? "text-yellow-500" : "text-emerald-500"
                    }`}>
                      {passwordStrength.label}
                    </span>
                  </div>
                  <div className="h-1 w-full bg-slate-200 rounded-full overflow-hidden flex gap-0.5">
                    {[1, 2, 3, 4].map((step) => (
                      <div
                        key={step}
                        className={`h-full flex-1 transition-all duration-300 ${
                          step <= passwordStrength.score
                            ? passwordStrength.color
                            : "bg-slate-200"
                        }`}
                      />
                    ))}
                  </div>
                  {passwordStrength.errors.length ? (
                    <p className="text-[8px] text-slate-400 font-bold leading-normal">
                      Missing: {passwordStrength.errors.join(", ")}
                    </p>
                  ) : (
                    <p className="text-[8px] text-emerald-500 font-extrabold leading-none flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 shrink-0" /> Password meets complexity requirements.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Confirm Password with show/hide toggle */}
            {!isLogin && (
              <div className="space-y-1.5">
                <label htmlFor="auth-confirm-pw" className="block text-[10px] font-black tracking-widest text-slate-500 uppercase">
                  {t("auth", "confirmPassword")}
                </label>
                <div className="relative">
                  <input
                    id="auth-confirm-pw"
                    type={showConfirmPw ? "text" : "password"}
                    required
                    autoComplete="new-password"
                    placeholder="••••••••"
                    value={form.confirmPassword}
                    maxLength={100}
                    onChange={(e) => { setForm({ ...form, confirmPassword: e.target.value }); setErrorMsg(""); }}
                    className="w-full px-4 py-3 pr-11 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPw(!showConfirmPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer transition-colors"
                  >
                    {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* Error message */}
            {errorMsg && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-xs font-semibold animate-fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                {errorMsg}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              id="btn-auth-submit"
              className="w-full py-3.5 mt-1 rounded-xl bg-[#1d4ed8] hover:bg-blue-700 disabled:opacity-60 text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-500/20 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> {t("auth", "processing")}</>
              ) : isLogin ? (
                <><CheckCircle2 className="w-4 h-4" /> {t("auth", "submitSignIn")}</>
              ) : (
                <><CheckCircle2 className="w-4 h-4" /> {t("auth", "submitRegister")}</>
              )}
            </button>
          </form>

          {/* Demo access */}
          <div className="mt-5 flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-100" />
            <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest">or</span>
            <div className="flex-1 h-px bg-slate-100" />
          </div>
          <button
            onClick={async () => {
              setIsLoading(true);
              await new Promise((r) => setTimeout(r, 500));
              onLogin({ name: "Demo User", email: "demo@exopilot.id", businessName: "PT Rempah Nusantara Abadi" });
              setIsLoading(false);
            }}
            id="btn-try-demo"
            disabled={isLoading}
            className="w-full mt-4 py-3 rounded-xl border-2 border-dashed border-slate-200 hover:border-blue-200 hover:bg-blue-50/40 text-slate-500 hover:text-blue-700 font-bold text-xs transition-all cursor-pointer"
          >
            Try Demo (no account needed)
          </button>

          {/* Agreement */}
          <p className="text-center text-[9px] text-slate-400 mt-6 leading-relaxed">
            {t("auth", "agreement")}
          </p>
        </div>
      </div>
    </div>
  );
}
