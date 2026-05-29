"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function NotFound() {
  const router = useRouter();

  useEffect(() => {
    // Automatically redirect to the home page/dashboard
    router.replace("/");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 font-sans">
      <div className="text-center space-y-4">
        <div className="w-14 h-14 rounded-[18px] overflow-hidden flex items-center justify-center mx-auto shadow-xl shadow-indigo-500/30">
          <img src="/logo.png" alt="Exopilot" className="w-12 h-12 object-contain" />
        </div>
        <Loader2 className="w-5 h-5 text-indigo-400 animate-spin mx-auto" />
        <h1 className="text-sm font-bold text-slate-200">Page Not Found</h1>
        <p className="text-xs text-slate-400">Redirecting to Exopilot Dashboard...</p>
      </div>
    </div>
  );
}
