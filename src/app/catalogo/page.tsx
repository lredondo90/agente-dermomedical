import Link from "next/link";
import { euros } from "@/lib/pricing";
import { getSession } from "@/lib/session";
import { getPricing, listLines, listProducts } from "@/lib/store";
import { AddButton } from "./AddButton";

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
  const byLine = lines
    .map((l) => ({ ...l, products: products.filter((p) => p.line_id === l.id) }))
    .filter((l) => l.products.length > 0);

  return (
    <div className="space-y-6">
      {bienvenida && (
        <div className="card border-accent bg-accent-soft text-sm">
          Ya estás dado de alta. Si pediste la muestra gratuita, la preparamos y te avisamos cuando salga.
        </div>
      )}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Catálogo profesional</h1>
          <p className="text-sm text-muted">
            Precios sin IVA.{" "}
            {pricing.tiers.map((t) => `${t.pct} % desde ${euros(t.minCents)}`).join(" · ")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          <Link href="/catalogo" className={!linea ? "btn" : "btn-ghost"}>Todas</Link>
          {lines.map((l) => (
            <Link key={l.id} href={`/catalogo?linea=${l.id}`} className={linea === l.id ? "btn" : "btn-ghost"}>{l.name}</Link>
          ))}
        </div>
      </div>
      {!loggedIn && (
        <p className="text-sm text-muted">
          Para hacer pedidos, <Link href="/alta" className="underline">date de alta</Link> o <Link href="/entrar" className="underline">entra</Link>.
        </p>
      )}
      {byLine.map((l) => (
        <section key={l.id} className="space-y-3">
          <h2 className="text-lg font-semibold">{l.name} <span className="text-sm font-normal text-muted">· {l.focus}</span></h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {l.products.map((p) => (
              <article key={p.id} className="card flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-medium">{p.name}</h3>
                  {p.professional && <span className="shrink-0 rounded bg-accent-soft px-2 py-0.5 text-xs text-accent">Uso profesional</span>}
                </div>
                <div className="text-xs text-muted">
                  {p.format}
                  {p.source_url && <> · <a href={p.source_url} target="_blank" rel="noreferrer" className="underline">ficha</a></>}
                </div>
                <div className="mt-auto flex items-center justify-between">
                  <span className="font-semibold">{p.price_cents != null ? euros(p.price_cents) : <span className="text-sm font-normal text-muted">Precio próximamente</span>}</span>
                  {p.price_cents != null && loggedIn && <AddButton productId={p.id} />}
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
