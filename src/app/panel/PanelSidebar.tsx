"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ICONS: Record<string, React.ReactNode> = {
  resumen: <path d="M4 13h6V4H4v9Zm0 7h6v-4H4v4Zm10 0h6v-9h-6v9Zm0-16v4h6V4h-6Z" />,
  clientes: <path d="M16 19v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1M9.5 10a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM21 19v-1a4 4 0 0 0-3-3.9M15.5 3.2a3.5 3.5 0 0 1 0 6.6" />,
  productos: <path d="M21 8 12 3 3 8m18 0-9 5m9-5v8l-9 5m0-8L3 8m9 5v8M3 8v8l9 5" />,
  ajustes: <path d="M19 5 5 19M7.5 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm9 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" />,
  agente: <path d="M12 3v3m-6 4a6 6 0 0 1 12 0v4a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4v-4Zm3.5 2h.01M14.5 12h.01M9 21h6" />,
  clinicas: <path d="M12 21s-7-5.5-7-11a7 7 0 0 1 14 0c0 5.5-7 11-7 11Zm0-8.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />,
};

const ITEMS = [
  { href: "/panel", label: "Resumen y pedidos", icon: "resumen" },
  { href: "/panel/clientes", label: "Clientes", icon: "clientes" },
  { href: "/panel/productos", label: "Productos y precios", icon: "productos" },
  { href: "/panel/ajustes", label: "Descuentos y envío", icon: "ajustes" },
  { href: "/panel/agente", label: "Agente", icon: "agente" },
  { href: "/panel/agente/clinicas", label: "Clínicas y cartas", icon: "clinicas" },
];

// La sección activa es la de ruta más larga que coincide (así «Clínicas» no marca también «Agente»).
function activeHref(path: string) {
  return ITEMS.filter((i) => path === i.href || path.startsWith(i.href + "/"))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;
}

export function PanelSidebar({ needsHuman }: { needsHuman: number }) {
  const active = activeHref(usePathname());
  return (
    <nav className="flex gap-1 overflow-x-auto px-3 pb-3 text-sm [scrollbar-width:none] lg:flex-1 lg:flex-col lg:overflow-visible lg:pb-0">
      <div className="hidden px-3 pb-2 text-[11px] font-medium tracking-[0.14em] text-subtle uppercase lg:block">Gestión</div>
      {ITEMS.map((i) => {
        const on = i.href === active;
        return (
          <Link
            key={i.href}
            href={i.href}
            className={`flex h-9 shrink-0 items-center gap-2.5 rounded-lg px-3 whitespace-nowrap transition-colors ${
              on ? "bg-foreground text-white shadow-sm" : "text-muted hover:bg-soft hover:text-foreground"
            }`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              {ICONS[i.icon]}
            </svg>
            <span className="flex-1">{i.label}</span>
            {i.icon === "agente" && needsHuman > 0 && (
              <span className={`min-w-5 rounded-full px-1.5 text-center text-[11px] leading-5 font-semibold ${on ? "bg-white text-foreground" : "bg-warn-soft text-warn"}`}>
                {needsHuman}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
