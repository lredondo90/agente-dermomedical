import Link from "next/link";
import { brand, company } from "@/lib/company";
import { query } from "@/lib/db";
import { getSession } from "@/lib/session";
import { Logo } from "@/components/Logo";
import { PanelSidebar } from "./PanelSidebar";

export const dynamic = "force-dynamic";

// El panel tiene su propio armazón: barra lateral con las secciones y el contenido a la derecha.
// Sin sesión de administrador solo se muestra la pantalla de acceso, centrada.
export default async function PanelLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await getSession();
  if (session?.kind !== "admin") {
    return (
      <main className="grid flex-1 place-items-center px-4 py-16">
        <div className="w-full max-w-sm space-y-6">
          <Link href="/" className="flex items-center justify-center gap-2.5">
            <Logo />
            <span className="text-lg font-semibold tracking-tight">{brand.name}</span>
          </Link>
          {children}
        </div>
      </main>
    );
  }
  const [{ n: needsHuman }] = await query<{ n: number }>("select count(*)::int as n from customers where needs_human");

  return (
    <div className="flex flex-1 flex-col lg:flex-row lg:items-start print:block">
      <aside className="no-print border-b border-card-border bg-surface lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-64 lg:shrink-0 lg:flex-col lg:border-r lg:border-b-0">
        <div className="flex items-center gap-2.5 px-5 py-4 lg:py-6">
          <Logo />
          <div className="leading-tight">
            <div className="text-[15px] font-semibold tracking-tight">{brand.name}</div>
            <div className="text-[11px] text-subtle">Panel · {company.name}</div>
          </div>
        </div>
        <PanelSidebar needsHuman={needsHuman} />
        <div className="hidden space-y-1 border-t border-line p-3 text-sm lg:block">
          <Link href="/" className="flex h-9 items-center gap-2.5 rounded-lg px-3 text-muted transition-colors hover:bg-soft hover:text-foreground">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            Ver la tienda
          </Link>
          <Link href="/salir" prefetch={false} className="flex h-9 items-center gap-2.5 rounded-lg px-3 text-muted transition-colors hover:bg-soft hover:text-foreground">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l5-5-5-5M15 12H3" strokeLinecap="round" strokeLinejoin="round" /></svg>
            Salir
          </Link>
        </div>
      </aside>
      <main className="min-w-0 flex-1 px-4 py-8 sm:px-8 lg:px-10 lg:py-10 print:p-0">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
