import { test } from "node:test";
import assert from "node:assert/strict";
import { findForbidden, normalizePhone, parseCsv, provinceFromAddress, stripQuoted } from "../src/lib/agent/text";

test("frases prohibidas: palabra completa, sin distinguir mayúsculas", () => {
  assert.equal(findForbidden("Este peeling CURA el acné", ["cura"]), "cura");
  assert.equal(findForbidden("Seguro que le gusta la textura", ["cura"]), undefined);
  assert.equal(findForbidden("Resultados 100% seguro", ["100% seguro"]), "100% seguro");
});

test("teléfonos españoles a formato internacional", () => {
  assert.equal(normalizePhone("600 11 22 33"), "34600112233");
  assert.equal(normalizePhone("+34 600-112-233"), "34600112233");
  assert.equal(normalizePhone("0034600112233"), "34600112233");
});

test("provincia desde la dirección de Google", () => {
  assert.equal(provinceFromAddress("C. de Colón, 1, 46004 Valencia, España"), "Valencia");
  assert.equal(provinceFromAddress("Av. Diagonal 100, 08019 Barcelona, España"), "Barcelona");
  assert.equal(provinceFromAddress(null), null);
});

test("CSV con punto y coma, comillas y tildes en la cabecera", () => {
  const rows = parseCsv('Clínica;Nombre;Dirección\n"Derma; Sol";Dra. Ruiz;"C/ Colón 1, 46004 Valencia"\n\nOtra;;\n');
  assert.equal(rows.length, 2);
  assert.deepEqual(rows[0], { clinica: "Derma; Sol", nombre: "Dra. Ruiz", direccion: "C/ Colón 1, 46004 Valencia" });
  assert.equal(rows[1].clinica, "Otra");
});

test("quita el texto citado de un correo de respuesta", () => {
  const text = "¿Tienen stock del 30%?\nGracias\n\nEl mar, 21 oct 2026 a las 10:00, Agente <a@b.es> escribió:\n> Hola doctora...";
  assert.equal(stripQuoted(text), "¿Tienen stock del 30%?\nGracias");
});
