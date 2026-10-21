import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodTool } from "@anthropic-ai/sdk/helpers/beta/zod";
import * as z from "zod/v4";
import { query } from "../db";
import { brand, company } from "../company";
import { MAX_DISCOUNT_PCT, euros } from "../pricing";
import * as store from "../store";
import { findForbidden, getAgentSettings } from "./settings";
import { listMessages, recordMessage, sendToCustomer, type Channel } from "./channels";

export const AGENT_MODEL = process.env.AGENT_MODEL ?? "claude-opus-5-5";

const BAJA = /^\s*(baja|stop|darme de baja|no quiero (recibir )?m[aá]s)\b/i;

export type InboundResult =
  | { action: "respondido"; reply: string }
  | { action: "baja" }
  | { action: "humano"; reason: string; draft?: string };

// Atiende un mensaje de un cliente registrado: lo guarda, y responde con la IA o lo pasa a una persona.
export async function handleInbound(opts: { customerId: number; channel: Channel; body: string; subject?: string }): Promise<InboundResult> {
  const customer = await store.getCustomer(opts.customerId);
  if (!customer) throw new Error("Cliente no encontrado");
  await recordMessage({ customerId: customer.id, channel: opts.channel, direction: "entrada", author: "cliente", body: opts.body, subject: opts.subject });

  // La baja se atiende siempre y sin IA: es una obligación legal, no una conversación.
  if (BAJA.test(opts.body)) {
    await sendToCustomer({
      customerId: customer.id,
      channel: opts.channel,
      author: "agente",
      reply: true,
      subject: "Baja confirmada",
      body: `Hecho: no le enviaremos más mensajes por ${opts.channel === "email" ? "correo" : "WhatsApp"}. Su cuenta y sus pedidos siguen disponibles en la web.`,
    });
    await store.setConsents(
      customer.id,
      opts.channel === "email" ? false : customer.consent_email,
      opts.channel === "whatsapp" ? false : customer.consent_whatsapp,
    );
    await store.logEvent(customer.id, "baja", { channel: opts.channel });
    return { action: "baja" };
  }

  const settings = await getAgentSettings();
  if (settings.paused || !settings.autoReply) return handOff(customer.id, "Agente en pausa o sin respuesta automática");
  if (!process.env.ANTHROPIC_API_KEY) return handOff(customer.id, "Falta ANTHROPIC_API_KEY");

  let reply: string;
  try {
    const result = await think(customer, opts.channel, settings.extraInstructions);
    if (result.handedOff) return { action: "humano", reason: result.handedOff, draft: result.text };
    if (!result.text) return handOff(customer.id, "La IA no dio respuesta");
    reply = result.text;
  } catch (e) {
    await store.logEvent(customer.id, "error-agente", { error: String(e) });
    return handOff(customer.id, `Error al llamar a la IA: ${e instanceof Anthropic.APIError ? e.status : "desconocido"}`);
  }

  const bad = findForbidden(reply, settings.forbidden);
  if (bad) return handOff(customer.id, `La respuesta contenía una frase prohibida («${bad}»)`, reply);

  await sendToCustomer({
    customerId: customer.id,
    channel: opts.channel,
    author: "agente",
    reply: true,
    subject: opts.subject ? `Re: ${opts.subject.replace(/^re:\s*/i, "")}` : undefined,
    body: reply,
  });
  return { action: "respondido", reply };
}

export async function handOff(customerId: number, reason: string, draft?: string): Promise<InboundResult> {
  await query("update customers set needs_human = true where id = $1", [customerId]);
  await store.logEvent(customerId, "pasa-a-humano", { reason, draft });
  return { action: "humano", reason, draft };
}

