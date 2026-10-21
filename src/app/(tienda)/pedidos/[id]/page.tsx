import { notFound } from "next/navigation";
import { company } from "@/lib/company";
import { euros } from "@/lib/pricing";
import { requireCustomer } from "@/lib/session";
import { getOrder } from "@/lib/store";
import { StatusPill } from "@/components/StatusPill";
import { RepeatButton } from "./RepeatButton";

export const dynamic = "force-dynamic";

export default async function PedidoPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ nuevo?: string }> }) {
  const customerId = await requireCustomer();
  const order = await getOrder(Number((await params).id), customerId);
  if (!order) notFound();
  const { nuevo } = await searchParams;
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      {nuevo && <div className="rounded-2xl border border-accent/15 bg-accent-soft px-5 py-4 text-sm text-accent-strong">Pedido recibido. Te hemos enviado la confirmación por correo.</div>}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="display text-5xl leading-none">{order.kind === "muestra" ? "Muestra gratuita" : "Pedido"} {order.id}</h1>
        <StatusPill status={order.status} />
      </div>
      <p className="text-sm text-muted">{new Date(order.created_at).toLocaleString("es-ES")} · {order.clinic}</p>
      <div className="card divide-y divide-line text-sm">
        {order.lines.map((l) => (
          <div key={l.product_id} className="flex justify-between py-2">
            <span>{l.quantity} × {l.name}</span>
            <span>{euros(l.line_cents)}</span>
          </div>
        ))}
      </div>
      {order.kind === "pedido" && (
        <dl className="card grid grid-cols-2 gap-y-2 text-sm">
          <dt>Subtotal</dt><dd className="text-right">{euros(order.subtotal_cents)}</dd>
          {order.discount_pct > 0 && (<><dt>Descuento ({order.discount_pct} %)</dt><dd className="text-right">−{euros(order.discount_cents)}</dd></>)}
          <dt>Envío</dt><dd className="text-right">{order.shipping_cents ? euros(order.shipping_cents) : "Gratis"}</dd>
          <dt>IVA</dt><dd className="text-right">{euros(order.vat_cents)}</dd>
          <dt className="border-t border-line pt-3 text-base font-semibold">Total</dt><dd className="border-t border-line pt-3 text-right text-xl font-semibold tabular-nums">{euros(order.total_cents)}</dd>
        </dl>
      )}
      {order.status === "pendiente-pago" && (
        <div className="rounded-2xl border border-warn/20 bg-warn-soft px-5 py-4 text-sm text-warn">
          <strong>Pago por transferencia.</strong> IBAN {company.iban}, concepto «Pedido {order.id}». Lo enviamos en cuanto recibamos el pago.
        </div>
      )}
      {order.kind === "pedido" && <RepeatButton items={order.lines.map((l) => ({ productId: l.product_id, quantity: l.quantity }))} />}
    </div>
  );
}
