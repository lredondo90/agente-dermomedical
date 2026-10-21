import "server-only";
import { randomBytes } from "node:crypto";
import { one, query } from "./db";
import { DEFAULT_PRICING, PricingSettings, quote, sanitizeTiers, vatPctFor } from "./pricing";
import { CONSENT_VERSION } from "./company";

export type Line = { id: string; name: string; focus: string };
export type Product = {
  id: number;
  slug: string;
  line_id: string;
  name: string;
  format: string;
  professional: boolean;
  source_url: string | null;
  price_cents: number | null;
  active: boolean;
};
export type Customer = {
  id: number;
  name: string;
  clinic: string;
  email: string;
  phone: string | null;
  province: string;
  license_number: string | null;
  tax_id: string | null;
  address: string | null;
  interest_line_id: string | null;
  consent_email: boolean;
  consent_whatsapp: boolean;
  consent_at: string | null;
  source: string;
  status: string;
  created_at: string;
};
export type Order = {
  id: number;
  customer_id: number;
  kind: "pedido" | "muestra";
  status: string;
  subtotal_cents: number;
  discount_pct: number;
  discount_cents: number;
  shipping_cents: number;
  vat_cents: number;
  total_cents: number;
  notes: string | null;
  created_by: string;
  created_at: string;
};
export type OrderLine = { product_id: number; name: string; quantity: number; unit_cents: number; line_cents: number };

export const ORDER_STATUSES = ["pendiente-pago", "pagado", "preparando", "enviado", "entregado", "cancelado"] as const;

export async function logEvent(customerId: number | null, type: string, detail?: unknown) {
  await query("insert into events (customer_id, type, detail) values ($1, $2, $3)", [
    customerId,
    type,
    detail === undefined ? null : JSON.stringify(detail),
  ]);
}

// --- Catálogo ---

export async function listLines() {
  return query<Line>("select id, name, focus from lines order by sort");
}

export async function listProducts(opts: { lineId?: string; includeInactive?: boolean } = {}) {
  return query<Product>(
    `select * from products where ($1::text is null or line_id = $1) and ($2 or active) order by line_id, name`,
    [opts.lineId ?? null, opts.includeInactive ?? false],
  );
}

export async function updateProduct(id: number, priceCents: number | null, active: boolean) {
  await query("update products set price_cents = $2, active = $3, updated_at = now() where id = $1", [id, priceCents, active]);
}

// --- Ajustes ---

export async function getPricing(): Promise<PricingSettings> {
  const row = await one<{ value: PricingSettings }>("select value from settings where key = 'pricing'");
  return row ? { ...DEFAULT_PRICING, ...row.value, tiers: sanitizeTiers(row.value.tiers ?? []) } : DEFAULT_PRICING;
}

export async function savePricing(settings: PricingSettings) {
  const clean = { ...settings, tiers: sanitizeTiers(settings.tiers) };
  await query(
    `insert into settings (key, value) values ('pricing', $1) on conflict (key) do update set value = excluded.value`,
    [JSON.stringify(clean)],
  );
}

// --- Clientes ---

export type Registration = {
  name: string;
  clinic: string;
  email: string;
  phone?: string;
  province: string;
  licenseNumber?: string;
  taxId?: string;
  address?: string;
  interestLineId?: string;
  consentEmail: boolean;
  consentWhatsapp: boolean;
  wantsSample: boolean;
  source?: string;
};

export async function findCustomerByEmail(email: string) {
  return one<Customer>("select * from customers where email = $1", [email.trim().toLowerCase()]);
}

export async function getCustomer(id: number) {
  return one<Customer>("select * from customers where id = $1", [id]);
}

