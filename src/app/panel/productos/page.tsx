import { requireAdmin } from "@/lib/session";
import { listProducts } from "@/lib/store";
import { saveProduct } from "../../actions";
import { PanelNav } from "../PanelNav";

export const dynamic = "force-dynamic";

export default async function ProductosPage() {
  await requireAdmin();
  const products = await listProducts({ includeInactive: true });
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Productos y precios</h1>
      <PanelNav />
      <p className="text-sm text-muted">Precio profesional sin IVA, en euros. Sin precio, el producto se ve en el catálogo pero no se puede pedir.</p>
      <table className="w-full text-sm">
        <thead className="text-left text-muted">
          <tr><th className="py-2">Producto</th><th>Línea</th><th>Formato</th><th>Precio (€)</th><th>Activo</th><th></th></tr>
        </thead>
        <tbody className="divide-y divide-line">
          {products.map((p) => (
            <tr key={p.id}>
              <td className="py-2">{p.name}</td>
              <td>{p.line_id}</td>
              <td>{p.format}</td>
              <td colSpan={3}>
                <form action={saveProduct} className="flex items-center gap-3">
                  <input type="hidden" name="id" value={p.id} />
                  <input name="price" inputMode="decimal" defaultValue={p.price_cents != null ? (p.price_cents / 100).toFixed(2) : ""} className="input w-28 py-1" aria-label={`Precio de ${p.name}`} />
                  <input type="checkbox" name="active" defaultChecked={p.active} aria-label="Activo" />
                  <button className="btn-ghost py-1">Guardar</button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
