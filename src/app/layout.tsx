import type { Metadata } from "next";
import "./globals.css";
import { LanguageProvider } from "@/context/LanguageContext";

export const metadata: Metadata = {
  title: "HYCO Property Management | Admin & Operations CRM",
  description: "Centralized Real Estate Portfolio Management, Billing & Tenant Helpdesk",
  icons: {
    icon: "/logosinfondopng.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className="min-h-screen bg-[#070D18] text-slate-100 antialiased selection:bg-[#D4AF37]/30 selection:text-white"
        suppressHydrationWarning
      >
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
