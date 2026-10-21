import type { Metadata } from "next";
import { Open_Sans } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { brand, company } from "@/lib/company";
import { getSession } from "@/lib/session";

const openSans = Open_Sans({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-open-sans" });

export const metadata: Metadata = {
  title: `${brand.name} para dermatólogos · ${company.name}`,
  description: `Pedidos profesionales de ${brand.name} para consultas de dermatología.`,
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await getSession();
  return (
    <html lang="es" className={openSans.variable}>
      <body className="flex min-h-screen flex-col antialiased">
        {process.env.DEMO_PRICES === "1" && (
          <div className="bg-announce px-4 py-2 text-center text-xs text-muted">
            Demo: los precios son de ejemplo y los datos se borran cuando la web se reinicia.
          </div>
        )}
        <header className="sticky top-0 z-10 border-b border-line bg-white/95 backdrop-blur">
          <nav className="mx-auto flex min-h-16 max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 text-sm text-[#303233]">
            <Link href="/" className="mr-auto text-base font-semibold text-foreground">
              {brand.name} <span className="font-normal text-subtle">· {company.name}</span>
            </Link>
            <Link href="/catalogo">Catálogo</Link>
            <Link href="/carrito">Carrito</Link>
            {session?.kind === "customer" && <Link href="/pedidos">Mis pedidos</Link>}
            {session?.kind === "admin" && <Link href="/panel">Panel</Link>}
            {session ? (
              <Link href="/salir" prefetch={false}>Salir</Link>
            ) : (
              <>
                <Link href="/entrar">Entrar</Link>
                <Link href="/alta" className="btn h-8 px-4">Alta profesional</Link>
              </>
            )}
          </nav>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">{children}</main>
        <footer className="bg-footer text-xs text-footer-link">
          <div className="mx-auto max-w-6xl px-4 py-8">
            <div className="border-b border-footer-line pb-4 text-sm font-medium text-white">
              {company.name}, distribuidor de {brand.name}
            </div>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-4">
              <span className="mr-auto">Venta exclusiva a profesionales sanitarios</span>
              <Link href="/aviso-legal" className="hover:text-white">Aviso legal</Link>
              <Link href="/privacidad" className="hover:text-white">Privacidad</Link>
              <Link href="/condiciones" className="hover:text-white">Condiciones de venta</Link>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
