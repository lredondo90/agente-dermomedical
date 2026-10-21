"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { query } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { getCustomer } from "@/lib/store";
import { DEFAULT_AGENT, getAgentSettings, saveAgentSettings } from "@/lib/agent/settings";
import { runFollowups } from "@/lib/agent/followup";
import { importCsv, searchPlaces, setProspectStatus } from "@/lib/agent/prospects";
import { handleInbound } from "@/lib/agent/brain";
import { sendToCustomer, type Channel } from "@/lib/agent/channels";

function back(path: string, msg: string): never {
  redirect(`${path}?msg=${encodeURIComponent(msg)}`);
}

const int = (v: FormDataEntryValue | null, fallback: number) => {
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : fallback;
};

export async function saveAgent(form: FormData) {
  await requireAdmin();
  const current = await getAgentSettings();
  const d1 = int(form.get("d1"), DEFAULT_AGENT.sampleFollowupDays[0]);
  await saveAgentSettings({
    ...current,
    paused: form.get("paused") === "on",
    autoReply: form.get("autoReply") === "on",
    dailyLimit: Math.min(int(form.get("dailyLimit"), DEFAULT_AGENT.dailyLimit), 1000),
    sampleFollowupDays: [d1, Math.max(int(form.get("d2"), DEFAULT_AGENT.sampleFollowupDays[1]), d1 + 1)],
    reorderDays: int(form.get("reorderDays"), DEFAULT_AGENT.reorderDays),
    forbidden: String(form.get("forbidden") ?? "").split("\n").map((s) => s.trim()).filter(Boolean),
    extraInstructions: String(form.get("extraInstructions") ?? "").slice(0, 3000),
  });
  back("/panel/agente", "Reglas guardadas");
}

export async function runTickNow() {
  await requireAdmin();
  const r = await runFollowups({ force: true });
  back("/panel/agente", r.reason ? `${r.reason}. Enviados: ${r.sent}` : `Seguimientos enviados: ${r.sent}${r.skipped.length ? ` · sin enviar: ${r.skipped.length}` : ""}`);
}

export async function searchClinics(form: FormData) {
  await requireAdmin();
  const q = String(form.get("q") ?? "").trim();
  if (!q) back("/panel/agente/clinicas", "Escribe qué buscar, p. ej. «dermatólogo Valencia»");
  let msg: string;
  try {
    const r = await searchPlaces(q);
    msg = `Google Maps: ${r.added} clínicas nuevas, ${r.existing} ya estaban`;
  } catch (e) {
    msg = e instanceof Error ? e.message : String(e);
  }
  back("/panel/agente/clinicas", msg);
}

export async function importClinics(form: FormData) {
  await requireAdmin();
  const file = form.get("file");
  const text = file instanceof File && file.size > 0 ? await file.text() : String(form.get("csv") ?? "");
  if (!text.trim()) back("/panel/agente/clinicas", "Adjunta un CSV o pega las filas");
  const r = await importCsv(text);
  back("/panel/agente/clinicas", `Importadas ${r.added} clínicas${r.skipped ? ` (${r.skipped} omitidas: sin nombre o repetidas)` : ""}`);
}

async function selectedProspects(form: FormData) {
  await requireAdmin();
  const ids = form.getAll("id").map(Number).filter(Number.isInteger);
  if (!ids.length) back("/panel/agente/clinicas", "Marca al menos una clínica");
  return ids;
}

export async function prepareLetters(form: FormData) {
  const ids = await selectedProspects(form);
  await setProspectStatus(ids, "carta-preparada");
  redirect(`/panel/agente/cartas?ids=${ids.join(",")}`);
}

async function moveProspects(form: FormData, status: string) {
  const ids = await selectedProspects(form);
  await setProspectStatus(ids, status);
  back("/panel/agente/clinicas", `${ids.length} clínicas actualizadas`);
}

export async function markLettersSent(form: FormData) {
  await moveProspects(form, "carta-enviada");
}

export async function discardProspects(form: FormData) {
  await moveProspects(form, "descartado");
}

export async function resetProspects(form: FormData) {
  await moveProspects(form, "nuevo");
}

export async function humanReply(form: FormData) {
  await requireAdmin();
  const customerId = Number(form.get("customerId"));
  const channel = String(form.get("channel")) as Channel;
  const body = String(form.get("body") ?? "").trim();
  if (body) {
    await sendToCustomer({ customerId, channel, author: "humano", reply: true, body, subject: "Respuesta a su consulta" });
  }
  if (form.get("resolve") === "on") await query("update customers set needs_human = false where id = $1", [customerId]);
  revalidatePath(`/panel/agente/conversacion/${customerId}`);
}

export async function resolveHuman(form: FormData) {
  await requireAdmin();
  const customerId = Number(form.get("customerId"));
  await query("update customers set needs_human = false where id = $1", [customerId]);
  revalidatePath(`/panel/agente/conversacion/${customerId}`);
  revalidatePath("/panel/agente");
}

// Prueba del agente desde el panel: simula que el cliente escribe y deja que el agente conteste de verdad.
export async function simulateInbound(form: FormData) {
  await requireAdmin();
  const customerId = Number(form.get("customerId"));
  const body = String(form.get("body") ?? "").trim();
  const customer = await getCustomer(customerId);
  if (!customer || !body) return;
  await handleInbound({ customerId, channel: String(form.get("channel")) === "whatsapp" ? "whatsapp" : "email", body, subject: "Consulta" });
  revalidatePath(`/panel/agente/conversacion/${customerId}`);
}
