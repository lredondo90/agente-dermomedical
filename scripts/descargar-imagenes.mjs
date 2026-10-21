// Descarga las fotos de producto de cada catálogo (campo "image") a public/productos/<catálogo>/<slug>.webp,
// reducidas a 800 px y en WebP para que la web cargue rápido. Solo baja las que faltan.
// Uso: node scripts/descargar-imagenes.mjs
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
let failed = 0;

for (const file of readdirSync(path.join(root, "data", "catalogos")).filter((f) => f.endsWith(".json"))) {
  const catalogId = file.replace(/\.json$/, "");
  const dir = path.join(root, "public", "productos", catalogId);
  mkdirSync(dir, { recursive: true });
  const { products } = JSON.parse(readFileSync(path.join(root, "data", "catalogos", file), "utf8"));
  for (const p of products) {
    const target = path.join(dir, `${p.slug}.webp`);
    if (!p.image || existsSync(target)) continue;
    try {
      const res = await fetch(p.image, { headers: { "user-agent": "Mozilla/5.0 (catalogo de distribuidor)" } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const input = Buffer.from(await res.arrayBuffer());
      const output = await sharp(input)
        .resize(800, 800, { fit: "contain", background: "#ffffff" })
        .flatten({ background: "#ffffff" })
        .webp({ quality: 82 })
        .toBuffer();
      writeFileSync(target, output);
      console.log(`ok   ${catalogId}/${p.slug}`);
    } catch (err) {
      failed++;
      console.warn(`fallo ${catalogId}/${p.slug}: ${err.message}`);
    }
  }
}

if (failed) console.warn(`${failed} fotos no se pudieron descargar; la web usará la URL original.`);
