import Link from "next/link";
import { euros } from "@/lib/pricing";
import type { Product } from "@/lib/store";
import { AddButton } from "@/app/catalogo/AddButton";
import { ProductImage } from "./ProductImage";

export function ProductCard({ product: p, lineName, canOrder }: { product: Product; lineName?: string; canOrder: boolean }) {
  return (
    <article className="group flex flex-col">
      <Link href={`/catalogo/${p.slug}`} className="block">
        <ProductImage src={p.image_url} alt={p.name} />
      </Link>
      <div className="flex flex-1 flex-col gap-1 pt-4">
        <div className="flex items-center gap-2 text-xs">
          {lineName && <span className="text-subtle">{lineName}</span>}
          {p.professional && <span className="eyebrow">Uso profesional</span>}
        </div>
        <Link href={`/catalogo/${p.slug}`} className="text-[15px] leading-snug font-semibold hover:text-accent">
          {p.name}
        </Link>
        <div className="text-sm text-muted">{p.format}</div>
        <div className="mt-auto flex items-center justify-between gap-2 pt-3">
          {p.price_cents != null ? (
            <span className="text-lg font-semibold">
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
