import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/session";
import { getCustomer } from "@/lib/store";
import { listMessages } from "@/lib/agent/channels";
import { humanReply, resolveHuman, simulateInbound } from "../../actions";
import { PageHeader } from "../../../PageHeader";

export const dynamic = "force-dynamic";

export default async function ConversacionPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const customer = await getCustomer(Number(id));
  if (!customer) notFound();
  const messages = await listMessages(customer.id);
  const lastChannel = messages.findLast((m) => m.channel !== "panel")?.channel ?? (customer.consent_whatsapp && customer.phone ? "whatsapp" : "email");

  return (
    <div className="space-y-8">
      <Link href="/panel/agente" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground">← Volver al agente</Link>
      <PageHeader eyebrow="Conversación" title={customer.clinic}>
        <div className="flex flex-wrap items-center gap-2">
          <span>{customer.name} · {customer.email}{customer.phone && ` · ${customer.phone}`} · {customer.province}</span>
          <span className={`chip ${customer.consent_email ? "bg-accent-soft text-accent-strong" : "bg-soft text-subtle"}`}>Correo {customer.consent_email ? "sí" : "no"}</span>
          <span className={`chip ${customer.consent_whatsapp ? "bg-accent-soft text-accent-strong" : "bg-soft text-subtle"}`}>WhatsApp {customer.consent_whatsapp ? "sí" : "no"}</span>
          {customer.prospect_code && <span className="chip bg-soft text-muted">Llegó por carta · {customer.prospect_code}</span>}
        </div>
      </PageHeader>

      {customer.needs_human && (
        <form action={resolveHuman} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-warn/20 bg-warn-soft px-5 py-4 text-sm text-warn">
          <input type="hidden" name="customerId" value={customer.id} />
          El agente ha pasado esta conversación a una persona. Respóndele abajo y márcala como resuelta.
          <button className="btn-ghost h-9">Marcar como resuelta</button>
        </form>
      )}

      <section className="card space-y-4 bg-[linear-gradient(180deg,var(--soft),var(--surface))]">
        {messages.length === 0 && <p className="text-sm text-muted">Sin mensajes todavía.</p>}
        {messages.map((m) => (
          <div
            key={m.id}
            className={`max-w-2xl rounded-2xl px-4 py-3 text-sm shadow-sm ${
              m.direction === "entrada"
                ? "rounded-tl-md border border-card-border bg-surface"
                : m.author === "agente"
                  ? "ml-auto rounded-tr-md bg-accent text-white"
                  : "ml-auto rounded-tr-md bg-foreground text-white"
            }`}
          >
            <div className={`mb-1 text-[11px] ${m.direction === "entrada" ? "text-subtle" : "text-white/60"}`}>
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
          <h2 className="section-title">Responder como persona</h2>
          <input type="hidden" name="customerId" value={customer.id} />
          <select name="channel" defaultValue={lastChannel} className="input">
            <option value="email">Correo</option>
            <option value="whatsapp" disabled={!customer.phone}>WhatsApp</option>
          </select>
          <textarea name="body" rows={4} className="input" placeholder="Tu respuesta" />
          <label className="flex items-center gap-2.5"><input type="checkbox" name="resolve" defaultChecked /> Marcar como resuelta</label>
          <button className="btn">Enviar</button>
        </form>

        <form action={simulateInbound} className="card space-y-3 border-dashed text-sm">
          <h2 className="section-title">Probar el agente</h2>
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
    </div>
  );
}
