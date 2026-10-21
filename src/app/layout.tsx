import type { Metadata } from "next";
import { Open_Sans } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { brand, company } from "@/lib/company";
import { getSession } from "@/lib/session";
import { CartLink } from "@/components/CartLink";

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
        <header className="sticky top-0 z-20 border-b border-line bg-white/90 backdrop-blur-md">
          <nav className="mx-auto flex h-16 max-w-6xl items-center gap-x-4 px-4 text-sm text-[#303233] sm:gap-x-7">
            <Link href="/" className="mr-auto flex items-center gap-2.5">
              <span className="grid size-8 place-items-center rounded-full bg-foreground text-sm font-semibold text-white">
                {brand.name.charAt(0)}
              </span>
              <span className="leading-tight">
                <span className="block text-[15px] font-semibold whitespace-nowrap text-foreground">{brand.name}</span>
                <span className="hidden text-[11px] text-subtle sm:block">Canal profesional · {company.name}</span>
              </span>
            </Link>
            <Link href="/catalogo" className="hover:text-accent">Catálogo</Link>
            {session?.kind === "customer" && <Link href="/pedidos" className="hidden hover:text-accent sm:inline">Mis pedidos</Link>}
            {session?.kind === "admin" && <Link href="/panel" className="hover:text-accent">Panel</Link>}
            <CartLink />
            {session ? (
              <Link href="/salir" prefetch={false} className="hover:text-accent">Salir</Link>
            ) : (
              <>
                <Link href="/entrar" className="hidden hover:text-accent sm:inline">Entrar</Link>
                <Link href="/alta" className="btn h-8 px-4 text-[13px]">Alta profesional</Link>
              </>
            )}
          </nav>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">{children}</main>
        <footer className="bg-footer text-footer-link">
          <div className="mx-auto max-w-6xl px-4 pt-12 pb-8">
            <div className="grid gap-10 border-b border-footer-line pb-10 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-3">
                <div className="text-base font-semibold text-white">{brand.name}</div>
                <p className="text-xs leading-relaxed">
                  {company.name}, distribuidor autorizado de {brand.name} ({brand.owner}). Venta exclusiva a dermatólogos y
                  profesionales sanitarios.
                </p>
              </div>
              {[
                ["Tienda", [["/catalogo", "Catálogo"], ["/carrito", "Carrito"], ["/pedidos", "Mis pedidos"]]],
                ["Profesionales", [["/alta", "Alta profesional"], ["/alta", "Muestra gratuita"], ["/entrar", "Entrar"]]],
                ["Legal", [["/aviso-legal", "Aviso legal"], ["/privacidad", "Privacidad"], ["/condiciones", "Condiciones de venta"]]],
              ].map(([title, links]) => (
                <div key={title as string} className="space-y-3 text-xs">
                  <div className="font-medium text-white">{title as string}</div>
                  <ul className="space-y-2">
                    {(links as string[][]).map(([href, label]) => (
                      <li key={label}><Link href={href} className="hover:text-white">{label}</Link></li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap justify-between gap-2 pt-6 text-[11px]">
              <span>© {new Date().getFullYear()} {company.name}</span>
              <span>Precios sin IVA · Pago por transferencia · Envíos a toda España</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
