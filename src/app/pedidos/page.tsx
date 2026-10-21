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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Mis pedidos</h1>
        <Link href="/cuenta" className="btn-ghost">Mi cuenta</Link>
      </div>
      {orders.length === 0 ? (
        <p className="text-muted">Aún no tienes pedidos. <Link href="/catalogo" className="underline">Ver catálogo</Link></p>
      ) : (
        <table className="w-full text-sm">
          <thead className="text-left text-muted">
            <tr><th className="py-2">Nº</th><th>Fecha</th><th>Tipo</th><th>Estado</th><th className="text-right">Total</th></tr>
          </thead>
          <tbody className="divide-y divide-line">
            {orders.map((o) => (
              <tr key={o.id}>
                <td className="py-2"><Link href={`/pedidos/${o.id}`} className="underline">{o.id}</Link></td>
                <td>{new Date(o.created_at).toLocaleDateString("es-ES")}</td>
                <td>{o.kind === "muestra" ? "Muestra gratuita" : "Pedido"}</td>
                <td><StatusPill status={o.status} /></td>
                <td className="text-right">{euros(o.total_cents)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
