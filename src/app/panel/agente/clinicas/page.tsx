import { requireAdmin } from "@/lib/session";
import { cityFromAddress, isInactive, listProspects, PROSPECT_STATUSES, type Prospect } from "@/lib/agent/prospects";
import { SubmitButton } from "../SubmitButton";
import { discardProspects, importClinics, markLettersSent, prepareLetters, resetProspects, searchClinics } from "../actions";
import { PanelNav } from "../../PanelNav";
import { Flash } from "../Flash";
import { SelectAll } from "./SelectAll";

export const dynamic = "force-dynamic";

const LABEL: Record<string, string> = {
  nuevo: "Nueva",
  "carta-preparada": "Carta preparada",
  "carta-enviada": "Carta enviada",
  registrado: "Registrada",
  descartado: "Descartada",
};

const ORDERS = {
  nota: "Nota de Google (mejor primero)",
  opiniones: "Nº de opiniones (más primero)",
  recientes: "Añadidas más recientes",
  nombre: "Nombre de la clínica",
} as const;
type Order = keyof typeof ORDERS;

const MIN_RATINGS = ["3", "3.5", "4", "4.5"];

type Params = { msg?: string; estado?: string; orden?: string; ciudad?: string | string[]; nota?: string; actividad?: string };

const cityOf = (p: Prospect) => cityFromAddress(p.address) ?? p.province ?? "Sin ciudad";

function compare(order: Order) {
  return (a: Prospect, b: Prospect) => {
    if (order === "nota") return (Number(b.rating ?? -1) - Number(a.rating ?? -1)) || ((b.rating_count ?? -1) - (a.rating_count ?? -1));
    if (order === "opiniones") return (b.rating_count ?? -1) - (a.rating_count ?? -1);
    if (order === "nombre") return a.clinic.localeCompare(b.clinic, "es");
    return b.id - a.id;
  };
}

