"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { placeOrder, quoteCart } from "../actions";
import { replaceCart, setQuantity, useCart } from "@/lib/cart";
import { euros } from "@/lib/pricing";

type Quote = Awaited<ReturnType<typeof quoteCart>>;

export function CartView() {
  const items = useCart();
  const router = useRouter();
  const [quote, setQuote] = useState<Quote>();
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();

  useEffect(() => {
    let live = true;
    quoteCart(items).then((q) => live && setQuote(q));
    return () => {
      live = false;
    };
  }, [items]);

  if (items.length === 0) {
    return <p className="text-muted">Tu carrito está vacío. <Link href="/catalogo" className="underline">Ver catálogo</Link></p>;
  }
  if (!quote) return <p className="text-muted">Calculando…</p>;

  return (
    <div className="space-y-4">
      <div className="card divide-y divide-line">
        {quote.lines.map((l) => (
          <div key={l.productId} className="flex flex-wrap items-center gap-3 py-2">
            <span className="mr-auto">{l.name}</span>
            <input
              type="number"
              min={0}
              max={999}
              value={l.quantity}
              onChange={(e) => setQuantity(l.productId, Math.max(0, Number(e.target.value)))}
              className="input w-20"
              aria-label={`Cantidad de ${l.name}`}
            />
            <span className="w-24 text-right">{euros(l.lineCents)}</span>
          </div>
        ))}
      </div>
      {quote.unavailable.length > 0 && (
        <p className="text-sm text-red-700">Ya no están disponibles y no se incluirán: {quote.unavailable.join(", ")}</p>
      )}
      <dl className="card grid grid-cols-2 gap-1 text-sm">
        <dt>Subtotal</dt><dd className="text-right">{euros(quote.subtotalCents)}</dd>
        {quote.discountPct > 0 && (<><dt>Descuento por volumen ({quote.discountPct} %)</dt><dd className="text-right">−{euros(quote.discountCents)}</dd></>)}
        <dt>Envío</dt><dd className="text-right">{quote.shippingCents ? euros(quote.shippingCents) : "Gratis"}</dd>
        <dt>IVA</dt><dd className="text-right">{euros(quote.vatCents)}</dd>
        <dt className="font-semibold">Total</dt><dd className="text-right font-semibold">{euros(quote.totalCents)}</dd>
      </dl>
      {quote.nextTier && (
        <p className="text-sm text-accent">
          Añade {euros(quote.nextTier.minCents - quote.subtotalCents)} más y tendrás un {quote.nextTier.pct} % de descuento.
        </p>
      )}
      <label className="label" htmlFor="notes">Notas para el pedido (opcional)</label>
      <textarea id="notes" className="input" rows={2} maxLength={500} value={notes} onChange={(e) => setNotes(e.target.value)} />
      {error && <p className="text-sm text-red-700">{error}</p>}
      <button
        className="btn"
        disabled={pending || quote.lines.length === 0}
        onClick={() =>
          start(async () => {
            try {
              const { orderId } = await placeOrder(items, notes);
              replaceCart([]);
              router.push(`/pedidos/${orderId}?nuevo=1`);
            } catch {
              setError("No hemos podido crear el pedido. Inténtalo de nuevo.");
            }
          })
        }
      >
        Confirmar pedido
      </button>
    </div>
  );
}
