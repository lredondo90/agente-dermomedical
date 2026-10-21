import Link from "next/link";
import { brand, company } from "@/lib/company";
import { getSession } from "@/lib/session";
import { CartLink } from "@/components/CartLink";
import { Logo } from "@/components/Logo";

export default async function TiendaLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await getSession();
  return (
    <>
      <header className="sticky top-0 z-30 px-3 pt-3">
        <nav className="mx-auto flex h-14 max-w-6xl items-center gap-x-1 rounded-full border border-card-border/80 bg-white/75 pr-2 pl-3 text-sm shadow-card backdrop-blur-xl sm:gap-x-2">
          <Link href="/" className="mr-auto flex items-center gap-2.5">
            <Logo />
            <span className="leading-tight">
              <span className="hidden text-[15px] font-semibold tracking-tight whitespace-nowrap min-[380px]:block">{brand.name}</span>
              <span className="hidden text-[11px] text-subtle sm:block">Canal profesional</span>
            </span>
          </Link>
          <NavLink href="/catalogo">Catálogo</NavLink>
          {session?.kind === "customer" && <NavLink href="/pedidos" className="hidden sm:inline-flex">Mis pedidos</NavLink>}
          {session?.kind === "admin" && <NavLink href="/panel">Panel</NavLink>}
          <CartLink />
          {session ? (
            <NavLink href="/salir" prefetch={false}>Salir</NavLink>
          ) : (
            <>
              <NavLink href="/entrar" className="hidden sm:inline-flex">Entrar</NavLink>
              <Link href="/alta" className="btn ml-1 h-9 px-4 text-[13px]"><span className="sm:hidden">Alta</span><span className="hidden sm:inline">Alta profesional</span></Link>
            </>
          )}
        </nav>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:py-14">{children}</main>
      <footer className="mt-10 bg-footer text-footer-link">
        <div className="mx-auto max-w-6xl px-4 pt-16 pb-8">
          <div className="grid gap-10 border-b border-footer-line pb-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
            <div className="space-y-4">
              <div className="flex items-center gap-2.5">
                <Logo inverted />
                <span className="text-base font-semibold text-white">{brand.name}</span>
              </div>
              <p className="max-w-xs text-sm leading-relaxed">
                {company.name}, distribuidor autorizado de {brand.name} ({brand.owner}). Venta exclusiva a dermatólogos y
                profesionales sanitarios.
              </p>
            </div>
            {[
              ["Tienda", [["/catalogo", "Catálogo"], ["/carrito", "Carrito"], ["/pedidos", "Mis pedidos"]]],
              ["Profesionales", [["/alta", "Alta profesional"], ["/alta", "Muestra gratuita"], ["/entrar", "Entrar"]]],
              ["Legal", [["/aviso-legal", "Aviso legal"], ["/privacidad", "Privacidad"], ["/condiciones", "Condiciones de venta"]]],
            ].map(([title, links]) => (
              <div key={title as string} className="space-y-4 text-sm">
                <div className="text-xs font-medium tracking-[0.14em] text-white/50 uppercase">{title as string}</div>
                <ul className="space-y-2.5">
                  {(links as string[][]).map(([href, label]) => (
                    <li key={label}><Link href={href} className="transition-colors hover:text-white">{label}</Link></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap justify-between gap-2 pt-6 text-xs">
            <span>© {new Date().getFullYear()} {company.name}</span>
            <span>Precios sin IVA · Pago por transferencia · Envíos a toda España</span>
          </div>
        </div>
      </footer>
    </>
  );
}

function NavLink({ href, children, className = "", prefetch }: { href: string; children: React.ReactNode; className?: string; prefetch?: boolean }) {
  return (
    <Link href={href} prefetch={prefetch} className={`${className || "inline-flex"} h-9 items-center rounded-full px-3 text-[#3a3d44] transition-colors hover:bg-soft hover:text-foreground`}>
      {children}
    </Link>
  );
}
