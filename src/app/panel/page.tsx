import Link from "next/link";
import { euros } from "@/lib/pricing";
import { requireAdmin } from "@/lib/session";
import { dashboard, listOrders, ORDER_STATUSES } from "@/lib/store";
import { statusLabel } from "@/components/StatusPill";
import { changeOrderStatus } from "../actions";
import { PanelNav } from "./PanelNav";

export const dynamic = "force-dynamic";

export default async function PanelPage() {
  await requireAdmin();
  const [d, orders] = await Promise.all([dashboard(), listOrders()]);
  const stats = [
    ["Dermatólogos dados de alta", d.customers],
    ["Con permiso de contacto", d.with_consent],
    ["Muestras enviadas", d.samples],
    ["Pedidos", d.orders],
    ["Pendientes de pago", d.pending],
    ["Facturado (IVA incl.)", euros(d.revenue_cents)],
  ];
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Panel</h1>
      <PanelNav />
      {d.unpriced > 0 && (
        <p className="card border-amber-300 bg-amber-50 text-sm">
          {d.unpriced} productos no tienen precio y no se pueden pedir. <Link href="/panel/productos" className="underline">Poner precios</Link>
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map(([label, value]) => (
          <div key={label} className="card">
            <div className="text-xs text-muted">{label}</div>
            <div className="text-xl font-semibold">{value}</div>
          </div>
        ))}
      </div>
      <table className="w-full text-sm">
        <thead className="text-left text-muted">
          <tr><th className="py-2">Nº</th><th>Fecha</th><th>Clínica</th><th>Tipo</th><th>Origen</th><th className="pr-4 text-right">Total</th><th>Estado</th></tr>
        </thead>
        <tbody className="divide-y divide-line">
          {orders.map((o) => (
            <tr key={o.id}>
              <td className="py-2">{o.id}</td>
              <td>{new Date(o.created_at).toLocaleDateString("es-ES")}</td>
              <td>{o.clinic}<div className="text-xs text-muted">{o.customer_name}</div></td>
              <td>{o.kind === "muestra" ? "Muestra" : "Pedido"}</td>
              <td>{o.created_by}</td>
              <td className="pr-4 text-right">{euros(o.total_cents)}</td>
              <td>
                <form action={changeOrderStatus} className="flex gap-1">
                  <input type="hidden" name="id" value={o.id} />
                  <select name="status" defaultValue={o.status} className="input py-1">
                    {ORDER_STATUSES.map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}
                  </select>
                  <button className="btn-ghost py-1">OK</button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
