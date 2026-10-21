export function Flash({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <p className="no-print flex items-center gap-2.5 rounded-2xl border border-accent/15 bg-accent-soft px-4 py-3 text-sm text-accent-strong">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="m5 12.5 4.5 4.5L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {msg}
    </p>
  );
}
