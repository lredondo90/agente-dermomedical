import { brand } from "@/lib/company";

// Monograma de la marca: inicial en serif dentro de un círculo con un brillo sutil.
export function Logo({ inverted }: { inverted?: boolean }) {
  return (
    <span
      className={`grid size-9 shrink-0 place-items-center rounded-full font-display text-xl leading-none ${
        inverted ? "bg-white text-foreground" : "bg-[radial-gradient(circle_at_30%_25%,#2b6f63,#0f3f37_70%)] text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.2)]"
      }`}
      aria-hidden="true"
    >
      {brand.name.charAt(0)}
    </span>
  );
}
