import "server-only";
import { one, query } from "../db";
export { findForbidden } from "./text";

// Reglas del agente, editables en /panel/agente.
export type AgentSettings = {
  // Pausa general: no envía seguimientos ni responde solo (los mensajes entrantes quedan para una persona).
  paused: boolean;
  // Responder solo a los mensajes de los clientes con la IA. Si es false, todo pasa a una persona.
  autoReply: boolean;
  // Máximo de mensajes de seguimiento al día (todas las vías).
  dailyLimit: number;
  // Días tras la muestra para el primer y el segundo seguimiento, y tras el último pedido para recordar reposición.
  sampleFollowupDays: [number, number];
  reorderDays: number;
  // Frases que el agente nunca debe usar (se comprueban antes de enviar).
  forbidden: string[];
  // Instrucciones extra del distribuidor (tono, promociones vigentes...).
  extraInstructions: string;
};

export const DEFAULT_AGENT: AgentSettings = {
  paused: false,
  autoReply: true,
  dailyLimit: 50,
  sampleFollowupDays: [7, 21],
  reorderDays: 45,
  // Afirmaciones sanitarias que un cosmético no puede hacer (Reglamento 1223/2009 y RD 85/2018).
  forbidden: ["cura", "curar", "tratamiento de enfermedades", "sin efectos secundarios", "100% seguro", "garantizado"],
  extraInstructions: "",
};

export async function getAgentSettings(): Promise<AgentSettings> {
  const row = await one<{ value: Partial<AgentSettings> }>("select value from settings where key = 'agent'");
  return { ...DEFAULT_AGENT, ...(row?.value ?? {}) };
}

export async function saveAgentSettings(s: AgentSettings) {
  await query(
    `insert into settings (key, value) values ('agent', $1) on conflict (key) do update set value = excluded.value`,
    [JSON.stringify(s)],
  );
}

