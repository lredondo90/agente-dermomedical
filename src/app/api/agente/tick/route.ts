import { NextResponse } from "next/server";
import { bearerOk } from "@/lib/agent/auth";
import { runFollowups } from "@/lib/agent/followup";

// Lo llama un programador de tareas (p. ej. un Job de Azure Container Apps o GitHub Actions cada hora):
// curl -X POST -H "Authorization: Bearer $AGENT_CRON_SECRET" https://.../api/agente/tick
export async function POST(req: Request) {
  if (!bearerOk(req, "AGENT_CRON_SECRET")) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  return NextResponse.json(await runFollowups());
}
