import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/session";
import { getCustomer } from "@/lib/store";
import { listMessages } from "@/lib/agent/channels";
import { humanReply, resolveHuman, simulateInbound } from "../../actions";
import { PanelNav } from "../../../PanelNav";

export const dynamic = "force-dynamic";

export default async function ConversacionPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const customer = await getCustomer(Number(id));
  if (!customer) notFound();
  const messages = await listMessages(customer.id);
  const lastChannel = messages.findLast((m) => m.channel !== "panel")?.channel ?? (customer.consent_whatsapp && customer.phone ? "whatsapp" : "email");

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold">{customer.clinic}</h1>
      <PanelNav />
      <p className="text-sm text-muted">
        {customer.name} · {customer.email}{customer.phone && ` · ${customer.phone}`} · {customer.province} · Correo: {customer.consent_email ? "sí" : "no"} · WhatsApp: {customer.consent_whatsapp ? "sí" : "no"}
        {customer.prospect_code && ` · Llegó por carta (${customer.prospect_code})`}
      </p>

      {customer.needs_human && (
        <form action={resolveHuman} className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <input type="hidden" name="customerId" value={customer.id} />
          El agente ha pasado esta conversación a una persona. Respóndele abajo y márcala como resuelta.
          <button className="btn-ghost">Marcar como resuelta</button>
        </form>
      )}

      <section className="space-y-3">
        {messages.length === 0 && <p className="text-sm text-muted">Sin mensajes todavía.</p>}
        {messages.map((m) => (
          <div key={m.id} className={`max-w-2xl rounded-lg p-4 text-sm ${m.direction === "entrada" ? "bg-fog" : "ml-auto border border-card-border bg-white"}`}>
            <div className="mb-1 text-xs text-muted">
              {m.direction === "entrada" ? "Cliente" : m.author === "agente" ? "Agente (IA)" : "Persona del equipo"} · {m.channel}
              {m.status !== "ok" && ` · ${m.status}`} · {new Date(m.created_at).toLocaleString("es-ES")}
            </div>
            {m.subject && <div className="font-medium">{m.subject}</div>}
            <p className="whitespace-pre-line">{m.body}</p>
          </div>
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <form action={humanReply} className="card space-y-3 text-sm">
          <h2 className="text-lg font-semibold">Responder como persona</h2>
          <input type="hidden" name="customerId" value={customer.id} />
          <select name="channel" defaultValue={lastChannel} className="input">
            <option value="email">Correo</option>
            <option value="whatsapp" disabled={!customer.phone}>WhatsApp</option>
          </select>
          <textarea name="body" rows={4} className="input" placeholder="Tu respuesta" />
          <label className="flex items-center gap-2"><input type="checkbox" name="resolve" defaultChecked /> Marcar como resuelta</label>
          <button className="btn">Enviar</button>
        </form>

        <form action={simulateInbound} className="card space-y-3 text-sm">
          <h2 className="text-lg font-semibold">Probar el agente</h2>
          <p className="text-muted">Escribe como si fueras este cliente. El agente responde de verdad (y si el correo o WhatsApp están conectados, el cliente recibirá la respuesta).</p>
          <input type="hidden" name="customerId" value={customer.id} />
          <select name="channel" defaultValue={lastChannel} className="input">
            <option value="email">Como correo</option>
            <option value="whatsapp" disabled={!customer.phone}>Como WhatsApp</option>
          </select>
          <textarea name="body" rows={3} className="input" placeholder="Ej.: ¿Qué precio tendrían 10 viales de la línea antiedad?" />
          <button className="btn-ghost">Enviar como cliente</button>
        </form>
      </div>
      <Link href="/panel/agente" className="text-sm underline">Volver al agente</Link>
    </div>
  );
}
