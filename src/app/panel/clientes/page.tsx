import Link from "next/link";
import { euros } from "@/lib/pricing";
import { requireAdmin } from "@/lib/session";
import { listCustomers } from "@/lib/store";
import { PanelNav } from "../PanelNav";

export const dynamic = "force-dynamic";

export default async function ClientesPage() {
  await requireAdmin();
  const customers = await listCustomers();
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold">Clientes</h1>
      <PanelNav />
      <table className="w-full text-sm">
        <thead className="text-left text-muted">
          <tr><th className="py-2">Clínica</th><th>Contacto</th><th>Provincia</th><th>Origen</th><th>Correo</th><th>WhatsApp</th><th className="text-right">Pedidos</th><th className="text-right">Comprado</th></tr>
        </thead>
        <tbody className="divide-y divide-line">
          {customers.map((c) => (
            <tr key={c.id}>
              <td className="py-2"><Link href={`/panel/agente/conversacion/${c.id}`} className="font-medium hover:underline">{c.clinic}</Link>{c.needs_human && <span className="ml-2 rounded-full bg-amber-50 px-2 text-xs text-amber-800">Requiere persona</span>}</td>
              <td>{c.name}<div className="text-xs text-muted">{c.email}{c.phone && ` · ${c.phone}`}</div></td>
              <td>{c.province}</td>
              <td>{c.source}</td>
              <td>{c.consent_email ? "Sí" : "No"}</td>
              <td>{c.consent_whatsapp ? "Sí" : "No"}</td>
              <td className="text-right">{c.orders}</td>
              <td className="text-right">{euros(c.spent_cents)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