export async function registerCustomer(r: Registration) {
  const email = r.email.trim().toLowerCase();
  const existing = await findCustomerByEmail(email);
  if (existing) return { customer: existing, created: false };
  const consentAt = r.consentEmail || r.consentWhatsapp ? new Date().toISOString() : null;
  const customer = (await one<Customer>(
    `insert into customers (name, clinic, email, phone, province, license_number, tax_id, address, interest_line_id,
       consent_email, consent_whatsapp, consent_at, consent_version, source)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) returning *`,
    [
      r.name.trim(),
      r.clinic.trim(),
      email,
      r.phone?.trim() || null,
      r.province,
      r.licenseNumber?.trim() || null,
      r.taxId?.trim() || null,
      r.address?.trim() || null,
      r.interestLineId || null,
      r.consentEmail,
      r.consentWhatsapp,
      consentAt,
      CONSENT_VERSION,
      r.source ?? "alta-web",
    ],
  ))!;
  await logEvent(customer.id, "alta", {
    consentEmail: r.consentEmail,
    consentWhatsapp: r.consentWhatsapp,
    consentVersion: CONSENT_VERSION,
  });
  if (r.wantsSample) await createSampleRequest(customer.id, r.interestLineId);
  return { customer, created: true };
}

export async function setConsents(customerId: number, consentEmail: boolean, consentWhatsapp: boolean) {
  await query(
    `update customers set consent_email = $2, consent_whatsapp = $3, consent_at = now(), consent_version = $4 where id = $1`,
    [customerId, consentEmail, consentWhatsapp, CONSENT_VERSION],
  );
  await logEvent(customerId, "consentimiento", { consentEmail, consentWhatsapp, consentVersion: CONSENT_VERSION });
}

export async function listCustomers() {
  return query<Customer & { orders: number; spent_cents: number }>(
    `select c.*, count(o.id) filter (where o.kind = 'pedido')::int as orders,
       coalesce(sum(o.total_cents) filter (where o.kind = 'pedido' and o.status <> 'cancelado'), 0)::int as spent_cents
     from customers c left join orders o on o.customer_id = c.id
     group by c.id order by c.created_at desc`,
  );
}

// --- Acceso por enlace ---

export async function createLoginToken(customerId: number) {
  const token = randomBytes(24).toString("base64url");
  await query(
    "insert into login_tokens (token, customer_id, expires_at) values ($1, $2, now() + interval '30 minutes')",
    [token, customerId],
  );
  return token;
}

export async function consumeLoginToken(token: string) {
  const row = await one<{ customer_id: number }>(
    `update login_tokens set used_at = now()
     where token = $1 and used_at is null and expires_at > now() returning customer_id`,
    [token],
  );
  return row?.customer_id;
}

// --- Pedidos ---

export type CartItem = { productId: number; quantity: number };

export async function quoteCart(items: CartItem[], province?: string | null) {
  const wanted = items.filter((i) => Number.isInteger(i.productId) && Number.isInteger(i.quantity) && i.quantity > 0);
  const ids = wanted.map((i) => i.productId);
  const products = ids.length
    ? await query<Product>("select * from products where id = any($1::int[])", [ids])
    : [];
  const byId = new Map(products.map((p) => [p.id, p]));
  const unavailable: string[] = [];
  const lines = [];
  for (const item of wanted) {
    const p = byId.get(item.productId);
    if (!p || !p.active || p.price_cents == null) {
      unavailable.push(p?.name ?? `Producto ${item.productId}`);
      continue;
    }
    lines.push({ productId: p.id, name: p.name, quantity: Math.min(item.quantity, 999), unitCents: p.price_cents });
  }
  return { ...quote(lines, await getPricing(), vatPctFor(province)), unavailable };
}

