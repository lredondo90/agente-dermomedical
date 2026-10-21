import Link from "next/link";
import { euros } from "@/lib/pricing";
import { getSession } from "@/lib/session";
import { getPricing, listLines, listProducts } from "@/lib/store";
import { ProductCard } from "@/components/ProductCard";

export const dynamic = "force-dynamic";

export default async function CatalogoPage({ searchParams }: { searchParams: Promise<{ linea?: string; bienvenida?: string }> }) {
  const { linea, bienvenida } = await searchParams;
  const [lines, products, pricing, session] = await Promise.all([
    listLines(),
    listProducts({ lineId: linea }),
    getPricing(),
    getSession(),
  ]);
  const loggedIn = session?.kind === "customer";
  const current = lines.find((l) => l.id === linea);
  const byLine = lines
    .map((l) => ({ ...l, products: products.filter((p) => p.line_id === l.id) }))
    .filter((l) => l.products.length > 0);

  return (
    <div className="space-y-12">
      {bienvenida && (
        <div className="rounded-2xl border border-accent/15 bg-accent-soft px-5 py-4 text-sm text-accent-strong">
          Ya estás dado de alta. Si pediste la muestra gratuita, la preparamos y te avisamos cuando salga.
        </div>
      )}
      <header className="space-y-3">
        <p className="eyebrow">Catálogo profesional</p>
        <h1 className="display text-5xl leading-[1.02] md:text-6xl">{current ? current.name : "Todos los productos"}</h1>
        <p className="max-w-2xl text-muted">
          {current ? current.focus : "Peelings bioquímicos, cócteles, cremas y tratamientos domiciliarios."}
        </p>
        <div className="flex flex-wrap gap-2 pt-2 text-xs">
          <span className="chip border border-card-border bg-surface text-muted">Precios sin IVA</span>
          {pricing.tiers.map((t) => (
            <span key={t.pct} className="chip bg-accent-soft text-accent-strong">−{t.pct} % desde {euros(t.minCents)}</span>
          ))}
          {pricing.freeShippingFromCents > 0 && <span className="chip border border-card-border bg-surface text-muted">Envío gratis desde {euros(pricing.freeShippingFromCents)}</span>}
        </div>
      </header>

      <nav className="sticky top-[76px] z-20">
        <div className="flex w-fit max-w-full gap-1 overflow-x-auto rounded-full border border-card-border/80 bg-white/80 p-1 shadow-card backdrop-blur-xl [scrollbar-width:none]">
          <Link href="/catalogo" className={`shrink-0 ${!linea ? "btn h-8 px-4" : "btn-ghost h-8 border-transparent bg-transparent px-4 shadow-none"}`}>Todas</Link>
          {lines.map((l) => (
            <Link
              key={l.id}
              href={`/catalogo?linea=${l.id}`}
              className={`shrink-0 ${linea === l.id ? "btn h-8 px-4" : "btn-ghost h-8 border-transparent bg-transparent px-4 shadow-none"}`}
            >
              {l.name}
            </Link>
          ))}
        </div>
      </nav>

      {!loggedIn && (
        <div className="card flex flex-wrap items-center justify-between gap-4 p-5">
          <p className="text-sm text-muted">Para hacer pedidos necesitas una cuenta profesional. La muestra gratuita va incluida en el alta.</p>
          <div className="flex gap-2">
            <Link href="/entrar" className="btn-ghost h-9 px-4">Entrar</Link>
            <Link href="/alta" className="btn h-9 px-4">Alta profesional</Link>
          </div>
        </div>
      )}

      {byLine.map((l) => (
        <section key={l.id} className="space-y-6">
          {!current && (
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className="display text-3xl">{l.name}</h2>
                <p className="text-sm text-subtle">{l.focus}</p>
              </div>
              <Link href={`/catalogo?linea=${l.id}`} className="link shrink-0 text-sm">Ver línea →</Link>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
            {l.products.map((p) => (
              <ProductCard key={p.id} product={p} canOrder={loggedIn} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
