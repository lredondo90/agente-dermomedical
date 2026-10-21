import { after, NextResponse } from "next/server";
import { bearerOk } from "@/lib/agent/auth";
import { handleInbound } from "@/lib/agent/brain";
import { findCustomerByEmail, logEvent } from "@/lib/store";
import { stripQuoted } from "@/lib/agent/text";

// Correos entrantes. Cualquier servicio de recepción (Resend Inbound, Cloudflare Email Routing con un Worker, etc.)
// puede reenviarlos aquí con: POST { from, subject, text } y "Authorization: Bearer $EMAIL_WEBHOOK_SECRET".
export async function POST(req: Request) {
  if (!bearerOk(req, "EMAIL_WEBHOOK_SECRET")) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const data = (await req.json()) as { from?: string; subject?: string; text?: string };
  const from = data.from?.match(/<([^>]+)>/)?.[1] ?? data.from ?? "";
  const body = stripQuoted(data.text ?? "");
  const customer = await findCustomerByEmail(from);
  if (!customer) {
    await logEvent(null, "correo-desconocido", { from, subject: data.subject });
    return NextResponse.json({ ok: true, known: false });
  }
  if (!body) return NextResponse.json({ ok: true, empty: true });
  after(() => handleInbound({ customerId: customer.id, channel: "email", body, subject: data.subject }).then(() => undefined));
  return NextResponse.json({ ok: true });
}