export async function createOrder(customerId: number, items: CartItem[], createdBy: "cliente" | "agente" | "admin", notes?: string) {
  const customer = await getCustomer(customerId);
  if (!customer) throw new Error("Cliente no encontrado");
  const q = await quoteCart(items, customer.province);
  if (q.lines.length === 0) throw new Error("El pedido no tiene productos disponibles");
  const order = (await one<Order>(
    `insert into orders (customer_id, kind, status, subtotal_cents, discount_pct, discount_cents, shipping_cents, vat_cents,
       total_cents, notes, created_by)
     values ($1, 'pedido', 'pendiente-pago', $2, $3, $4, $5, $6, $7, $8, $9) returning *`,
    [customerId, q.subtotalCents, q.discountPct, q.discountCents, q.shippingCents, q.vatCents, q.totalCents, notes ?? null, createdBy],
  ))!;
  for (const l of q.lines) {
    await query(
      `insert into order_lines (order_id, product_id, name, quantity, unit_cents, line_cents) values ($1, $2, $3, $4, $5, $6)`,
      [order.id, l.productId, l.name, l.quantity, l.unitCents, l.lineCents],
    );
  }
  await query("update customers set status = 'cliente' where id = $1", [customerId]);
  await logEvent(customerId, "pedido", { orderId: order.id, totalCents: order.total_cents, createdBy });
  return order;
}

// Pedido de muestra gratuito: una muestra de 1 ml de la línea que le interesa (o el set si no eligió ninguna).
export async function createSampleRequest(customerId: number, lineId?: string | null) {
  const sample =
    (lineId &&
      (await one<Product>(
        `select * from products where line_id = $1 and format = 'Muestra' and active order by name limit 1`,
        [lineId],
      ))) ||
    (await one<Product>(`select * from products where format = 'Muestra' and active order by name limit 1`));
  if (!sample) return undefined;
  const order = (await one<Order>(
    `insert into orders (customer_id, kind, status, subtotal_cents, total_cents, created_by)
     values ($1, 'muestra', 'preparando', 0, 0, 'cliente') returning *`,
    [customerId],
  ))!;
  await query(
    `insert into order_lines (order_id, product_id, name, quantity, unit_cents, line_cents) values ($1, $2, $3, 1, 0, 0)`,
    [order.id, sample.id, sample.name],
  );
  await logEvent(customerId, "muestra-solicitada", { orderId: order.id, product: sample.name });
  return order;
}

export async function listOrders(customerId?: number) {
  return query<Order & { clinic: string; customer_name: string }>(
    `select o.*, c.clinic, c.name as customer_name from orders o join customers c on c.id = o.customer_id
     where ($1::int is null or o.customer_id = $1) order by o.created_at desc`,
    [customerId ?? null],
  );
}

export async function getOrder(id: number, customerId?: number) {
  const order = await one<Order & { clinic: string; customer_name: string; email: string; province: string; address: string | null }>(
    `select o.*, c.clinic, c.name as customer_name, c.email, c.province, c.address from orders o
     join customers c on c.id = o.customer_id where o.id = $1 and ($2::int is null or o.customer_id = $2)`,
    [id, customerId ?? null],
  );
  if (!order) return undefined;
  const lines = await query<OrderLine>(
    "select product_id, name, quantity, unit_cents, line_cents from order_lines where order_id = $1 order by id",
    [id],
  );
  return { ...order, lines };
}

export async function setOrderStatus(id: number, status: string) {
  if (!(ORDER_STATUSES as readonly string[]).includes(status)) throw new Error("Estado no válido");
  const order = await one<Order>("update orders set status = $2 where id = $1 returning *", [id, status]);
  if (order) await logEvent(order.customer_id, "estado-pedido", { orderId: id, status });
  return order;
}

export async function dashboard() {
  return (await one<{
    customers: number;
    with_consent: number;
    orders: number;
    pending: number;
    revenue_cents: number;
    samples: number;
    unpriced: number;
  }>(
    `select
       (select count(*) from customers)::int as customers,
       (select count(*) from customers where consent_email or consent_whatsapp)::int as with_consent,
       (select count(*) from orders where kind = 'pedido')::int as orders,
       (select count(*) from orders where kind = 'pedido' and status = 'pendiente-pago')::int as pending,
       (select coalesce(sum(total_cents), 0) from orders where kind = 'pedido' and status <> 'cancelado')::int as revenue_cents,
       (select count(*) from orders where kind = 'muestra')::int as samples,
       (select count(*) from products where active and price_cents is null)::int as unpriced`,
  ))!;
}
