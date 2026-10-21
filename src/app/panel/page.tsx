import Link from "next/link";
import { euros } from "@/lib/pricing";
import { requireAdmin } from "@/lib/session";
import { dashboard, listOrders, ORDER_STATUSES } from "@/lib/store";
import { statusLabel } from "@/components/StatusPill";
import { changeOrderStatus } from "../actions";
import { PageHeader, Stat } from "./PageHeader";

export const dynamic = "force-dynamic";

export default async function PanelPage() {
  await requireAdmin();
  const [d, orders] = await Promise.all([dashboard(), listOrders()]);
  const stats: [string, string | number, ("accent" | "warn")?][] = [
    ["Dermatólogos dados de alta", d.customers],
    ["Con permiso de contacto", d.with_consent],
    ["Muestras enviadas", d.samples],
    ["Pedidos", d.orders],
    ["Pendientes de pago", d.pending, d.pending > 0 ? "warn" : undefined],
    ["Facturado (IVA incl.)", euros(d.revenue_cents), "accent"],
  ];
  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Resumen" title="Pedidos y actividad" />
      {d.unpriced > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-warn/20 bg-warn-soft px-5 py-4 text-sm text-warn">
          <span>{d.unpriced} productos no tienen precio y no se pueden pedir.</span>
          <Link href="/panel/productos" className="btn-ghost h-9 px-4">Poner precios</Link>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {stats.map(([label, value, tone]) => (
          <Stat key={label} label={label} value={value} tone={tone} />
        ))}
      </div>
      <section className="card overflow-x-auto p-2">
        <h2 className="section-title px-3 pt-3 pb-3">Últimos pedidos</h2>
        {orders.length === 0 && <p className="px-3 pb-4 text-sm text-muted">Todavía no hay pedidos.</p>}
      <table className="table">
        <thead>
          <tr><th>Nº</th><th>Fecha</th><th>Clínica</th><th>Tipo</th><th>Origen</th><th className="!text-right">Total</th><th>Estado</th></tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id}>
              <td className="font-medium tabular-nums">{o.id}</td>
              <td>{new Date(o.created_at).toLocaleDateString("es-ES")}</td>
              <td>{o.clinic}<div className="text-xs text-muted">{o.customer_name}</div></td>
              <td><span className={`chip ${o.kind === "muestra" ? "bg-accent-soft text-accent-strong" : "bg-soft text-muted"}`}>{o.kind === "muestra" ? "Muestra" : "Pedido"}</span></td>
              <td>{o.created_by}</td>
              <td className="text-right tabular-nums">{euros(o.total_cents)}</td>
              <td>
                <form action={changeOrderStatus} className="flex gap-1">
                  <input type="hidden" name="id" value={o.id} />
                  <select name="status" defaultValue={o.status} className="input h-8 w-auto rounded-lg py-0 text-[13px]">
                    {ORDER_STATUSES.map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}
                  </select>
                  <button className="btn-ghost h-8 px-3 text-[13px]">OK</button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </section>
    </div>
  );
}
