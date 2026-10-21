"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { placeOrder, quoteCart } from "@/app/actions";
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
    return (
      <div className="card space-y-4 px-6 py-20 text-center">
        <p className="display text-3xl">Tu carrito está vacío</p>
        <Link href="/catalogo" className="btn h-11 px-6">Ver catálogo</Link>
      </div>
    );
  }
  if (!quote) return <p className="text-muted">Calculando…</p>;

  return (
    <div className="grid items-start gap-10 lg:grid-cols-[1fr_360px]">
      <div className="space-y-4">
        <ul className="card divide-y divide-line px-5 py-1">
          {quote.lines.map((l) => (
            <li key={l.productId} className="flex items-center gap-4 py-4">
              <div className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-[linear-gradient(160deg,#f6f4f0,#ebe8e1)]">
                {l.imageUrl && (
                  <Image src={l.imageUrl} alt="" fill unoptimized sizes="80px" className="object-contain p-2 mix-blend-multiply" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-medium">{l.name}</div>
                <div className="text-sm text-subtle">{euros(l.unitCents)} / ud.</div>
              </div>
              <input
                type="number"
                min={0}
                max={999}
                value={l.quantity}
                onChange={(e) => setQuantity(l.productId, Math.max(0, Number(e.target.value)))}
                className="input w-20 text-center"
                aria-label={`Cantidad de ${l.name}`}
              />
              <span className="w-24 text-right font-semibold tabular-nums">{euros(l.lineCents)}</span>
            </li>
          ))}
        </ul>
        {quote.unavailable.length > 0 && (
          <p className="text-sm text-danger">Ya no están disponibles y no se incluirán: {quote.unavailable.join(", ")}</p>
        )}
        <label className="label pt-4" htmlFor="notes">Notas para el pedido (opcional)</label>
        <textarea id="notes" className="input" rows={2} maxLength={500} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
      <aside className="card space-y-4 lg:sticky lg:top-24">
        <h2 className="text-lg font-semibold">Resumen</h2>
        <dl className="grid grid-cols-2 gap-y-2 text-sm">
          <dt className="text-muted">Subtotal</dt><dd className="text-right">{euros(quote.subtotalCents)}</dd>
          {quote.discountPct > 0 && (<><dt className="text-muted">Descuento por volumen ({quote.discountPct} %)</dt><dd className="text-right text-accent">−{euros(quote.discountCents)}</dd></>)}
          <dt className="text-muted">Envío</dt><dd className="text-right">{quote.shippingCents ? euros(quote.shippingCents) : "Gratis"}</dd>
          <dt className="text-muted">IVA</dt><dd className="text-right">{euros(quote.vatCents)}</dd>
          <dt className="border-t border-line pt-3 text-base font-semibold">Total</dt>
          <dd className="border-t border-line pt-3 text-right text-xl font-semibold">{euros(quote.totalCents)}</dd>
        </dl>
        {quote.nextTier && (
          <p className="rounded-xl bg-accent-soft p-3 text-sm text-accent-strong">
            Añade {euros(quote.nextTier.minCents - quote.subtotalCents)} más y tendrás un {quote.nextTier.pct} % de descuento.
          </p>
        )}
        {error && <p className="text-sm text-danger">{error}</p>}
        <button
          className="btn h-12 w-full text-base"
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
        <p className="text-center text-xs text-subtle">Pago por transferencia. Lo enviamos al recibir el pago.</p>
      </aside>
    </div>
  );
}
