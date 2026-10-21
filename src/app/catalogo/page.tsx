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
        <div className="rounded-lg bg-accent-soft p-4 text-sm text-accent">
          Ya estás dado de alta. Si pediste la muestra gratuita, la preparamos y te avisamos cuando salga.
        </div>
      )}
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <h1 className="mb-2 text-4xl leading-[1.08] font-semibold md:text-5xl">Catálogo profesional</h1>
          <p className="text-sm text-muted">
            Precios sin IVA.{" "}
            {pricing.tiers.map((t) => `${t.pct} % desde ${euros(t.minCents)}`).join(" · ")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/catalogo" className={!linea ? "btn h-8 px-4" : "btn-ghost h-8 border-transparent px-4"}>Todas</Link>
          {lines.map((l) => (
            <Link key={l.id} href={`/catalogo?linea=${l.id}`} className={linea === l.id ? "btn h-8 px-4" : "btn-ghost h-8 border-transparent px-4"}>{l.name}</Link>
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
          <h2 className="text-2xl font-semibold">{l.name} <span className="text-base font-normal text-subtle">· {l.focus}</span></h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {l.products.map((p) => (
              <article key={p.id} className="tile flex flex-col gap-2 p-6">
                {p.professional && <div className="eyebrow">Uso profesional</div>}
                <h3 className="text-lg font-semibold">{p.name}</h3>
                <div className="text-sm text-muted">
                  {p.format}
                  {p.source_url && <> · <a href={p.source_url} target="_blank" rel="noreferrer" className="text-[#1890ff] hover:underline">ficha ›</a></>}
                </div>
                <div className="mt-auto flex items-center justify-between pt-4">
                  <span className="text-xl font-semibold">{p.price_cents != null ? euros(p.price_cents) : <span className="text-sm font-normal text-muted">Precio próximamente</span>}</span>
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
