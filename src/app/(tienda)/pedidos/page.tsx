import Link from "next/link";
import { euros } from "@/lib/pricing";
import { requireCustomer } from "@/lib/session";
import { listOrders } from "@/lib/store";
import { StatusPill } from "@/components/StatusPill";

export const dynamic = "force-dynamic";

export default async function PedidosPage() {
  const customerId = await requireCustomer();
  const orders = await listOrders(customerId);
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="display text-5xl leading-none">Mis pedidos</h1>
        <Link href="/cuenta" className="btn-ghost">Mi cuenta</Link>
      </div>
      {orders.length === 0 ? (
        <p className="text-muted">Aún no tienes pedidos. <Link href="/catalogo" className="link">Ver catálogo</Link></p>
      ) : (
        <div className="card overflow-x-auto p-2"><table className="table">
          <thead>
            <tr><th>Nº</th><th>Fecha</th><th>Tipo</th><th>Estado</th><th className="!text-right">Total</th></tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td><Link href={`/pedidos/${o.id}`} className="link">{o.id}</Link></td>
                <td>{new Date(o.created_at).toLocaleDateString("es-ES")}</td>
                <td>{o.kind === "muestra" ? "Muestra gratuita" : "Pedido"}</td>
                <td><StatusPill status={o.status} /></td>
                <td className="text-right tabular-nums">{euros(o.total_cents)}</td>
              </tr>
            ))}
          </tbody>
        </table></div>
      )}
    </div>
  );
}
