import Link from "next/link";

export function PanelNav() {
  return (
    <nav className="flex flex-wrap gap-2 text-sm">
      <Link href="/panel" className="btn-ghost">Resumen y pedidos</Link>
      <Link href="/panel/clientes" className="btn-ghost">Clientes</Link>
      <Link href="/panel/productos" className="btn-ghost">Productos y precios</Link>
      <Link href="/panel/ajustes" className="btn-ghost">Descuentos y envío</Link>
    </nav>
  );
}
