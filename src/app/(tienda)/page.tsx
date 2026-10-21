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

const Arrow = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
    <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

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
    <div className="-mt-4 space-y-24 sm:-mt-8 sm:space-y-32">
      {/* Portada */}
      <section className="relative overflow-hidden rounded-[32px] border border-card-border/70 bg-surface px-6 py-12 shadow-card sm:px-12 lg:py-16">
        <div className="pointer-events-none absolute -top-40 -right-32 size-[520px] rounded-full bg-[radial-gradient(closest-side,#cfe6df,transparent)] opacity-80" />
        <div className="pointer-events-none absolute -bottom-48 -left-24 size-[440px] rounded-full bg-[radial-gradient(closest-side,#f3e6d6,transparent)] opacity-70" />
        <div className="relative grid items-center gap-12 lg:grid-cols-[1.1fr_1fr]">
          <div className="space-y-7">
            <p className="inline-flex items-center gap-2 rounded-full border border-card-border bg-white/70 px-3 py-1 text-xs text-muted backdrop-blur">
              <span className="size-1.5 rounded-full bg-accent shadow-[0_0_0_3px_rgb(15_107_92/0.15)]" />
              Canal exclusivo para dermatólogos y profesionales sanitarios
            </p>
            <h1 className="display text-[2.75rem] leading-[1.02] sm:text-6xl lg:text-[4.25rem]">{brand.headline}</h1>
            <p className="max-w-lg text-lg leading-relaxed text-muted">
              Date de alta, recibe gratis una muestra de la línea que prefieras y pide cuando quieras con precio profesional y
              hasta un {maxPct} % de descuento por volumen.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/alta" className="btn h-12 px-6 text-[15px]">Pedir muestra gratuita <Arrow /></Link>
              <Link href="/catalogo" className="btn-ghost h-12 px-6 text-[15px]">Ver catálogo</Link>
            </div>
            <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
              {["Precios profesionales", "Muestra sin coste", "Reposición en un clic"].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-accent" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.12" />
                    <path d="m8 12.5 2.5 2.5L16 9.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="relative">
            <div className="grid grid-cols-2 gap-3">
              {showcase[0] && (
                <ProductImage src={showcase[0].image_url} alt={showcase[0].name} priority className="col-span-2 aspect-[16/10] rounded-3xl" />
              )}
              {showcase.slice(1).map((p) => (
                <ProductImage key={p.id} src={p.image_url} alt={p.name} priority className="rounded-3xl" />
              ))}
            </div>
            <div className="absolute top-5 -left-4 hidden rounded-2xl border border-white/60 bg-white/80 px-4 py-3 shadow-lift backdrop-blur-md sm:block">
              <div className="text-xs text-subtle">Muestra de bienvenida</div>
              <div className="text-lg font-semibold">0 €</div>
            </div>
            {maxPct > 0 && (
              <div className="absolute right-4 bottom-[42%] hidden rounded-2xl border border-white/60 bg-white/80 px-4 py-3 shadow-lift backdrop-blur-md sm:block">
                <div className="text-xs text-subtle">Descuento por volumen</div>
                <div className="text-lg font-semibold text-accent">hasta −{maxPct} %</div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Líneas */}
      <section className="space-y-10">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-xl space-y-3">
            <p className="eyebrow">{lineTiles.length} líneas · {products.length} referencias</p>
            <h2 className="display text-4xl leading-[1.05] sm:text-5xl">Una línea para cada indicación</h2>
          </div>
          <p className="max-w-sm text-muted">Peelings bioquímicos, cócteles, cremas y tratamientos domiciliarios para completar el protocolo en consulta.</p>
        </div>
        <div className={`grid grid-cols-2 gap-3 sm:gap-4 ${lineTiles.length % 5 === 0 ? "lg:grid-cols-5" : "lg:grid-cols-3"}`}>
          {lineTiles.map((l) => (
            <Link
              key={l.id}
              href={`/catalogo?linea=${l.id}`}
              className="group flex flex-col rounded-[20px] border border-card-border/70 bg-surface p-2 transition duration-300 hover:-translate-y-0.5 hover:shadow-lift"
            >
              <ProductImage src={l.hero.image_url} alt={l.hero.name} className="rounded-[14px]" />
              <div className="flex items-start justify-between gap-2 px-2.5 pt-3.5 pb-2">
                <div className="min-w-0">
                  <div className="font-semibold tracking-tight">{l.name}</div>
                  <div className="line-clamp-1 text-xs text-subtle">{l.focus}</div>
                </div>
                <span className="mt-0.5 shrink-0 rounded-full bg-soft px-2 py-0.5 text-[11px] text-muted tabular-nums transition-colors group-hover:bg-accent group-hover:text-white">
                  {l.products.length}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Cifras */}
      <section className="relative overflow-hidden rounded-[32px] bg-footer px-6 py-14 text-white sm:px-12">
        <div className="pointer-events-none absolute -top-32 left-1/3 size-[480px] rounded-full bg-[radial-gradient(closest-side,rgb(43_111_99/0.55),transparent)]" />
        <div className="relative grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-4">
          {[
            [String(products.length), "referencias profesionales"],
            [String(lineTiles.length), "líneas por indicación"],
            [`${maxPct} %`, "de descuento por volumen"],
            ["0 €", "muestra para empezar"],
          ].map(([value, label]) => (
            <div key={label} className="border-l border-white/15 pl-5">
              <div className="display text-5xl sm:text-6xl">{value}</div>
              <div className="mt-2 text-sm text-white/60">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Destacados */}
      {featured.length > 0 && (
        <section className="space-y-10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="space-y-3">
              <p className="eyebrow">Peelings de consulta</p>
              <h2 className="display text-4xl leading-[1.05] sm:text-5xl">Los imprescindibles</h2>
            </div>
            <Link href="/catalogo" className="btn-ghost">Ver todo el catálogo <Arrow /></Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} lineName={lineName.get(p.line_id)} canOrder={session?.kind === "customer"} />
            ))}
          </div>
        </section>
      )}

      {/* Cómo funciona */}
      <section className="space-y-10">
        <div className="space-y-3 text-center">
          <p className="eyebrow">Cómo funciona</p>
          <h2 className="display text-4xl sm:text-5xl">Así de fácil</h2>
        </div>
        <ol className="grid gap-4 sm:grid-cols-3">
          {[
            ["Alta profesional", "Con tu número de colegiado, en un minuto."],
            ["Muestra gratuita", "Te enviamos sin coste un vial de 1 ml de la línea que elijas para probarla en consulta."],
            ["Pedido online", "Precios profesionales, descuento automático por volumen y repetir pedido en un clic."],
          ].map(([title, text], i) => (
            <li key={title} className="card relative space-y-3 overflow-hidden p-8">
              <div className="display absolute -top-3 right-5 text-[7rem] leading-none text-soft select-none">{i + 1}</div>
              <div className="relative grid size-10 place-items-center rounded-full bg-accent-soft text-sm font-semibold text-accent-strong">
                0{i + 1}
              </div>
              <div className="relative text-xl font-semibold tracking-tight">{title}</div>
              <p className="relative text-sm leading-relaxed text-muted">{text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Llamada final */}
      <section className="relative overflow-hidden rounded-[32px] bg-[linear-gradient(135deg,#0f3f37,#0f6b5c)] px-6 py-16 text-center text-white sm:py-20">
        <div className="pointer-events-none absolute -right-20 -bottom-40 size-[420px] rounded-full bg-[radial-gradient(closest-side,rgb(255_255_255/0.14),transparent)]" />
        <div className="relative mx-auto max-w-2xl space-y-6">
          <h2 className="display text-4xl leading-[1.05] sm:text-6xl">
            Prueba {brand.name} <span className="italic">en tu consulta</span>
          </h2>
          <p className="text-white/70">Alta en un minuto y muestra gratuita sin compromiso.</p>
          <Link href="/alta" className="btn h-12 bg-white px-7 text-[15px] text-foreground hover:bg-white/90">
            Empezar ahora <Arrow />
          </Link>
        </div>
      </section>
    </div>
  );
}
