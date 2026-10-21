import "server-only";
import { mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { seedCatalog, seedDemoPrices } from "./seed";

// Con DATABASE_URL usa Postgres (Supabase en producción); sin ella, una base local en .data/ (PGlite).
type Runner = (text: string, params?: unknown[]) => Promise<Record<string, unknown>[]>;

// Una sola conexión por proceso: Next carga este módulo en varios bundles (páginas, acciones, rutas)
// y dos instancias de PGlite sobre la misma carpeta se corrompen.
const shared = globalThis as typeof globalThis & { __dbRunner?: Promise<Runner> };

async function connect(): Promise<Runner> {
  let run: Runner;
  if (process.env.DATABASE_URL) {
    const { default: postgres } = await import("postgres");
    const client = postgres(process.env.DATABASE_URL, { prepare: false });
    run = async (text, params = []) => (await client.unsafe(text, params as never[])) as unknown as Record<string, unknown>[];
  } else {
    const { PGlite } = await import("@electric-sql/pglite");
    const dir = process.env.PGLITE_DIR ?? path.join(process.cwd(), ".data", "pglite");
    mkdirSync(dir, { recursive: true });
    const client = new PGlite(dir);
    run = async (text, params = []) => (await client.query<Record<string, unknown>>(text, params)).rows;
  }
  const schema = readFileSync(path.join(process.cwd(), "db", "schema.sql"), "utf8");
  for (const statement of schema.split(/;\s*\n/).map((s) => s.trim()).filter(Boolean)) {
    await run(statement);
  }
  await seedCatalog(run);
  if (process.env.DEMO_PRICES === "1") await seedDemoPrices(run);
  return run;
}

export async function query<T = Record<string, unknown>>(text: string, params: unknown[] = []): Promise<T[]> {
  // Si la conexión falla (p. ej. contraseña mal puesta), no la guardamos: la siguiente petición lo vuelve a intentar.
  shared.__dbRunner ??= connect().catch((e) => {
    shared.__dbRunner = undefined;
    throw e;
  });
  const run = await shared.__dbRunner;
  return (await run(text, params)) as T[];
}

export async function one<T = Record<string, unknown>>(text: string, params: unknown[] = []): Promise<T | undefined> {
  return (await query<T>(text, params))[0];
}
