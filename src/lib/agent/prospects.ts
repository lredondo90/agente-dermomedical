import "server-only";
import { randomBytes } from "node:crypto";
import { one, query } from "../db";
import { PROVINCES } from "../provinces";
import { logEvent } from "../store";
import { parseCsv, provinceFromAddress } from "./text";
export { cityFromAddress, isInactive } from "./text";

export type Prospect = {
  id: number;
  clinic: string;
  name: string | null;
  address: string | null;
  province: string | null;
  phone: string | null;
  website: string | null;
  email: string | null;
  source: string;
  status: string;
  code: string;
  customer_id: number | null;
  notes: string | null;
  created_at: string;
  letter_at: string | null;
  rating: string | null;
  rating_count: number | null;
  last_review_at: string | null;
};

export const PROSPECT_STATUSES = ["nuevo", "carta-preparada", "carta-enviada", "registrado", "descartado"] as const;

// Código corto y fácil de teclear para el QR de la carta (sin 0/O ni 1/I).
function newCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from(randomBytes(6), (b) => alphabet[b % alphabet.length]).join("");
}

type NewProspect = Partial<Omit<Prospect, "id" | "code" | "status" | "created_at">> & { clinic: string };

export async function addProspect(p: NewProspect) {
  const row = await one<Prospect>(
    `insert into prospects (clinic, name, address, province, phone, website, email, source, place_id, notes, code)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) on conflict do nothing returning *`,
    [p.clinic.trim(), p.name ?? null, p.address ?? null, p.province ?? null, p.phone ?? null, p.website ?? null, p.email ?? null, p.source ?? "manual", (p as { place_id?: string }).place_id ?? null, p.notes ?? null, newCode()],
  );
  return row;
}

export async function listProspects(status?: string, order: "recientes" | "nota" = "recientes") {
  return query<Prospect>(
    `select * from prospects where ($1::text is null or status = $1)
     order by ${order === "nota" ? "rating_count desc nulls last, rating desc nulls last," : ""} created_at desc, id desc limit 500`,
    [status ?? null],
  );
}

export async function getProspects(ids: number[]) {
  return query<Prospect>("select * from prospects where id = any($1::int[]) order by province, clinic", [ids]);
}

export async function setProspectStatus(ids: number[], status: string) {
  if (!(PROSPECT_STATUSES as readonly string[]).includes(status)) throw new Error("Estado no válido");
  await query(
    `update prospects set status = $2, letter_at = case when $2 = 'carta-enviada' then now() else letter_at end where id = any($1::int[])`,
    [ids, status],
  );
}

export async function prospectStats() {
  return query<{ status: string; n: number }>("select status, count(*)::int as n from prospects group by status");
}

// Cuando alguien se da de alta con el código de su carta, enlazamos la ficha para medir qué cartas funcionan.
export async function linkProspect(code: string, customerId: number) {
  const p = await one<Prospect>(
    `update prospects set status = 'registrado', customer_id = $2 where code = $1 and customer_id is null returning *`,
    [code.trim().toUpperCase(), customerId],
  );
  if (p) {
    await query("update customers set prospect_code = $2 where id = $1", [customerId, p.code]);
    await logEvent(customerId, "alta-desde-carta", { prospectId: p.id, code: p.code });
  }
  return p;
}

type Place = {
  id: string;
  displayName?: { text: string };
  formattedAddress?: string;
  nationalPhoneNumber?: string;
  websiteUri?: string;
  businessStatus?: string;
  rating?: number;
  userRatingCount?: number;
  reviews?: { publishTime?: string }[];
};

// Guarda una clínica de Google Maps o, si ya estaba, actualiza su nota y su última opinión.
async function upsertPlace(pl: Place) {
  // Google devuelve hasta 5 opiniones (las más relevantes): tomamos la más reciente de ellas.
  const lastReview = (pl.reviews ?? []).map((r) => r.publishTime).filter(Boolean).sort().at(-1) ?? null;
  return one<{ inserted: boolean }>(
    `insert into prospects (clinic, address, province, phone, website, source, place_id, code, rating, rating_count, last_review_at)
     values ($1, $2, $3, $4, $5, 'google-maps', $6, $7, $8, $9, $10)
     on conflict (place_id) do update set rating = excluded.rating, rating_count = excluded.rating_count,
       last_review_at = excluded.last_review_at, phone = coalesce(excluded.phone, prospects.phone),
       website = coalesce(excluded.website, prospects.website)
     returning (xmax = 0) as inserted`,
    [
      pl.displayName?.text ?? "Sin nombre",
      pl.formattedAddress ?? null,
      provinceFromAddress(pl.formattedAddress),
      pl.nationalPhoneNumber ?? null,
      pl.websiteUri ?? null,
      pl.id,
      newCode(),
      pl.rating ?? null,
      pl.userRatingCount ?? 0,
      lastReview,
    ],
  );
}

// Búsqueda de clínicas en Google Maps (Places API, Text Search). Necesita GOOGLE_MAPS_API_KEY.
// Repetir una búsqueda no duplica clínicas: actualiza su nota y su última opinión.
export async function searchPlaces(textQuery: string) {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) throw new Error("Falta GOOGLE_MAPS_API_KEY para buscar en Google Maps");
  const found = { added: 0, existing: 0, closed: 0 };
  let pageToken: string | undefined;
  for (let page = 0; page < 3; page++) {
    const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask":
          "places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.websiteUri,places.businessStatus,places.rating,places.userRatingCount,places.reviews.publishTime,nextPageToken",
      },
      body: JSON.stringify({ textQuery, languageCode: "es", regionCode: "ES", pageSize: 20, pageToken }),
    });
    if (!res.ok) throw new Error(`Google Maps respondió ${res.status}: ${(await res.text()).slice(0, 300)}`);
    const data = (await res.json()) as { places?: Place[]; nextPageToken?: string };
    for (const pl of data.places ?? []) {
      if (pl.businessStatus && pl.businessStatus !== "OPERATIONAL") {
        // Cerrada: no la añadimos y, si ya estaba sin carta, la descartamos.
        await query(
          `update prospects set status = 'descartado', notes = 'Cerrada según Google Maps' where place_id = $1 and status = 'nuevo'`,
          [pl.id],
        );
        found.closed++;
        continue;
      }
      const row = await upsertPlace(pl);
      if (row?.inserted) found.added++;
      else found.existing++;
    }
    pageToken = data.nextPageToken;
    if (!pageToken) break;
  }
  return found;
}

export async function importCsv(text: string) {
  const rows = parseCsv(text);
  let added = 0;
  let skipped = 0;
  for (const r of rows) {
    const clinic = r.clinica || r.clinic || r.empresa || r.nombre;
    if (!clinic) {
      skipped++;
      continue;
    }
    const address = r.direccion || r.address || null;
    const province = (r.provincia && PROVINCES.find((p) => p.toLowerCase() === r.provincia.toLowerCase())) || provinceFromAddress(address);
    const row = await addProspect({
      clinic,
      name: r.clinica || r.clinic ? r.nombre || r.contacto || null : r.contacto || null,
      address,
      province,
      phone: r.telefono || r.movil || null,
      website: r.web || null,
      email: r.email || r.correo || null,
      notes: r.notas || null,
      source: "csv",
    });
    if (row) added++;
    else skipped++;
  }
  return { added, skipped };
}