export default async function ClinicasPage({ searchParams }: { searchParams: Promise<Params> }) {
  await requireAdmin();
  const params = await searchParams;
  const { msg, estado, nota, actividad } = params;
  const order: Order = params.orden && params.orden in ORDERS ? (params.orden as Order) : "nota";
  const cities = [params.ciudad ?? []].flat().filter(Boolean);
  const now = Date.now();

  const all = await listProspects(estado || undefined);
  const cityCounts = new Map<string, number>();
  for (const p of all) cityCounts.set(cityOf(p), (cityCounts.get(cityOf(p)) ?? 0) + 1);
  const cityList = [...cityCounts].sort((a, b) => a[0].localeCompare(b[0], "es"));

  const prospects = all
    .filter((p) => !cities.length || cities.includes(cityOf(p)))
    .filter((p) => !nota || Number(p.rating ?? 0) >= Number(nota))
    .filter((p) => actividad !== "activas" || !isInactive(p, now))
    .filter((p) => actividad !== "inactivas" || isInactive(p, now))
    .sort(compare(order));
  const groups = new Map<string, Prospect[]>();
  for (const p of prospects) groups.set(cityOf(p), [...(groups.get(cityOf(p)) ?? []), p]);
  const groupList = [...groups].sort((a, b) => a[0].localeCompare(b[0], "es"));
  const filtered = cities.length > 0 || !!nota || !!actividad || !!estado;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold">Clínicas y cartas</h1>
      <PanelNav />
      <Flash msg={msg} />
      <p className="max-w-3xl text-sm text-muted">
        Aquí están las clínicas que todavía no son clientes. Como no nos han dado permiso, la ley no deja escribirles por correo ni WhatsApp:
        el agente les prepara una carta postal con un código QR personal que lleva al alta y a la muestra gratuita. Cuando se registran,
        pasan a «Registrada» y desde entonces el agente ya puede hacer el seguimiento por los canales que acepten.
      </p>

      <div className="grid gap-6 lg:grid-cols-2">
        <form action={searchClinics} className="card space-y-3 text-sm">
          <h2 className="text-lg font-semibold">Buscar en Google Maps</h2>
          <input name="q" className="input" placeholder="dermatólogo Valencia" />
          <p className="text-muted">Prueba «dermatólogo», «clínica dermatológica» o «medicina estética» con cada ciudad. Hasta 60 resultados por búsqueda; las cerradas no se añaden. Repetir una búsqueda actualiza la nota de Google.</p>
          <SubmitButton className="btn" pending="Buscando…">Buscar y añadir</SubmitButton>
        </form>
        <form action={importClinics} className="card space-y-3 text-sm">
          <h2 className="text-lg font-semibold">Importar tus contactos (CSV)</h2>
          <input type="file" name="file" accept=".csv,text/csv" className="input" />
          <textarea name="csv" rows={3} className="input" placeholder={"clinica;nombre;direccion;provincia;telefono;email\nClínica Dermasol;Dra. Ruiz;C/ Colón 1, 46004 Valencia;Valencia;600112233;"} />
          <p className="text-muted">Columnas: clinica, nombre, direccion, provincia, telefono, web, email, notas. Separador ; o ,. Se puede exportar desde Excel.</p>
          <button className="btn-ghost">Importar</button>
        </form>
      </div>

      <form method="get" className="card space-y-4 text-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">Filtrar y ordenar</h2>
          {filtered && <a href="/panel/agente/clinicas" className="underline">Quitar filtros</a>}
        </div>
        <div>
          <div className="label">Ciudades {cities.length ? `(${cities.length} elegidas)` : "(todas)"}</div>
          <div className="flex max-h-40 flex-wrap gap-x-4 gap-y-1 overflow-y-auto">
            {cityList.map(([c, n]) => (
              <label key={c} className="inline-flex items-center gap-1.5">
                <input type="checkbox" name="ciudad" value={c} defaultChecked={cities.includes(c)} /> {c} <span className="text-muted">({n})</span>
              </label>
            ))}
            {cityList.length === 0 && <span className="text-muted">Aún no hay clínicas.</span>}
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-4">
          <label>
            <span className="label">Ordenar por</span>
            <select name="orden" defaultValue={order} className="input">
              {Object.entries(ORDERS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </label>
          <label>
            <span className="label">Nota mínima</span>
            <select name="nota" defaultValue={nota ?? ""} className="input">
              <option value="">Cualquiera</option>
              {MIN_RATINGS.map((r) => <option key={r} value={r}>★ {r.replace(".", ",")} o más</option>)}
            </select>
          </label>
          <label>
            <span className="label">Actividad en Google</span>
            <select name="actividad" defaultValue={actividad ?? ""} className="input">
              <option value="">Todas</option>
              <option value="activas">Solo activas</option>
              <option value="inactivas">Solo inactivas</option>
            </select>
          </label>
          <label>
            <span className="label">Estado</span>
            <select name="estado" defaultValue={estado ?? ""} className="input">
              <option value="">Todos</option>
              {PROSPECT_STATUSES.map((st) => <option key={st} value={st}>{LABEL[st]}</option>)}
            </select>
          </label>
        </div>
        <button className="btn">Aplicar</button>
      </form>

      <form className="space-y-4">
        <div className="sticky top-0 z-10 flex flex-wrap items-center gap-2 border-b border-card-border bg-white py-3 text-sm">
          <span className="mr-2 font-semibold">{prospects.length} clínicas en {groupList.length} ciudades</span>
          <SelectAll label="Marcar todas" />
          <span className="flex-1" />
          <button formAction={prepareLetters} className="btn">Preparar cartas de las marcadas</button>
          <button formAction={markLettersSent} className="btn-ghost">Marcar como enviadas</button>
          <button formAction={discardProspects} className="btn-ghost">Descartar</button>
          <button formAction={resetProspects} className="btn-ghost">Volver a «nueva»</button>
        </div>
        <p className="text-xs text-muted">
          <span className="mr-1 inline-block h-3 w-3 rounded-sm border border-amber-300 bg-amber-50 align-middle" /> Inactiva en Google: sin opiniones o con la última de hace más de un año.
        </p>
        {groupList.map(([city, rows]) => (
          <section key={city} className="overflow-x-auto">
            <div className="flex flex-wrap items-center gap-3 bg-fog px-3 py-2">
              <h3 className="font-semibold">{city}</h3>
              <span className="text-sm text-muted">{rows.length} {rows.length === 1 ? "clínica" : "clínicas"}</span>
              <SelectAll group={city} label="Marcar esta ciudad" />
            </div>
            <table className="w-full min-w-[860px] table-fixed text-sm">
              <thead className="text-left text-muted">
                <tr><th className="w-8 py-2"></th><th className="w-[22%]">Clínica</th><th className="w-[30%]">Dirección</th><th className="w-[13%]">Teléfono / web</th><th className="w-[17%]">Google</th><th className="w-[10%]">Estado</th><th>Código</th></tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((p) => {
                  const inactive = isInactive(p, now);
                  return (
                    <tr key={p.id} className={inactive ? "bg-amber-50" : undefined}>
                      <td className="py-2 pl-2 pr-2"><input type="checkbox" name="id" value={p.id} data-group={city} disabled={p.status === "registrado"} /></td>
                      <td className="pr-3">{p.clinic}{p.name && <div className="text-xs text-muted">{p.name}</div>}</td>
                      <td className="pr-3">{p.address ?? <span className="text-muted">Sin dirección</span>}</td>
                      <td>{p.phone}{p.website && <div className="text-xs"><a href={p.website} className="underline" target="_blank" rel="noreferrer">web</a></div>}</td>
                      <td className="whitespace-nowrap">
                        {p.rating_count == null ? (
                          <span className="text-muted">—</span>
                        ) : p.rating_count === 0 ? (
                          "Sin opiniones"
                        ) : (
                          <>★ {Number(p.rating).toFixed(1).replace(".", ",")} <span className="text-xs text-muted">({p.rating_count})</span></>
                        )}
                        {p.last_review_at && <div className="text-xs text-muted">Última: {new Date(p.last_review_at).toLocaleDateString("es-ES", { month: "short", year: "numeric" })}</div>}
                        {inactive && <span className="mt-1 inline-block rounded-full bg-amber-100 px-2 text-xs text-amber-900">Inactiva en Google</span>}
                      </td>
                      <td>{LABEL[p.status] ?? p.status}</td>
                      <td className="font-mono text-xs">{p.code}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>
        ))}
        {prospects.length === 0 && <p className="py-4 text-sm text-muted">No hay clínicas con estos filtros.</p>}
      </form>
    </div>
  );
}
