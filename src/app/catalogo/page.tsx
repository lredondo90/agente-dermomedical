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
    <div className="space-y-10">
      {bienvenida && (
        <div className="rounded-lg bg-accent-soft p-4 text-sm text-accent">
          Ya estás dado de alta. Si pediste la muestra gratuita, la preparamos y te avisamos cuando salga.
        </div>
      )}
      <header className="space-y-3">
        <p className="eyebrow">Catálogo profesional</p>
        <h1 className="text-4xl leading-[1.08] font-semibold md:text-5xl">{current ? current.name : "Todos los productos"}</h1>
        <p className="max-w-2xl text-muted">
          {current ? current.focus : "Peelings bioquímicos, cócteles, cremas y tratamientos domiciliarios."}
        </p>
        <div className="flex flex-wrap gap-x-6 gap-y-1 pt-1 text-sm text-subtle">
          <span>Precios sin IVA</span>
          {pricing.tiers.map((t) => (
            <span key={t.pct}>−{t.pct} % desde {euros(t.minCents)}</span>
          ))}
          {pricing.freeShippingFromCents > 0 && <span>Envío gratis desde {euros(pricing.freeShippingFromCents)}</span>}
        </div>
      </header>

      <nav className="sticky top-16 z-10 -mx-4 border-b border-line bg-white/90 px-4 backdrop-blur-md">
        <div className="flex gap-1 overflow-x-auto py-3 [scrollbar-width:none]">
          <Link href="/catalogo" className={`shrink-0 ${!linea ? "btn h-8 px-4" : "btn-ghost h-8 border-transparent px-4"}`}>Todas</Link>
          {lines.map((l) => (
            <Link
              key={l.id}
              href={`/catalogo?linea=${l.id}`}
              className={`shrink-0 ${linea === l.id ? "btn h-8 px-4" : "btn-ghost h-8 border-transparent px-4"}`}
            >
              {l.name}
            </Link>
          ))}
        </div>
      </nav>

      {!loggedIn && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg bg-soft p-5">
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
            <div className="flex items-baseline justify-between gap-4 border-b border-line pb-3">
              <h2 className="text-2xl font-semibold">
                {l.name} <span className="text-base font-normal text-subtle">· {l.focus}</span>
              </h2>
              <Link href={`/catalogo?linea=${l.id}`} className="shrink-0 text-sm text-accent hover:underline">Ver línea ›</Link>
            </div>
          )}
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
            {l.products.map((p) => (
              <ProductCard key={p.id} product={p} canOrder={loggedIn} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
