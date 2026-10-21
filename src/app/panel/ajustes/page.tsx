import { euros, MAX_DISCOUNT_PCT } from "@/lib/pricing";
import { requireAdmin } from "@/lib/session";
import { getPricing } from "@/lib/store";
import { savePricingSettings } from "../../actions";
import { PanelNav } from "../PanelNav";

export const dynamic = "force-dynamic";

const amount = (cents?: number) => (cents != null ? (cents / 100).toFixed(2) : "");

export default async function AjustesPage() {
  await requireAdmin();
  const pricing = await getPricing();
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold">Descuentos y envío</h1>
      <PanelNav />
      <form action={savePricingSettings} className="card max-w-xl space-y-4 text-sm">
        <div>
          <h2 className="font-medium">Descuento por volumen</h2>
          <p className="text-muted">Se aplica el tramo más alto alcanzado (subtotal sin IVA). Máximo {MAX_DISCOUNT_PCT} %, también para el agente.</p>
        </div>
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-2">
            Desde <input name={`min${i}`} defaultValue={amount(pricing.tiers[i]?.minCents)} className="input w-28" inputMode="decimal" /> €
            → <input name={`pct${i}`} type="number" min={0} max={MAX_DISCOUNT_PCT} defaultValue={pricing.tiers[i]?.pct ?? ""} className="input w-20" /> %
          </div>
        ))}
        <div className="flex items-center gap-2">
          Envío <input name="shipping" defaultValue={amount(pricing.shippingCents)} className="input w-28" inputMode="decimal" /> €,
          gratis desde <input name="freeFrom" defaultValue={amount(pricing.freeShippingFromCents)} className="input w-28" inputMode="decimal" /> €
        </div>
        <p className="text-muted">Ahora: {pricing.tiers.map((t) => `${t.pct} % desde ${euros(t.minCents)}`).join(", ") || "sin descuentos"}.</p>
        <button className="btn">Guardar</button>
      </form>
    </div>
  );
}
