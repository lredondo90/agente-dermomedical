// Cabecera común de las páginas del panel: sección, título, explicación y acciones a la derecha.
export function PageHeader({ eyebrow, title, children, actions }: { eyebrow?: string; title: string; children?: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <header className="no-print flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-3xl space-y-1.5">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className="page-title">{title}</h1>
        {children && <div className="text-sm leading-relaxed text-muted">{children}</div>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}

export function Stat({ label, value, hint, tone }: { label: string; value: React.ReactNode; hint?: string; tone?: "accent" | "warn" }) {
  const color = tone === "accent" ? "text-accent" : tone === "warn" ? "text-warn" : "";
  return (
    <div className="card p-5">
      <div className="text-xs text-subtle">{label}</div>
      <div className={`mt-1.5 text-2xl font-semibold tracking-tight tabular-nums ${color}`}>{value}</div>
      {hint && <div className="mt-1 text-xs text-subtle">{hint}</div>}
    </div>
  );
}
