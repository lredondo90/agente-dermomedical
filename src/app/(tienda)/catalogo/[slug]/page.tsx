import Link from "next/link";
import { notFound } from "next/navigation";
import { euros } from "@/lib/pricing";
import { getSession } from "@/lib/session";
import { getPricing, getProductBySlug, listLines, listProducts } from "@/lib/store";
import { ProductCard } from "@/components/ProductCard";
import { ProductImage } from "@/components/ProductImage";
import { BuyBox } from "./BuyBox";

export const dynamic = "force-dynamic";

export default async function ProductoPage({ params }: { params: Promise<{ slug: string }> }) {
  const product = await getProductBySlug((await params).slug);
  if (!product) notFound();
  const [lines, siblings, pricing, session] = await Promise.all([
    listLines(),
    listProducts({ lineId: product.line_id }),
    getPricing(),
    getSession(),
  ]);
  const line = lines.find((l) => l.id === product.line_id);
  const loggedIn = session?.kind === "customer";
  const related = siblings.filter((p) => p.id !== product.id).slice(0, 4);

  return (
    <div className="space-y-20">
      <div className="space-y-6">
        <nav className="flex items-center gap-1.5 text-sm text-subtle">
          <Link href="/catalogo" className="hover:text-foreground">Catálogo</Link>
          {line && (
            <>
              {" / "}
              <Link href={`/catalogo?linea=${line.id}`} className="hover:text-foreground">{line.name}</Link>
            </>
          )}
        </nav>
        <div className="grid gap-10 md:grid-cols-[1.2fr_1fr] lg:gap-16">
          <ProductImage src={product.image_url} alt={product.name} priority className="rounded-[28px] border border-card-border/70" />
          <div className="space-y-6 md:pt-4">
            <div className="space-y-3">
              {product.professional && <p className="eyebrow">Uso profesional en consulta</p>}
              <h1 className="display text-4xl leading-[1.05] sm:text-5xl">{product.name}</h1>
              <p className="text-muted">{line?.name} · {line?.focus}</p>
            </div>
            <div className="text-sm">
              <span className="chip border border-card-border bg-surface px-3 py-1 text-muted">{product.format}</span>
            </div>
            <div className="border-y border-line py-6">
              {product.price_cents != null ? (
                <div className="text-4xl font-semibold tracking-tight tabular-nums">
                  {euros(product.price_cents)} <span className="text-sm font-normal text-subtle">sin IVA</span>
                </div>
              ) : (
                <div className="text-muted">Precio próximamente</div>
              )}
            </div>
            {product.price_cents != null && loggedIn ? (
              <BuyBox productId={product.id} />
            ) : product.price_cents != null ? (
              <div className="flex flex-wrap gap-3">
                <Link href="/alta" className="btn h-12 flex-1 px-6 text-base">Alta profesional para pedir</Link>
                <Link href="/entrar" className="btn-ghost h-12 px-6 text-base">Entrar</Link>
              </div>
            ) : null}
            <ul className="card space-y-3 p-5 text-sm text-muted">
              <Perk>Muestra gratuita de la línea al darte de alta</Perk>
              {pricing.tiers.map((t) => (
                <Perk key={t.pct}>{t.pct} % de descuento en pedidos desde {euros(t.minCents)}</Perk>
              ))}
              {pricing.freeShippingFromCents > 0 && <Perk>Envío gratis desde {euros(pricing.freeShippingFromCents)}</Perk>}
            </ul>
            {product.source_url && (
              <a href={product.source_url} target="_blank" rel="noreferrer" className="link inline-block text-sm">
                Ficha técnica del fabricante →
              </a>
            )}
          </div>
        </div>
      </div>
      {related.length > 0 && (
        <section className="space-y-8">
          <h2 className="display text-4xl">Más de {line?.name}</h2>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} canOrder={loggedIn} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Perk({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2.5">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="mt-px shrink-0 text-accent" aria-hidden="true">
        <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.12" />
        <path d="m8 12.5 2.5 2.5L16 9.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {children}
    </li>
  );
}