async function think(customer: store.Customer, channel: Channel, extra: string) {
  const client = new Anthropic();
  let handedOff: string | undefined;
  const items = z
    .array(z.object({ product_id: z.number().int(), quantity: z.number().int().min(1).max(999) }))
    .min(1)
    .describe("Productos y unidades");

  const tools = [
    betaZodTool({
      name: "presupuestar",
      description: "Calcula el presupuesto exacto (descuento por volumen, envío e IVA) de una lista de productos para este cliente. Úsalo siempre antes de dar un precio total.",
      inputSchema: z.object({ items }),
      run: async ({ items }) => {
        const q = await store.quoteCart(items.map((i) => ({ productId: i.product_id, quantity: i.quantity })), customer.province);
        return JSON.stringify({
          lineas: q.lines.map((l) => `${l.quantity} × ${l.name} a ${euros(l.unitCents)} = ${euros(l.lineCents)}`),
          no_disponibles: q.unavailable,
          subtotal: euros(q.subtotalCents),
          descuento: `${q.discountPct}% (−${euros(q.discountCents)})`,
          envio: euros(q.shippingCents),
          iva: euros(q.vatCents),
          total: euros(q.totalCents),
        });
      },
    }),
    betaZodTool({
      name: "crear_pedido",
      description: "Crea el pedido a nombre del cliente. Solo cuando el cliente haya confirmado expresamente el presupuesto en esta conversación. El pago se hace por transferencia y el pedido queda pendiente de pago.",
      inputSchema: z.object({ items, notas: z.string().describe("Notas para el envío, o cadena vacía") }),
      run: async ({ items, notas }) => {
        const order = await store.createOrder(customer.id, items.map((i) => ({ productId: i.product_id, quantity: i.quantity })), "agente", notas || undefined);
        return JSON.stringify({ pedido: order.id, total: euros(order.total_cents), enlace: `${company.siteUrl}/pedidos/${order.id}`, pago: `Transferencia a ${company.iban} indicando «Pedido ${order.id}»` });
      },
    }),
    betaZodTool({
      name: "ver_pedidos",
      description: "Lista los pedidos y muestras del cliente con su estado.",
      inputSchema: z.object({}),
      run: async () => {
        const orders = await store.listOrders(customer.id);
        return JSON.stringify(orders.slice(0, 10).map((o) => ({ id: o.id, tipo: o.kind, estado: o.status, total: euros(o.total_cents), fecha: String(o.created_at).slice(0, 10) })));
      },
    }),
    betaZodTool({
      name: "pasar_a_humano",
      description: "Pasa la conversación a una persona del equipo. Úsalo para reclamaciones, devoluciones, facturas, dudas médicas o clínicas, peticiones de descuento por encima de la tarifa, o cualquier cosa que no puedas resolver con certeza.",
      inputSchema: z.object({ motivo: z.string() }),
      run: async ({ motivo }) => {
        handedOff = motivo;
        await handOff(customer.id, motivo);
        return "Hecho. Despídete brevemente diciendo que una persona del equipo le contestará en horario laboral.";
      },
    }),
  ];

  const history = (await listMessages(customer.id)).slice(-20);
  const messages: Anthropic.Beta.BetaMessageParam[] = [];
  for (const m of history) {
    const role = m.direction === "entrada" ? "user" : "assistant";
    const text = m.direction === "entrada" ? m.body : `[${m.author === "humano" ? "mensaje de una persona del equipo" : "tu mensaje anterior"}]\n${m.body}`;
    const last = messages.at(-1);
    if (last?.role === role) last.content = `${last.content}\n\n${text}`;
    else messages.push({ role, content: text });
  }
  if (messages[0]?.role === "assistant") messages.unshift({ role: "user", content: "(inicio de la conversación)" });

  const final = await client.beta.messages.toolRunner({
    model: AGENT_MODEL,
    max_tokens: 16000,
    thinking: { type: "adaptive" },
    output_config: { effort: "medium" },
    system: [
      { type: "text", text: await systemPrompt(extra), cache_control: { type: "ephemeral" } },
      { type: "text", text: await customerContext(customer, channel) },
    ],
    tools,
    max_iterations: 8,
    messages,
  });

  if (final.stop_reason === "refusal") {
    await handOff(customer.id, "La IA rechazó responder");
    return { handedOff: "La IA rechazó responder" };
  }
  const text = final.content
    .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
  return { text, handedOff };
}

async function systemPrompt(extra: string) {
  const [lines, products, pricing] = await Promise.all([store.listLines(), store.listProducts(), store.getPricing()]);
  const lineName = new Map(lines.map((l) => [l.id, l.name]));
  const catalog = products
    .map((p) => `${p.id} · ${p.name} · ${p.format} · ${lineName.get(p.line_id)} · ${p.price_cents == null ? "sin precio todavía (no se puede pedir)" : `${euros(p.price_cents)} sin IVA`}`)
    .join("\n");
  const tiers = pricing.tiers.map((t) => `${t.pct}% desde ${euros(t.minCents)}`).join(", ") || "ninguno";
  return `Eres el asistente virtual de ${company.name}, distribuidor autorizado en España de ${brand.name} (marca de ${brand.owner}). Atiendes por correo y WhatsApp a dermatólogos y clínicas que ya son clientes registrados y han aceptado recibir mensajes.

Qué haces:
- Resolver dudas sobre productos, formatos, precios, pedidos y envíos.
- Preparar presupuestos con la herramienta presupuestar y, cuando el cliente lo confirme expresamente, crear el pedido con crear_pedido.
- Consultar el estado de sus pedidos con ver_pedidos.

Reglas que no puedes saltarte:
- Eres una IA y no lo ocultas: si te preguntan, lo dices.
- Los descuentos son solo los de la tarifa por volumen (${tiers}; máximo ${MAX_DISCOUNT_PCT}%). Nunca prometas otros descuentos, regalos ni condiciones especiales: si los piden, pasar_a_humano.
- Envío: ${euros(pricing.shippingCents)}, gratis desde ${euros(pricing.freeShippingFromCents)} de subtotal. IVA 21% (0% en Canarias, Ceuta y Melilla). Pago por transferencia.
- Son cosméticos de uso profesional. No hagas afirmaciones médicas ni de curación, no diagnostiques ni recomiendes tratamientos para un paciente concreto: el criterio clínico es del dermatólogo. Para fichas técnicas o protocolos, remite a la información del fabricante.
- No inventes productos, precios, plazos ni datos: usa solo el catálogo de abajo y las herramientas.
- Reclamaciones, devoluciones, facturas, datos personales o cualquier duda que no puedas resolver con certeza: pasar_a_humano.
- Si el cliente quiere dejar de recibir mensajes, dile que responda solo con la palabra BAJA.

Estilo: español de España, trato de usted salvo que el cliente tutee, mensajes breves y concretos (en WhatsApp, 2-5 líneas), sin emojis salvo que el cliente los use. No pongas firma ni pie: se añade solo. Tu respuesta final es exactamente el texto que se enviará al cliente.
${extra.trim() ? `\nIndicaciones del distribuidor:\n${extra.trim()}\n` : ""}
Catálogo (id · nombre · formato · línea · precio):
${catalog}`;
}

async function customerContext(c: store.Customer, channel: Channel) {
  const orders = await store.listOrders(c.id);
  const recent = orders.slice(0, 5).map((o) => `#${o.id} ${o.kind} ${o.status} ${euros(o.total_cents)} (${String(o.created_at).slice(0, 10)})`);
  return `Cliente: ${c.name}, ${c.clinic} (${c.province}). Canal de esta conversación: ${channel === "email" ? "correo" : "WhatsApp"}.
Pedidos recientes: ${recent.length ? recent.join("; ") : "ninguno"}.
Hoy es ${new Date().toISOString().slice(0, 10)}.`;
}
