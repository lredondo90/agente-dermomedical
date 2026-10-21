import type { Metadata } from "next";
import { Geist, Instrument_Serif } from "next/font/google";
import "./globals.css";
import { brand, company } from "@/lib/company";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });
const serif = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--font-serif" });

export const metadata: Metadata = {
  title: `${brand.name} para dermatólogos · ${company.name}`,
  description: `Pedidos profesionales de ${brand.name} para consultas de dermatología.`,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${geist.variable} ${serif.variable}`}>
      <body className="flex min-h-screen flex-col antialiased">
        {process.env.DEMO_PRICES === "1" && (
          <div className="no-print bg-foreground px-4 py-1.5 text-center text-[11px] text-white/70">
            <span className="mr-2 rounded-full bg-white/10 px-2 py-0.5 font-medium text-white">Demo</span>
            Los precios son de ejemplo.
          </div>
        )}
        {children}
      </body>
    </html>
  );
}
