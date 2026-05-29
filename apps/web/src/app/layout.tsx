import type { Metadata } from "next";
import "./globals.css";
import { LanguageProvider } from "@/lib/LanguageContext";
import { ThemeProvider } from "@/lib/ThemeContext";
import { AuthProvider } from "@/lib/AuthContext";

export const metadata: Metadata = {
  title: "Exopilot — Export Operating System",
  description:
    "Exopilot is the smart digital operating system for export SMEs. Manage buyer inquiries, shipment tracking, commodity prices, supplier networks, and AI-powered document generation.",
  keywords: "export dashboard, buyer CRM, shipment tracking, commodity prices, AI quotation",
  icons: {
    icon: "/logo.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="transition-colors duration-200" suppressHydrationWarning>
      <body className="antialiased">
        <LanguageProvider>
          <ThemeProvider>
            <AuthProvider>{children}</AuthProvider>
          </ThemeProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
