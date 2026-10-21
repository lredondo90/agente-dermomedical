import { euros, MAX_DISCOUNT_PCT } from "@/lib/pricing";
import { requireAdmin } from "@/lib/session";
import { getPricing } from "@/lib/store";
import { savePricingSettings } from "../../actions";
import { PageHeader } from "../PageHeader";

export const dynamic = "force-dynamic";

const amount = (cents?: number) => (cents != null ? (cents / 100).toFixed(2) : "");

export default async function AjustesPage() {
  await requireAdmin();
  const pricing = await getPricing();
  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Precios" title="Descuentos y envío" />
      <form action={savePricingSettings} className="card max-w-xl space-y-5 text-sm">
        <div className="space-y-1">
          <h2 className="section-title">Descuento por volumen</h2>
          <p className="text-muted">Se aplica el tramo más alto alcanzado (subtotal sin IVA). Máximo {MAX_DISCOUNT_PCT} %, también para el agente.</p>
        </div>
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-2 rounded-xl bg-soft px-3 py-2">
            Desde <input name={`min${i}`} defaultValue={amount(pricing.tiers[i]?.minCents)} className="input h-9 w-28 py-0 text-right" inputMode="decimal" /> €
            → <input name={`pct${i}`} type="number" min={0} max={MAX_DISCOUNT_PCT} defaultValue={pricing.tiers[i]?.pct ?? ""} className="input h-9 w-20 py-0 text-right" /> %
          </div>
        ))}
        <h2 className="section-title pt-2">Envío</h2>
        <div className="flex flex-wrap items-center gap-2 rounded-xl bg-soft px-3 py-2">
          Envío <input name="shipping" defaultValue={amount(pricing.shippingCents)} className="input h-9 w-28 py-0 text-right" inputMode="decimal" /> €,
          gratis desde <input name="freeFrom" defaultValue={amount(pricing.freeShippingFromCents)} className="input h-9 w-28 py-0 text-right" inputMode="decimal" /> €
        </div>
        <p className="text-subtle">Ahora: {pricing.tiers.map((t) => `${t.pct} % desde ${euros(t.minCents)}`).join(", ") || "sin descuentos"}.</p>
        <button className="btn">Guardar</button>
      </form>
    </div>
  );
}
