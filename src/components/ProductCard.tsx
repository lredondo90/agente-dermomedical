import Link from "next/link";
import { euros } from "@/lib/pricing";
import type { Product } from "@/lib/store";
import { AddButton } from "./AddButton";
import { ProductImage } from "./ProductImage";

export function ProductCard({ product: p, lineName, canOrder }: { product: Product; lineName?: string; canOrder: boolean }) {
  return (
    <article className="group flex flex-col rounded-[20px] border border-card-border/70 bg-surface p-2 transition duration-300 hover:-translate-y-0.5 hover:shadow-lift">
      <Link href={`/catalogo/${p.slug}`} className="relative block">
        <ProductImage src={p.image_url} alt={p.name} className="rounded-[14px]" />
        {p.professional && (
          <span className="chip absolute top-2.5 left-2.5 bg-white/85 text-[11px] text-foreground backdrop-blur">Uso profesional</span>
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-1 px-2.5 pt-3.5 pb-2">
        {lineName && <span className="text-xs text-subtle">{lineName}</span>}
        <Link href={`/catalogo/${p.slug}`} className="line-clamp-2 text-[15px] leading-snug font-medium transition-colors hover:text-accent">
          {p.name}
        </Link>
        <div className="text-[13px] text-subtle">{p.format}</div>
        <div className="mt-auto flex items-center justify-between gap-2 pt-3">
          {p.price_cents != null ? (
            <span className="text-base font-semibold tabular-nums">
              {euros(p.price_cents)} <span className="text-xs font-normal text-subtle">+ IVA</span>
            </span>
          ) : (
            <span className="text-sm text-subtle">Precio próximamente</span>
          )}
          {p.price_cents != null && canOrder && <AddButton productId={p.id} />}
        </div>
      </div>
    </article>
  );
}
