// Funciones puras del agente (sin base de datos), para poder probarlas con tests.
import { PROVINCES } from "../provinces";

// Devuelve la primera frase prohibida que aparece en el texto, si hay alguna.
export function findForbidden(text: string, forbidden: string[]): string | undefined {
  const t = text.toLowerCase();
  return forbidden.find((f) => f.trim() && new RegExp(`(^|\\W)${escape(f.trim().toLowerCase())}(\\W|$)`, "u").test(t));
}

function escape(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Quita el texto citado de la respuesta ("> ..." y lo que va tras "El ... escribió:" / "On ... wrote:").
export function stripQuoted(text: string) {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const cut = lines.findIndex((l) => /^(El|On) .+(escribió|wrote):\s*$/.test(l.trim()) || /^-{2,}\s*(Mensaje original|Original Message)/i.test(l.trim()));
  return (cut >= 0 ? lines.slice(0, cut) : lines)
    .filter((l) => !l.startsWith(">"))
    .join("\n")
    .trim()
    .slice(0, 5000);
}

// Móvil español a formato internacional sin "+": 600 11 22 33 -> 34600112233.
export function normalizePhone(phone: string) {
  const digits = phone.replace(/\D/g, "").replace(/^00/, "");
  return digits.length === 9 ? `34${digits}` : digits;
}

// Provincia a partir de una dirección de Google ("..., 46001 Valencia, España") o del código postal.
const CP_PROVINCE: Record<string, string> = {
  "01": "Álava", "02": "Albacete", "03": "Alicante", "04": "Almería", "05": "Ávila", "06": "Badajoz", "07": "Illes Balears",
  "08": "Barcelona", "09": "Burgos", "10": "Cáceres", "11": "Cádiz", "12": "Castellón", "13": "Ciudad Real", "14": "Córdoba",
  "15": "A Coruña", "16": "Cuenca", "17": "Girona", "18": "Granada", "19": "Guadalajara", "20": "Gipuzkoa", "21": "Huelva",
  "22": "Huesca", "23": "Jaén", "24": "León", "25": "Lleida", "26": "La Rioja", "27": "Lugo", "28": "Madrid", "29": "Málaga",
  "30": "Murcia", "31": "Navarra", "32": "Ourense", "33": "Asturias", "34": "Palencia", "35": "Las Palmas", "36": "Pontevedra",
  "37": "Salamanca", "38": "Santa Cruz de Tenerife", "39": "Cantabria", "40": "Segovia", "41": "Sevilla", "42": "Soria",
  "43": "Tarragona", "44": "Teruel", "45": "Toledo", "46": "Valencia", "47": "Valladolid", "48": "Bizkaia", "49": "Zamora",
  "50": "Zaragoza", "51": "Ceuta", "52": "Melilla",
};

export function provinceFromAddress(address: string | null | undefined): string | null {
  if (!address) return null;
  const cp = address.match(/\b(\d{2})\d{3}\b/);
  const fromCp = cp ? CP_PROVINCE[cp[1]] : undefined;
  if (fromCp && PROVINCES.includes(fromCp)) return fromCp;
  const lower = address.toLowerCase();
  return PROVINCES.find((p) => lower.includes(p.toLowerCase())) ?? fromCp ?? null;
}

// CSV con cabecera. Acepta ; o , como separador y comillas dobles. Columnas reconocidas (sin importar mayúsculas
// ni tildes): clinica, nombre, direccion, provincia, telefono, web, email, notas.
export function parseCsv(text: string): Record<string, string>[] {
  const firstLine = text.split(/\r?\n/, 1)[0] ?? "";
  const sep = (firstLine.match(/;/g)?.length ?? 0) >= (firstLine.match(/,/g)?.length ?? 0) ? ";" : ",";
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  const endCell = () => {
    row.push(cell);
    cell = "";
  };
  const endRow = () => {
    endCell();
    rows.push(row);
    row = [];
  };
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === sep) endCell();
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      endRow();
    } else cell += ch;
  }
  if (cell || row.length) endRow();
  const norm = (s: string) => s.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const [header, ...body] = rows.filter((r) => r.some((c) => c.trim()));
  if (!header) return [];
  const keys = header.map(norm);
  return body.map((r) => Object.fromEntries(keys.map((k, i) => [k, (r[i] ?? "").trim()])));
}

// Sin actividad: con ficha de Google pero sin opiniones, o con la última hace más de un año.
export function isInactive(p: { source: string; rating_count: number | null; last_review_at: string | null }, now = Date.now()) {
  if (p.source !== "google-maps" || p.rating_count == null) return false;
  if (p.rating_count === 0 || !p.last_review_at) return true;
  return now - new Date(p.last_review_at).getTime() > 365 * 24 * 3600 * 1000;
}

// Ciudad a partir de una dirección española ("C. de Colón, 1, 46004 Valencia, España" -> "Valencia").
export function cityFromAddress(address: string | null | undefined): string | null {
  if (!address) return null;
  const m = address.match(/\b\d{5}\s+([^,]+)/);
  return m ? m[1].trim() : null;
}
