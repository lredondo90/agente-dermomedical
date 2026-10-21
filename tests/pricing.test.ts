import { test } from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_PRICING, discountPct, quote, sanitizeTiers, vatPctFor } from "../src/lib/pricing";

test("sin descuento por debajo del primer tramo", () => {
  assert.equal(discountPct(29999, DEFAULT_PRICING.tiers), 0);
});

test("aplica el mejor tramo alcanzado", () => {
  assert.equal(discountPct(30000, DEFAULT_PRICING.tiers), 5);
  assert.equal(discountPct(100000, DEFAULT_PRICING.tiers), 10);
});

test("nunca supera el 10 % aunque se configure más", () => {
  assert.equal(discountPct(100000, [{ minCents: 0, pct: 25 }]), 10);
  assert.deepEqual(sanitizeTiers([{ minCents: 500, pct: 40 }, { minCents: 100, pct: 0 }]), [{ minCents: 500, pct: 10 }]);
});

test("calcula descuento, envío e IVA", () => {
  const q = quote([{ productId: 1, name: "A", quantity: 2, unitCents: 20000 }], DEFAULT_PRICING);
  assert.equal(q.subtotalCents, 40000);
  assert.equal(q.discountPct, 5);
  assert.equal(q.discountCents, 2000);
  assert.equal(q.shippingCents, 0);
  assert.equal(q.vatCents, 7980);
  assert.equal(q.totalCents, 45980);
});

test("cobra envío en pedidos pequeños", () => {
  const q = quote([{ productId: 1, name: "A", quantity: 1, unitCents: 5000 }], DEFAULT_PRICING);
  assert.equal(q.shippingCents, 690);
  assert.equal(q.totalCents, Math.round(5690 * 1.21));
});

test("sin IVA peninsular en Canarias", () => {
  const q = quote([{ productId: 1, name: "A", quantity: 1, unitCents: 20000 }], DEFAULT_PRICING, vatPctFor("Las Palmas"));
  assert.equal(q.vatCents, 0);
  assert.equal(vatPctFor("Madrid"), 21);
});
