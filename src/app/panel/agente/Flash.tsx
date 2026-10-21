export function Flash({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="rounded-lg bg-accent-soft px-4 py-3 text-sm text-accent">{msg}</p>;
}
