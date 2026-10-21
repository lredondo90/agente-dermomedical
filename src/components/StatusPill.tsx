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
  const tone =
    status === "cancelado" ? "bg-red-50 text-danger" : status === "pendiente-pago" ? "bg-warn-soft text-warn" : "bg-accent-soft text-accent-strong";
  return (
    <span className={`chip ${tone}`}>
      <span className="size-1.5 rounded-full bg-current" />
      {statusLabel(status)}
    </span>
  );
}
