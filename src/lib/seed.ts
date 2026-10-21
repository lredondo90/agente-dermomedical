import catalog from "../../data/catalogo.json";

type Run = (text: string, params?: unknown[]) => Promise<unknown>;

// Carga líneas y productos del catálogo. Nunca pisa precios ni el estado activo que ya se hayan editado en el panel.
export async function seedCatalog(run: Run) {
  for (const [sort, line] of catalog.lines.entries()) {
    await run(
      `insert into lines (id, name, focus, sort) values ($1, $2, $3, $4)
       on conflict (id) do update set name = excluded.name, focus = excluded.focus, sort = excluded.sort`,
      [line.id, line.name, line.focus, sort],
    );
  }
  for (const p of catalog.products) {
    await run(
      `insert into products (slug, line_id, name, format, professional, source_url) values ($1, $2, $3, $4, $5, $6)
       on conflict (slug) do update set line_id = excluded.line_id, name = excluded.name, format = excluded.format,
         professional = excluded.professional, source_url = excluded.source_url`,
      [p.slug, p.line, p.name, p.format, p.professional, p.url],
    );
  }
}

// Solo para la demo online (DEMO_PRICES=1): precios de ejemplo en los productos que aún no tienen precio,
// para poder probar el pedido completo. No son precios reales.
const DEMO_PRICE_CENTS: Record<string, number> = { Muestra: 500, Sachette: 300, Monodosis: 900, Viales: 9500, Envase: 4500 };

export async function seedDemoPrices(run: Run) {
  for (const [format, cents] of Object.entries(DEMO_PRICE_CENTS)) {
    await run("update products set price_cents = $2 where price_cents is null and format = $1", [format, cents]);
  }
  await run("update products set price_cents = 12000 where price_cents = 4500 and name like '%Peeling%60ml%'");
}
