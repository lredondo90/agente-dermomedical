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
        <nav className="text-sm text-subtle">
          <Link href="/catalogo" className="hover:text-foreground">Catálogo</Link>
          {line && (
            <>
              {" / "}
              <Link href={`/catalogo?linea=${line.id}`} className="hover:text-foreground">{line.name}</Link>
            </>
          )}
        </nav>
        <div className="grid gap-10 md:grid-cols-[1.2fr_1fr] lg:gap-16">
          <ProductImage src={product.image_url} alt={product.name} priority />
          <div className="space-y-6">
            <div className="space-y-2">
              {product.professional && <p className="eyebrow">Uso profesional en consulta</p>}
              <h1 className="text-3xl leading-tight font-semibold">{product.name}</h1>
              <p className="text-muted">{line?.name} · {line?.focus}</p>
            </div>
            <div className="text-sm">
              <span className="rounded-full bg-fog px-3 py-1">{product.format}</span>
            </div>
            <div className="border-y border-line py-5">
              {product.price_cents != null ? (
                <div className="text-3xl font-semibold">
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
            <ul className="space-y-3 rounded-lg bg-soft p-5 text-sm text-[#3b3e40]">
              <li>✓ Muestra gratuita de la línea al darte de alta</li>
              {pricing.tiers.map((t) => (
                <li key={t.pct}>✓ {t.pct} % de descuento en pedidos desde {euros(t.minCents)}</li>
              ))}
              {pricing.freeShippingFromCents > 0 && <li>✓ Envío gratis desde {euros(pricing.freeShippingFromCents)}</li>}
            </ul>
            {product.source_url && (
              <a href={product.source_url} target="_blank" rel="noreferrer" className="inline-block text-sm text-accent hover:underline">
                Ficha técnica del fabricante ›
              </a>
            )}
          </div>
        </div>
      </div>
      {related.length > 0 && (
        <section className="space-y-8">
          <h2 className="text-2xl font-semibold">Más de {line?.name}</h2>
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} canOrder={loggedIn} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
