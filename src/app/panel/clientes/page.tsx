import Link from "next/link";
import { euros } from "@/lib/pricing";
import { requireAdmin } from "@/lib/session";
import { listCustomers } from "@/lib/store";
import { PageHeader } from "../PageHeader";

export const dynamic = "force-dynamic";

export default async function ClientesPage() {
  await requireAdmin();
  const customers = await listCustomers();
  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Clientes" title={`${customers.length} dermatólogos dados de alta`}>Pulsa una clínica para ver su conversación con el agente.</PageHeader>
      <div className="card overflow-x-auto p-2">
      <table className="table">
        <thead>
          <tr><th>Clínica</th><th>Contacto</th><th>Provincia</th><th>Origen</th><th>Correo</th><th>WhatsApp</th><th className="!text-right">Pedidos</th><th className="!text-right">Comprado</th></tr>
        </thead>
        <tbody>
          {customers.map((c) => (
            <tr key={c.id}>
              <td><Link href={`/panel/agente/conversacion/${c.id}`} className="font-medium hover:text-accent">{c.clinic}</Link>{c.needs_human && <span className="chip ml-2 bg-warn-soft text-warn">Requiere persona</span>}</td>
              <td>{c.name}<div className="text-xs text-muted">{c.email}{c.phone && ` · ${c.phone}`}</div></td>
              <td>{c.province}</td>
              <td><span className="chip bg-soft text-muted">{c.source}</span></td>
              <td><YesNo on={c.consent_email} /></td>
              <td><YesNo on={c.consent_whatsapp} /></td>
              <td className="text-right tabular-nums">{c.orders}</td>
              <td className="text-right tabular-nums">{euros(c.spent_cents)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {customers.length === 0 && <p className="px-3 py-6 text-sm text-muted">Todavía no hay clientes.</p>}
      </div>
    </div>
  );
}

function YesNo({ on }: { on: boolean }) {
  return <span className={`chip ${on ? "bg-accent-soft text-accent-strong" : "bg-soft text-subtle"}`}>{on ? "Sí" : "No"}</span>;
}
