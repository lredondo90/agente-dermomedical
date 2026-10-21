import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const COOKIE = "sesion";
const MAX_AGE = 60 * 60 * 24 * 60;

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s && process.env.NODE_ENV === "production") throw new Error("Falta SESSION_SECRET");
  return s ?? "solo-para-desarrollo";
}

function sign(value: string) {
  return createHmac("sha256", secret()).update(value).digest("base64url");
}

export type Session = { kind: "customer"; customerId: number } | { kind: "admin" };

export async function setSession(session: Session) {
  const value = session.kind === "admin" ? "admin" : `c:${session.customerId}`;
  (await cookies()).set(COOKIE, `${value}.${sign(value)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: MAX_AGE,
    path: "/",
  });
}

export async function clearSession() {
  (await cookies()).delete(COOKIE);
}

export async function getSession(): Promise<Session | undefined> {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return undefined;
  const dot = raw.lastIndexOf(".");
  const value = raw.slice(0, dot);
  const given = Buffer.from(raw.slice(dot + 1));
  const expected = Buffer.from(sign(value));
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return undefined;
  if (value === "admin") return { kind: "admin" };
  const id = Number(value.slice(2));
  return Number.isInteger(id) ? { kind: "customer", customerId: id } : undefined;
}

export async function requireCustomer(): Promise<number> {
  const s = await getSession();
  if (s?.kind !== "customer") redirect("/entrar");
  return s.customerId;
}

export async function requireAdmin() {
  const s = await getSession();
  if (s?.kind !== "admin") redirect("/panel/entrar");
}
