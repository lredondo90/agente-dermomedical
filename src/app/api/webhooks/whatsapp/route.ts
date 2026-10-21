import { after, NextResponse } from "next/server";
import { metaSignatureOk, safeEqual } from "@/lib/agent/auth";
import { handleInbound } from "@/lib/agent/brain";
import { findCustomerByPhone } from "@/lib/agent/channels";
import { logEvent } from "@/lib/store";

// Verificación del webhook al darlo de alta en Meta (WhatsApp > Configuración > Webhook).
export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = process.env.WHATSAPP_VERIFY_TOKEN;
  if (url.searchParams.get("hub.mode") === "subscribe" && token && safeEqual(url.searchParams.get("hub.verify_token") ?? "", token)) {
    return new Response(url.searchParams.get("hub.challenge") ?? "");
  }
  return new Response("No autorizado", { status: 403 });
}

type WhatsAppPayload = {
  entry?: { changes?: { value?: { messages?: { from: string; type: string; text?: { body: string }; button?: { text: string } }[] } }[] }[];
};

export async function POST(req: Request) {
  const raw = await req.text();
  const secret = process.env.WHATSAPP_APP_SECRET;
  if (!secret || !metaSignatureOk(raw, req.headers.get("x-hub-signature-256"), secret)) {
    return NextResponse.json({ error: "Firma no válida" }, { status: 401 });
  }
  const payload = JSON.parse(raw) as WhatsAppPayload;
  const incoming = (payload.entry ?? []).flatMap((e) => e.changes ?? []).flatMap((c) => c.value?.messages ?? []);
  // Respondemos a Meta enseguida y atendemos los mensajes después (la IA puede tardar unos segundos).
  after(async () => {
    for (const m of incoming) {
      const body = m.text?.body ?? m.button?.text;
      const customer = await findCustomerByPhone(m.from);
      if (!customer) {
        await logEvent(null, "whatsapp-desconocido", { from: m.from, type: m.type, body });
        continue;
      }
      if (!body) {
        await logEvent(customer.id, "whatsapp-no-texto", { type: m.type });
        continue;
      }
      await handleInbound({ customerId: customer.id, channel: "whatsapp", body });
    }
  });
  return NextResponse.json({ ok: true });
}
