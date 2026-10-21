import Link from "next/link";
import { query } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { getAgentSettings } from "@/lib/agent/settings";
import { inBusinessHours } from "@/lib/agent/followup";
import { prospectStats } from "@/lib/agent/prospects";
import { AGENT_MODEL } from "@/lib/agent/brain";
import { runTickNow, saveAgent } from "./actions";
import { PanelNav } from "../PanelNav";
import { Flash } from "./Flash";

export const dynamic = "force-dynamic";

type Row = { customer_id: number; clinic: string; name: string; channel: string; direction: string; author: string; body: string; status: string; created_at: string };

export default async function AgentePage({ searchParams }: { searchParams: Promise<{ msg?: string }> }) {
  await requireAdmin();
  const { msg } = await searchParams;
  const [settings, stats, pending, recent, counts] = await Promise.all([
    getAgentSettings(),
    prospectStats(),
    query<{ id: number; clinic: string; name: string; reason: string | null }>(
      `select c.id, c.clinic, c.name,
         (select detail->>'reason' from events e where e.customer_id = c.id and e.type = 'pasa-a-humano' order by e.id desc limit 1) as reason
       from customers c where c.needs_human order by c.id desc`,
    ),
    query<Row>(
      `select m.customer_id, c.clinic, c.name, m.channel, m.direction, m.author, m.body, m.status, m.created_at
       from messages m join customers c on c.id = m.customer_id order by m.id desc limit 15`,
    ),
    query<{ sent_today: number; inbound_week: number; ai_week: number }>(
      `select
         (select count(*) from messages where direction = 'salida' and created_at > now() - interval '24 hours')::int as sent_today,
         (select count(*) from messages where direction = 'entrada' and created_at > now() - interval '7 days')::int as inbound_week,
         (select count(*) from messages where author = 'agente' and created_at > now() - interval '7 days')::int as ai_week`,
    ),
  ]);
  const prospects = Object.fromEntries(stats.map((s) => [s.status, s.n]));
  const c = counts[0];
  const services = [
    ["IA (Claude)", !!process.env.ANTHROPIC_API_KEY, "ANTHROPIC_API_KEY"],
    ["Correo saliente", !!process.env.RESEND_API_KEY, "RESEND_API_KEY"],
    ["Correo entrante", !!process.env.EMAIL_WEBHOOK_SECRET, "EMAIL_WEBHOOK_SECRET"],
    ["WhatsApp", !!(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID && process.env.WHATSAPP_APP_SECRET), "WHATSAPP_*"],
    ["Google Maps", !!process.env.GOOGLE_MAPS_API_KEY, "GOOGLE_MAPS_API_KEY"],
    ["Seguimiento programado", !!process.env.AGENT_CRON_SECRET, "AGENT_CRON_SECRET"],
  ] as const;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold">Agente</h1>
      <PanelNav />
      <Flash msg={msg} />

      <div className="grid gap-4 sm:grid-cols-4">
        <Stat label="Estado" value={settings.paused ? "En pausa" : "Activo"} />
        <Stat label="Mensajes enviados hoy" value={`${c.sent_today} / ${settings.dailyLimit}`} />
        <Stat label="Mensajes recibidos (7 días)" value={String(c.inbound_week)} />
        <Stat label="Clínicas: carta enviada / registradas" value={`${prospects["carta-enviada"] ?? 0} / ${prospects["registrado"] ?? 0}`} />
      </div>

      {pending.length > 0 && (
        <section className="card space-y-3">
          <h2 className="text-lg font-semibold">Necesitan a una persona ({pending.length})</h2>
          <ul className="divide-y divide-line text-sm">
            {pending.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <span><b>{p.clinic}</b> · {p.name}<span className="block text-muted">{p.reason}</span></span>
                <Link href={`/panel/agente/conversacion/${p.id}`} className="btn-soft">Ver conversación</Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <form action={saveAgent} className="card space-y-4 text-sm">
          <h2 className="text-lg font-semibold">Reglas</h2>
          <label className="flex items-center gap-2"><input type="checkbox" name="paused" defaultChecked={settings.paused} /> Pausar el agente (no escribe ni responde solo)</label>
          <label className="flex items-center gap-2"><input type="checkbox" name="autoReply" defaultChecked={settings.autoReply} /> Responder solo a los clientes con IA</label>
          <div className="flex flex-wrap items-center gap-2">
            Máximo <input name="dailyLimit" type="number" min={1} defaultValue={settings.dailyLimit} className="input w-20" /> seguimientos al día
          </div>
          <div className="flex flex-wrap items-center gap-2">
            Seguimiento de la muestra a los <input name="d1" type="number" min={1} defaultValue={settings.sampleFollowupDays[0]} className="input w-16" /> y
            <input name="d2" type="number" min={2} defaultValue={settings.sampleFollowupDays[1]} className="input w-16" /> días
          </div>
          <div className="flex flex-wrap items-center gap-2">
            Recordar reposición a los <input name="reorderDays" type="number" min={7} defaultValue={settings.reorderDays} className="input w-16" /> días del último pedido
          </div>
          <div>
            <label className="label">Frases prohibidas (una por línea)</label>
            <textarea name="forbidden" rows={4} defaultValue={settings.forbidden.join("\n")} className="input" />
            <p className="mt-1 text-muted">Si la respuesta de la IA contiene alguna, no se envía y pasa a una persona.</p>
          </div>
          <div>
            <label className="label">Indicaciones para el agente</label>
            <textarea name="extraInstructions" rows={3} defaultValue={settings.extraInstructions} className="input" placeholder="Ej.: Esta semana los pedidos salen el jueves por el puente." />
          </div>
          <button className="btn">Guardar reglas</button>
        </form>

        <div className="space-y-6">
          <section className="card space-y-3 text-sm">
            <h2 className="text-lg font-semibold">Conexiones</h2>
            <ul className="space-y-1">
              {services.map(([name, ok, env]) => (
                <li key={name} className="flex justify-between gap-2">
                  <span>{name}</span>
                  <span className={ok ? "text-accent" : "text-muted"}>{ok ? "Conectado" : `Falta ${env}`}</span>
                </li>
              ))}
            </ul>
            <p className="text-muted">Modelo: {AGENT_MODEL}. Sin una conexión, los mensajes se guardan aquí como «sin enviar» y nada sale fuera.</p>
          </section>
          <form action={runTickNow} className="card space-y-3 text-sm">
            <h2 className="text-lg font-semibold">Seguimiento automático</h2>
            <p className="text-muted">
              Escribe solo a clientes que dieron su consentimiento, en laborables de 9 a 20 h: a los {settings.sampleFollowupDays[0]} y {settings.sampleFollowupDays[1]} días de
              la muestra si no han pedido, y a los {settings.reorderDays} días del último pedido. Nunca repite un mensaje.
              {inBusinessHours() ? " Ahora estamos en horario." : " Ahora estamos fuera de horario."}
            </p>
            <button className="btn-ghost">Ejecutar ahora</button>
          </form>
        </div>
      </div>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Últimos mensajes</h2>
        {recent.length === 0 ? (
          <p className="text-sm text-muted">Todavía no hay conversaciones. Puedes probar el agente desde la ficha de un cliente: <Link className="underline" href="/panel/clientes">Clientes</Link>.</p>
        ) : (
          <ul className="divide-y divide-line text-sm">
            {recent.map((m, i) => (
              <li key={i} className="py-2">
                <Link href={`/panel/agente/conversacion/${m.customer_id}`} className="font-medium hover:underline">{m.clinic}</Link>
                <span className="text-muted"> · {m.channel} · {m.direction === "entrada" ? "del cliente" : m.author === "agente" ? "del agente" : "de una persona"}{m.status !== "ok" ? ` · ${m.status}` : ""} · {new Date(m.created_at).toLocaleString("es-ES")}</span>
                <p className="line-clamp-2 whitespace-pre-line">{m.body}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card">
      <div className="text-xs text-muted">{label}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  );
}
