import { requireAdmin } from "@/lib/session";
import { listProducts } from "@/lib/store";
import { saveProduct } from "../../actions";
import { PageHeader } from "../PageHeader";

export const dynamic = "force-dynamic";

export default async function ProductosPage() {
  await requireAdmin();
  const products = await listProducts({ includeInactive: true });
  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Catálogo" title="Productos y precios">Precio profesional sin IVA, en euros. Sin precio, el producto se ve en el catálogo pero no se puede pedir.</PageHeader>
      <div className="card overflow-x-auto p-2">
      <table className="table">
        <thead>
          <tr><th>Producto</th><th>Línea</th><th>Formato</th><th>Precio (€)</th><th>Activo</th><th></th></tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id}>
              <td className="font-medium">{p.name}</td>
              <td><span className="chip bg-soft text-muted">{p.line_id}</span></td>
              <td className="text-muted">{p.format}</td>
              <td colSpan={3}>
                <form action={saveProduct} className="flex items-center gap-3">
                  <input type="hidden" name="id" value={p.id} />
                  <input name="price" inputMode="decimal" defaultValue={p.price_cents != null ? (p.price_cents / 100).toFixed(2) : ""} className="input h-8 w-28 rounded-lg py-0 text-right tabular-nums" aria-label={`Precio de ${p.name}`} />
                  <input type="checkbox" name="active" defaultChecked={p.active} aria-label="Activo" />
                  <button className="btn-ghost h-8 px-3 text-[13px]">Guardar</button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}
