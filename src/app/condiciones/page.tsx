import { company } from "@/lib/company";
import { euros, MAX_DISCOUNT_PCT } from "@/lib/pricing";
import { getPricing } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function Condiciones() {
  const p = await getPricing();
  return (
    <article className="mx-auto max-w-2xl space-y-3 text-sm">
      <h1 className="text-3xl font-semibold">Condiciones de venta profesional</h1>
      <p className="rounded-lg bg-amber-50 p-3">Borrador pendiente de revisión por un abogado.</p>
      <p>Vendedor: {company.name}, {company.taxId}. Venta exclusiva a profesionales sanitarios; no aplica el derecho de desistimiento de consumidores.</p>
      <p>Precios en euros sin IVA. Descuento por volumen: {p.tiers.map((t) => `${t.pct} % desde ${euros(t.minCents)}`).join(", ")} (máximo {MAX_DISCOUNT_PCT} %).</p>
      <p>Envío {euros(p.shippingCents)}, gratuito desde {euros(p.freeShippingFromCents)}. Plazo de entrega: [por definir]. Envíos a Canarias, Ceuta y Melilla sin IVA peninsular; los impuestos de importación corren a cargo del cliente.</p>
      <p>Pago por transferencia o tarjeta. El pedido se prepara al recibir el pago. Incidencias en {company.email} en los 7 días siguientes a la entrega.</p>
    </article>
  );
}
