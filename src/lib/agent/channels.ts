import "server-only";
import { one, query } from "../db";
import { sendMail } from "../mail";
import { brand, company } from "../company";
import { getCustomer, logEvent, type Customer } from "../store";
import { normalizePhone } from "./text";

export type Channel = "email" | "whatsapp";
export type Message = {
  id: number;
  customer_id: number;
  channel: string;
  direction: "entrada" | "salida";
  author: "cliente" | "agente" | "humano";
  subject: string | null;
  body: string;
  status: string;
  created_at: string;
};

// Pie de todos los mensajes del agente: aviso de IA (Reglamento de IA, art. 50) y cómo darse de baja (LSSI art. 21).
export function footer(channel: Channel, author: "agente" | "humano") {
  const who = author === "agente" ? `Asistente virtual (IA) de ${company.name}, distribuidor de ${brand.name}` : company.name;
  return channel === "whatsapp"
    ? `\n\n— ${who}. Responda BAJA para no recibir más mensajes.`
    : `\n\n--\n${who}\nPedidos: ${company.siteUrl}/catalogo\nSi no desea recibir más correos, responda con la palabra BAJA o cámbielo en ${company.siteUrl}/cuenta.`;
}

export function canContact(c: Customer, channel: Channel) {
  if (channel === "email") return c.consent_email;
  return c.consent_whatsapp && !!c.phone;
}

export async function recordMessage(m: {
  customerId: number;
  channel: Channel | "panel";
  direction: "entrada" | "salida";
  author: "cliente" | "agente" | "humano";
  body: string;
  subject?: string;
  dedupeKey?: string;
  status?: string;
}) {
  return one<Message>(
    `insert into messages (customer_id, channel, direction, author, subject, body, dedupe_key, status)
     values ($1, $2, $3, $4, $5, $6, $7, $8) on conflict (dedupe_key) do nothing returning *`,
    [m.customerId, m.channel, m.direction, m.author, m.subject ?? null, m.body, m.dedupeKey ?? null, m.status ?? "ok"],
  );
}

// Envía un mensaje a un cliente registrado por la vía indicada, solo si dio su consentimiento para esa vía.
// `proactive` = lo inicia el agente (seguimiento): en WhatsApp exige una plantilla aprobada por Meta.
export async function sendToCustomer(opts: {
  customerId: number;
  channel: Channel;
  body: string;
  subject?: string;
  author: "agente" | "humano";
  proactive?: boolean;
  // Respuesta a un mensaje que acaba de escribir el cliente: lo ha pedido él, así que no hace falta consentimiento previo.
  reply?: boolean;
  dedupeKey?: string;
}) {
  const customer = await getCustomer(opts.customerId);
  if (!customer) throw new Error("Cliente no encontrado");
  if (!opts.reply && !canContact(customer, opts.channel)) return { sent: false, reason: "sin-consentimiento" as const };
  if (opts.channel === "whatsapp" && !customer.phone) return { sent: false, reason: "sin-telefono" as const };
  // Reservamos la clave antes de enviar para que dos ejecuciones a la vez no manden el mismo seguimiento.
  const text = opts.body.trim() + footer(opts.channel, opts.author);
  const row = await recordMessage({
    customerId: customer.id,
    channel: opts.channel,
    direction: "salida",
    author: opts.author,
    subject: opts.subject,
    body: text,
    dedupeKey: opts.dedupeKey,
    status: "enviando",
  });
  if (!row) return { sent: false, reason: "ya-enviado" as const };
  let status = "ok";
  try {
    const res =
      opts.channel === "email"
        ? await sendMail(customer.email, opts.subject ?? `${brand.name} · ${company.name}`, text)
        : await sendWhatsApp(customer.phone!, text, opts.proactive ?? false);
    if (!res.sent) status = "sin-enviar";
  } catch (e) {
    status = "error";
    await logEvent(customer.id, "error-envio", { channel: opts.channel, error: String(e) });
  }
  await query("update messages set status = $2 where id = $1", [row.id, status]);
  return { sent: status === "ok", reason: status };
}

// WhatsApp Cloud API (Meta). Sin WHATSAPP_TOKEN se escribe en la consola, como el correo en desarrollo.
// Fuera de la ventana de 24 h desde el último mensaje del cliente, Meta solo permite plantillas aprobadas:
// los seguimientos usan la plantilla WHATSAPP_TEMPLATE, con el texto del mensaje como único parámetro {{1}}.
export async function sendWhatsApp(phone: string, text: string, proactive: boolean) {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const to = normalizePhone(phone);
  if (!token || !phoneId) {
    console.log(`[whatsapp sin enviar] Para: ${to}\n${text}`);
    return { sent: false };
  }
  const template = process.env.WHATSAPP_TEMPLATE;
  const payload =
    proactive && template
      ? {
          messaging_product: "whatsapp",
          to,
          type: "template",
          template: {
            name: template,
            language: { code: process.env.WHATSAPP_TEMPLATE_LANG ?? "es" },
            // Las plantillas no admiten saltos de línea en los parámetros.
            components: [{ type: "body", parameters: [{ type: "text", text: text.replace(/\s*\n+\s*/g, " ") }] }],
          },
        }
      : { messaging_product: "whatsapp", to, type: "text", text: { body: text } };
  const res = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`WhatsApp respondió ${res.status}: ${await res.text()}`);
  return { sent: true };
}

export async function listMessages(customerId: number) {
  return query<Message>("select * from messages where customer_id = $1 order by created_at, id", [customerId]);
}

export async function findCustomerByPhone(phone: string) {
  const wanted = normalizePhone(phone);
  const rows = await query<Customer>("select * from customers where phone is not null");
  return rows.find((c) => normalizePhone(c.phone!) === wanted);
}
