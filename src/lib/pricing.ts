// Reglas de precio. Todo en céntimos y sin IVA salvo el total.

export const MAX_DISCOUNT_PCT = 10;
export const VAT_PCT = 21;

// Canarias, Ceuta y Melilla no llevan IVA peninsular (allí aplica IGIC o IPSI, que liquida el cliente como importación).
const NO_VAT_PROVINCES = new Set(["Las Palmas", "Santa Cruz de Tenerife", "Ceuta", "Melilla"]);

export function vatPctFor(province: string | null | undefined): number {
  return province && NO_VAT_PROVINCES.has(province) ? 0 : VAT_PCT;
}

export type VolumeTier = { minCents: number; pct: number };

export type PricingSettings = {
  tiers: VolumeTier[];
  shippingCents: number;
  freeShippingFromCents: number;
};

export const DEFAULT_PRICING: PricingSettings = {
  tiers: [
    { minCents: 30000, pct: 5 },
    { minCents: 60000, pct: 10 },
  ],
  shippingCents: 690,
  freeShippingFromCents: 15000,
};

export type PricedLine = { productId: number; name: string; quantity: number; unitCents: number; imageUrl?: string | null };

export function discountPct(subtotalCents: number, tiers: VolumeTier[]): number {
  const pct = tiers
    .filter((t) => subtotalCents >= t.minCents)
    .reduce((best, t) => Math.max(best, t.pct), 0);
  return Math.min(Math.max(pct, 0), MAX_DISCOUNT_PCT);
}

export function quote(lines: PricedLine[], settings: PricingSettings, vatPct = VAT_PCT) {
  const priced = lines.map((l) => ({ ...l, lineCents: l.unitCents * l.quantity }));
  const subtotalCents = priced.reduce((sum, l) => sum + l.lineCents, 0);
  const pct = discountPct(subtotalCents, settings.tiers);
  const discountCents = Math.round((subtotalCents * pct) / 100);
  const net = subtotalCents - discountCents;
  const shippingCents = net === 0 || net >= settings.freeShippingFromCents ? 0 : settings.shippingCents;
  const vatCents = Math.round(((net + shippingCents) * vatPct) / 100);
  return {
    lines: priced,
    subtotalCents,
    discountPct: pct,
    discountCents,
    shippingCents,
    vatCents,
    totalCents: net + shippingCents + vatCents,
    nextTier: settings.tiers
      .filter((t) => t.pct > pct && t.pct <= MAX_DISCOUNT_PCT)
      .sort((a, b) => a.minCents - b.minCents)[0],
  };
}

// Valida tramos editados en el panel: nunca por encima del máximo autorizado.
export function sanitizeTiers(tiers: VolumeTier[]): VolumeTier[] {
  return tiers
    .filter((t) => Number.isFinite(t.minCents) && Number.isFinite(t.pct) && t.minCents >= 0 && t.pct > 0)
    .map((t) => ({ minCents: Math.round(t.minCents), pct: Math.min(Math.round(t.pct), MAX_DISCOUNT_PCT) }))
    .sort((a, b) => a.minCents - b.minCents);
}

export function euros(cents: number): string {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(cents / 100);
}
