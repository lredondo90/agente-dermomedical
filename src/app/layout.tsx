import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { company } from "@/lib/company";
import { getSession } from "@/lib/session";

export const metadata: Metadata = {
  title: `Larimedical para dermatólogos · ${company.name}`,
  description: "Pedidos profesionales de Larimedical para consultas de dermatología.",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await getSession();
  return (
    <html lang="es">
      <body className="min-h-screen antialiased">
        {process.env.DEMO_PRICES === "1" && (
          <div className="bg-amber-100 px-4 py-1 text-center text-xs text-amber-900">
            Demo: los precios son de ejemplo y los datos se borran cuando la web se reinicia.
          </div>
        )}
        <header className="border-b border-line bg-white">
          <nav className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 text-sm">
            <Link href="/" className="mr-auto font-semibold">
              Larimedical <span className="font-normal text-muted">· {company.name}</span>
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
                <Link href="/alta" className="btn">Alta profesional</Link>
              </>
            )}
          </nav>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
        <footer className="mx-auto max-w-6xl px-4 py-8 text-xs text-muted">
          {company.name}, distribuidor de Larimedical · Venta exclusiva a profesionales sanitarios ·{" "}
          <Link href="/aviso-legal" className="underline">Aviso legal</Link> ·{" "}
          <Link href="/privacidad" className="underline">Privacidad</Link> ·{" "}
          <Link href="/condiciones" className="underline">Condiciones de venta</Link>
        </footer>
      </body>
    </html>
  );
}
