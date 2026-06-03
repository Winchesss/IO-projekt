import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/layout/site-header";

export const metadata: Metadata = {
  title: "ChessArbiter Polska",
  description: "Platforma do obsługi polskich turniejów szachowych"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pl">
      <body>
        <div className="min-h-screen bg-slate-50">
          <SiteHeader />
          {children}
        </div>
      </body>
    </html>
  );
}
