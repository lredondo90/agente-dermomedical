import "server-only";
import { one, query } from "../db";
import { brand, company } from "../company";
import { getPricing } from "../store";
import { euros } from "../pricing";
import { getAgentSettings } from "./settings";
import { sendToCustomer, type Channel } from "./channels";

type Candidate = {
  customer_id: number;
  name: string;
  consent_email: boolean;
  consent_whatsapp: boolean;
  phone: string | null;
  order_id: number;
  age_days: number;
};

export type TickResult = { sent: number; skipped: string[]; reason?: string };

// Horario en que el agente escribe por iniciativa propia: laborables de 9 a 20 h (hora de Madrid).
export function inBusinessHours(now = new Date()) {
  const parts = new Intl.DateTimeFormat("es-ES", { timeZone: "Europe/Madrid", weekday: "short", hour: "numeric", hour12: false }).formatToParts(now);
  const weekday = parts.find((p) => p.type === "weekday")!.value;
  const hour = Number(parts.find((p) => p.type === "hour")!.value);
  return !["sáb", "dom"].some((d) => weekday.startsWith(d)) && hour >= 9 && hour < 20;
}

// Seguimientos automáticos. Se llama periódicamente (POST /api/agente/tick) y es idempotente:
// cada mensaje tiene una clave única, así que repetir la llamada no duplica envíos.
export async function runFollowups(opts: { force?: boolean } = {}): Promise<TickResult> {
  const settings = await getAgentSettings();
  if (settings.paused) return { sent: 0, skipped: [], reason: "Agente en pausa" };
  if (!opts.force && !inBusinessHours()) return { sent: 0, skipped: [], reason: "Fuera de horario (laborables de 9 a 20 h)" };

  const today = await one<{ n: number }>(
    `select count(*)::int as n from messages where author = 'agente' and dedupe_key is not null and created_at > now() - interval '24 hours'`,
  );
  let budget = settings.dailyLimit - (today?.n ?? 0);
  if (budget <= 0) return { sent: 0, skipped: [], reason: "Límite diario alcanzado" };

  const [d1, d2] = settings.sampleFollowupDays;
  const base = `select c.id as customer_id, c.name, c.consent_email, c.consent_whatsapp, c.phone, o.id as order_id,
      extract(day from now() - o.created_at)::int as age_days
    from orders o join customers c on c.id = o.customer_id
    where (c.consent_email or c.consent_whatsapp) and not c.needs_human`;

  // Muestras sin pedido posterior.
  const samples = await query<Candidate>(
    `${base} and o.kind = 'muestra' and o.created_at < now() - make_interval(days => $1)
       and not exists (select 1 from orders p where p.customer_id = c.id and p.kind = 'pedido' and p.created_at > o.created_at)
     order by o.created_at`,
    [d1],
  );
  // Último pedido de cada cliente, para recordar la reposición.
  const reorders = await query<Candidate>(
    `${base} and o.kind = 'pedido' and o.status <> 'cancelado' and o.created_at < now() - make_interval(days => $1)
       and o.created_at > now() - make_interval(days => $1 + 60)
       and not exists (select 1 from orders p where p.customer_id = c.id and p.kind = 'pedido' and p.created_at > o.created_at)
     order by o.created_at`,
    [settings.reorderDays],
  );

  const pricing = await getPricing();
  const best = pricing.tiers.at(-1);
  const plan: { c: Candidate; key: string; subject: string; body: string }[] = [];
  for (const c of samples) {
    if (c.age_days < d2) {
      plan.push({
        c,
        key: `muestra-1:${c.order_id}`,
        subject: `¿Qué le ha parecido la muestra de ${brand.name}?`,
        body: `Hola ${c.name}, hace unos días le enviamos una muestra de ${brand.name}. ¿Ha podido probarla? Si tiene cualquier duda sobre el producto o los formatos profesionales, respóndame aquí y se la resuelvo.`,
      });
    } else if (c.age_days < d2 + 30) {
      plan.push({
        c,
        key: `muestra-2:${c.order_id}`,
        subject: `Formatos profesionales de ${brand.name}`,
        body: `Hola ${c.name}, por si le resulta útil: puede ver todo el catálogo profesional y hacer su pedido en ${company.siteUrl}/catalogo. Envío gratis desde ${euros(pricing.freeShippingFromCents)}${best ? ` y ${best.pct}% de descuento desde ${euros(best.minCents)}` : ""}. Si lo prefiere, dígame qué necesita y se lo preparo.`,
      });
    }
  }
  for (const c of reorders) {
    plan.push({
      c,
      key: `reposicion:${c.order_id}`,
      subject: `¿Le preparo la reposición?`,
      body: `Hola ${c.name}, han pasado unas semanas desde su último pedido (n.º ${c.order_id}). Si quiere repetirlo, puede hacerlo con un clic en ${company.siteUrl}/pedidos/${c.order_id}, o respóndame con lo que necesita y se lo preparo.`,
    });
  }

  const result: TickResult = { sent: 0, skipped: [] };
  for (const p of plan) {
    if (budget <= 0) {
      result.reason = "Límite diario alcanzado";
      break;
    }
    const channel: Channel | undefined = p.c.consent_whatsapp && p.c.phone ? "whatsapp" : p.c.consent_email ? "email" : undefined;
    if (!channel) continue;
    const r = await sendToCustomer({ customerId: p.c.customer_id, channel, author: "agente", proactive: true, dedupeKey: p.key, subject: p.subject, body: p.body });
    if (r.reason === "ya-enviado") continue;
    budget--;
    if (r.sent) result.sent++;
    else result.skipped.push(`${p.key}: ${r.reason}`);
  }
  return result;
}
