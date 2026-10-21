const LABELS: Record<string, string> = {
  "pendiente-pago": "Pendiente de pago",
  pagado: "Pagado",
  preparando: "Preparando",
  enviado: "Enviado",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

export function statusLabel(status: string) {
  return LABELS[status] ?? status;
}

export function StatusPill({ status }: { status: string }) {
  const tone = status === "cancelado" ? "bg-red-50 text-red-700" : status === "pendiente-pago" ? "bg-amber-50 text-amber-800" : "bg-accent-soft text-accent";
  return <span className={`rounded-full px-2.5 py-0.5 text-xs ${tone}`}>{statusLabel(status)}</span>;
}
