"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { company } from "@/lib/company";
import { PROVINCES } from "@/lib/provinces";
import { sendMail } from "@/lib/mail";
import { getSession, requireAdmin, requireCustomer, setSession } from "@/lib/session";
import * as store from "@/lib/store";

export type FormState = { error?: string; info?: string; devLink?: string };

const registrationSchema = z.object({
  name: z.string().trim().min(2, "Indica tu nombre"),
  clinic: z.string().trim().min(2, "Indica la clínica o consulta"),
  email: z.string().trim().email("Correo no válido"),
  phone: z.string().trim().optional(),
  province: z.enum(PROVINCES as [string, ...string[]], { message: "Elige una provincia" }),
  licenseNumber: z.string().trim().min(3, "Indica tu número de colegiado"),
  taxId: z.string().trim().optional(),
  address: z.string().trim().optional(),
  interestLineId: z.string().optional(),
  professional: z.literal("on", { message: "La venta es solo para profesionales sanitarios" }),
  privacy: z.literal("on", { message: "Debes aceptar la política de privacidad" }),
});

export async function register(_: FormState, form: FormData): Promise<FormState> {
  const parsed = registrationSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;
  const consentWhatsapp = form.get("consentWhatsapp") === "on";
  if (consentWhatsapp && !d.phone) return { error: "Para recibir WhatsApp necesitamos tu móvil" };
  const { customer, created } = await store.registerCustomer({
    ...d,
    consentEmail: form.get("consentEmail") === "on",
    consentWhatsapp,
    wantsSample: form.get("wantsSample") === "on",
    source: String(form.get("source") || "alta-web"),
  });
  if (!created) return { error: "Ese correo ya está dado de alta. Entra con tu correo para recibir un enlace de acceso." };
  await setSession({ kind: "customer", customerId: customer.id });
  redirect("/catalogo?bienvenida=1");
}

export async function requestLogin(_: FormState, form: FormData): Promise<FormState> {
  const email = String(form.get("email") ?? "");
  const customer = await store.findCustomerByEmail(email);
  // Misma respuesta exista o no el correo, para no revelar quién es cliente.
  const info = "Si el correo está dado de alta, te hemos enviado un enlace para entrar. Caduca en 30 minutos.";
  if (!customer) return { info };
  const token = await store.createLoginToken(customer.id);
  const link = `${company.siteUrl}/entrar/${token}`;
  await sendMail(customer.email, "Tu enlace para entrar", `Hola ${customer.name},\n\nEntra en tu cuenta profesional: ${link}\n\nSi no lo has pedido tú, ignora este correo.`);
  return { info, devLink: process.env.NODE_ENV === "production" ? undefined : link };
}

export async function quoteCart(items: store.CartItem[]) {
  const session = await getSession();
  const customer = session?.kind === "customer" ? await store.getCustomer(session.customerId) : undefined;
  return store.quoteCart(items, customer?.province);
}

export async function placeOrder(items: store.CartItem[], notes: string) {
  const customerId = await requireCustomer();
  const order = await store.createOrder(customerId, items, "cliente", notes.slice(0, 500) || undefined);
  const customer = (await store.getCustomer(customerId))!;
  await sendMail(
    customer.email,
    `Pedido ${order.id} recibido`,
    `Hemos recibido tu pedido ${order.id}. Puedes verlo en ${company.siteUrl}/pedidos/${order.id}`,
  );
  return { orderId: order.id };
}

export async function updateConsents(form: FormData) {
  const customerId = await requireCustomer();
  await store.setConsents(customerId, form.get("consentEmail") === "on", form.get("consentWhatsapp") === "on");
  revalidatePath("/cuenta");
}

// --- Panel ---

export async function adminLogin(_: FormState, form: FormData): Promise<FormState> {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return { error: "Configura ADMIN_PASSWORD para activar el panel" };
  if (form.get("password") !== expected) return { error: "Contraseña incorrecta" };
  await setSession({ kind: "admin" });
  redirect("/panel");
}

function cents(value: FormDataEntryValue | null): number | null {
  const text = String(value ?? "").trim().replace(",", ".");
  if (!text) return null;
  const n = Number(text);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : null;
}

export async function saveProduct(form: FormData) {
  await requireAdmin();
  await store.updateProduct(Number(form.get("id")), cents(form.get("price")), form.get("active") === "on");
  revalidatePath("/panel/productos");
  revalidatePath("/catalogo");
}

export async function changeOrderStatus(form: FormData) {
  await requireAdmin();
  await store.setOrderStatus(Number(form.get("id")), String(form.get("status")));
  revalidatePath("/panel");
}

export async function savePricingSettings(form: FormData) {
  await requireAdmin();
  const tiers = [0, 1, 2]
    .map((i) => ({ minCents: cents(form.get(`min${i}`)) ?? NaN, pct: Number(form.get(`pct${i}`)) }))
    .filter((t) => !Number.isNaN(t.minCents) && t.pct > 0);
  await store.savePricing({
    tiers,
    shippingCents: cents(form.get("shipping")) ?? 0,
    freeShippingFromCents: cents(form.get("freeFrom")) ?? 0,
  });
  revalidatePath("/panel/ajustes");
}
