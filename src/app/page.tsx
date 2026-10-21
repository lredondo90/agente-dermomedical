import Link from "next/link";
import { brand } from "@/lib/company";
import { getSession } from "@/lib/session";
import { getPricing, listLines, listProducts, type Product } from "@/lib/store";
import { ProductCard } from "@/components/ProductCard";
import { ProductImage } from "@/components/ProductImage";

export const dynamic = "force-dynamic";

// Producto que representa a cada línea: el envase profesional con foto, si lo hay.
function heroOf(products: Product[]) {
  return products.find((p) => p.image_url && p.format === "Envase") ?? products.find((p) => p.image_url) ?? products[0];
}

export default async function Home() {
  const [lines, products, pricing, session] = await Promise.all([listLines(), listProducts(), getPricing(), getSession()]);
  const lineTiles = lines
    .map((l) => ({ ...l, products: products.filter((p) => p.line_id === l.id) }))
    .filter((l) => l.products.length > 0)
    .map((l) => ({ ...l, hero: heroOf(l.products) }));
  const showcase = lineTiles.slice(0, 3).map((l) => l.hero);
  const featured = lineTiles
    .map((l) => l.products.find((p) => p.format === "Envase" && p.professional && p.image_url))
    .filter((p): p is Product => !!p)
    .slice(0, 4);
  const lineName = new Map(lines.map((l) => [l.id, l.name]));
  const maxPct = Math.max(0, ...pricing.tiers.map((t) => t.pct));

  return (
    <div className="-mt-10 space-y-24">
      <section className="bleed bg-fog">
        <div className="grid items-center gap-10 py-14 md:grid-cols-[1.05fr_1fr] md:py-20">
          <div className="space-y-6">
            <p className="eyebrow">Canal exclusivo para dermatólogos y profesionales sanitarios</p>
            <h1 className="text-[2.1rem] leading-[1.08] font-semibold sm:text-5xl lg:text-[3.4rem]">{brand.headline}</h1>
            <p className="max-w-lg text-lg text-muted">
              Date de alta, recibe gratis una muestra de la línea que prefieras y pide cuando quieras con precio profesional
              y hasta un {maxPct} % de descuento por volumen.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/alta" className="btn h-12 px-7 text-base">Pedir muestra gratuita</Link>
              <Link href="/catalogo" className="btn-ghost h-12 px-7 text-base">Ver catálogo</Link>
            </div>
            <ul className="flex flex-wrap gap-x-6 gap-y-2 pt-2 text-sm text-muted">
              {["Precios profesionales", "Muestra sin coste", "Reposición en un clic"].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <span className="grid size-4 place-items-center rounded-full bg-accent text-[10px] text-white">✓</span>
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {showcase[0] && (
              <ProductImage src={showcase[0].image_url} alt={showcase[0].name} priority className="col-span-2 aspect-[2/1] bg-white" />
            )}
            {showcase.slice(1).map((p) => (
              <ProductImage key={p.id} src={p.image_url} alt={p.name} priority className="bg-white" />
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-10">
        <div className="mx-auto max-w-2xl space-y-3 text-center">
          <p className="text-sm text-subtle">{lineTiles.length} líneas · {products.length} referencias</p>
          <h2 className="text-3xl font-semibold md:text-[2.5rem] md:leading-tight">Una línea para cada indicación</h2>
          <p className="text-muted">Peelings bioquímicos, cócteles, cremas y tratamientos domiciliarios para completar el protocolo en consulta.</p>
        </div>
        <div className={`grid grid-cols-2 gap-3 sm:gap-4 ${lineTiles.length % 5 === 0 ? "lg:grid-cols-5" : "lg:grid-cols-3"}`}>
          {lineTiles.map((l) => (
            <Link key={l.id} href={`/catalogo?linea=${l.id}`} className="group flex flex-col bg-fog">
              <div className="space-y-1 px-4 pt-6 text-center">
                <div className="text-xl font-semibold">{l.name}</div>
                <div className="line-clamp-2 min-h-8 text-xs text-subtle">{l.focus}</div>
                <div className="text-sm text-[#1890ff]">
                  {l.products.length} {l.products.length === 1 ? "producto" : "productos"} <span className="transition-transform group-hover:translate-x-0.5">›</span>
                </div>
              </div>
              <ProductImage src={l.hero.image_url} alt={l.hero.name} className="mx-auto w-4/5 bg-transparent" />
            </Link>
          ))}
        </div>
      </section>

      <section className="bleed bg-footer text-white">
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 py-16 text-center lg:grid-cols-4">
          {[
            [String(products.length), "referencias profesionales"],
            [String(lineTiles.length), "líneas por indicación"],
            [`${maxPct} %`, "de descuento por volumen"],
            ["0 €", "muestra para empezar"],
          ].map(([value, label]) => (
            <div key={label}>
              <div className="text-4xl font-normal tracking-tight sm:text-5xl">{value}</div>
              <div className="mt-2 text-sm text-footer-link">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {featured.length > 0 && (
        <section className="space-y-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="space-y-2">
              <p className="eyebrow">Peelings de consulta</p>
              <h2 className="text-3xl font-semibold md:text-[2.5rem] md:leading-tight">Los imprescindibles</h2>
            </div>
            <Link href="/catalogo" className="text-sm text-accent hover:underline">Ver todo el catálogo ›</Link>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} lineName={lineName.get(p.line_id)} canOrder={session?.kind === "customer"} />
            ))}
          </div>
        </section>
      )}

      <section className="space-y-10">
        <h2 className="text-center text-3xl font-semibold md:text-[2.5rem]">Así de fácil</h2>
        <ol className="grid gap-px overflow-hidden bg-line sm:grid-cols-3">
          {[
            ["Alta profesional", "Con tu número de colegiado, en un minuto."],
            ["Muestra gratuita", "Te enviamos sin coste un vial de 1 ml de la línea que elijas para probarla en consulta."],
            ["Pedido online", "Precios profesionales, descuento automático por volumen y repetir pedido en un clic."],
          ].map(([title, text], i) => (
            <li key={title} className="space-y-3 bg-white p-8">
              <div className="text-sm font-semibold text-accent">0{i + 1}</div>
              <div className="text-xl font-semibold">{title}</div>
              <p className="text-sm leading-relaxed text-muted">{text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="bleed bg-soft">
        <div className="mx-auto max-w-2xl space-y-5 py-16 text-center">
          <h2 className="text-3xl font-semibold md:text-[2.5rem] md:leading-tight">Prueba {brand.name} en tu consulta</h2>
          <p className="text-muted">Alta en un minuto y muestra gratuita sin compromiso.</p>
          <Link href="/alta" className="btn h-12 px-8 text-base">Empezar ahora</Link>
        </div>
      </section>
    </div>
  );
}
