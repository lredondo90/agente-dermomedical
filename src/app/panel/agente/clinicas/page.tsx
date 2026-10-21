import { requireAdmin } from "@/lib/session";
import { cityFromAddress, isInactive, listProspects, PROSPECT_STATUSES, type Prospect } from "@/lib/agent/prospects";
import { SubmitButton } from "../SubmitButton";
import { discardProspects, importClinics, markLettersSent, prepareLetters, resetProspects, searchClinics } from "../actions";
import { Flash } from "../Flash";
import { SelectAll } from "./SelectAll";
import { PageHeader } from "../../PageHeader";

export const dynamic = "force-dynamic";

const LABEL: Record<string, string> = {
  nuevo: "Nueva",
  "carta-preparada": "Carta preparada",
  "carta-enviada": "Carta enviada",
  registrado: "Registrada",
  descartado: "Descartada",
};

const STATUS_TONE: Record<string, string> = {
  nuevo: "bg-soft text-muted",
  "carta-preparada": "bg-[#e8eefb] text-[#2d4f9e]",
  "carta-enviada": "bg-[#efe8fb] text-[#5b3aa0]",
  registrado: "bg-accent-soft text-accent-strong",
  descartado: "bg-soft text-subtle line-through",
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
    <div className="space-y-8">
      <PageHeader eyebrow="Captación" title="Clínicas y cartas">
        Aquí están las clínicas que todavía no son clientes. Como no nos han dado permiso, la ley no deja escribirles por correo ni WhatsApp:
        el agente les prepara una carta postal con un código QR personal que lleva al alta y a la muestra gratuita. Cuando se registran,
        pasan a «Registrada» y desde entonces el agente ya puede hacer el seguimiento por los canales que acepten.
      </PageHeader>
      <Flash msg={msg} />

      <div className="grid gap-6 lg:grid-cols-2">
        <form action={searchClinics} className="card space-y-3 text-sm">
          <h2 className="section-title">Buscar en Google Maps</h2>
          <input name="q" className="input" placeholder="dermatólogo Valencia" />
          <p className="text-xs leading-relaxed text-subtle">Prueba «dermatólogo», «clínica dermatológica» o «medicina estética» con cada ciudad. Hasta 60 resultados por búsqueda; las cerradas no se añaden. Repetir una búsqueda actualiza la nota de Google.</p>
          <SubmitButton className="btn" pending="Buscando…">Buscar y añadir</SubmitButton>
        </form>
        <form action={importClinics} className="card space-y-3 text-sm">
          <h2 className="section-title">Importar tus contactos (CSV)</h2>
          <input type="file" name="file" accept=".csv,text/csv" className="input file:mr-3 file:rounded-full file:border-0 file:bg-soft file:px-3 file:py-1 file:text-[13px] file:font-medium" />
          <textarea name="csv" rows={3} className="input" placeholder={"clinica;nombre;direccion;provincia;telefono;email\nClínica Dermasol;Dra. Ruiz;C/ Colón 1, 46004 Valencia;Valencia;600112233;"} />
          <p className="text-xs leading-relaxed text-subtle">Columnas: clinica, nombre, direccion, provincia, telefono, web, email, notas. Separador ; o ,. Se puede exportar desde Excel.</p>
          <button className="btn-ghost">Importar</button>
        </form>
      </div>

      <form method="get" className="card space-y-4 text-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="section-title">Filtrar y ordenar</h2>
          {filtered && <a href="/panel/agente/clinicas" className="link">Quitar filtros</a>}
        </div>
        <div>
          <div className="label">Ciudades {cities.length ? `(${cities.length} elegidas)` : "(todas)"}</div>
          <div className="flex max-h-40 flex-wrap gap-1.5 overflow-y-auto">
            {cityList.map(([c, n]) => (
              <label key={c} className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-card-border bg-surface py-1 pr-3 pl-2 transition-colors hover:bg-soft has-[:checked]:border-accent has-[:checked]:bg-accent-soft has-[:checked]:text-accent-strong">
                <input type="checkbox" name="ciudad" value={c} defaultChecked={cities.includes(c)} className="size-3.5" /> {c} <span className="text-xs text-subtle">{n}</span>
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
        <div className="sticky top-2 z-10 flex flex-wrap items-center gap-2 rounded-2xl border border-card-border bg-white/85 px-4 py-2.5 text-sm shadow-lift backdrop-blur-xl">
          <span className="mr-2 font-semibold">{prospects.length} clínicas en {groupList.length} ciudades</span>
          <SelectAll label="Marcar todas" />
          <span className="flex-1" />
          <button formAction={prepareLetters} className="btn h-9 px-4 text-[13px]">Preparar cartas de las marcadas</button>
          <button formAction={markLettersSent} className="btn-ghost h-9 px-4 text-[13px]">Marcar como enviadas</button>
          <button formAction={discardProspects} className="btn-ghost h-9 px-4 text-[13px]">Descartar</button>
          <button formAction={resetProspects} className="btn-ghost h-9 px-4 text-[13px]">Volver a «nueva»</button>
        </div>
        <p className="text-xs text-muted">
          <span className="mr-1 inline-block h-3 w-3 rounded-sm border border-warn/30 bg-warn-soft align-middle" /> Inactiva en Google: sin opiniones o con la última de hace más de un año.
        </p>
        {groupList.map(([city, rows]) => (
          <section key={city} className="card overflow-x-auto p-2">
            <div className="flex flex-wrap items-center gap-3 px-3 pt-2 pb-3">
              <h3 className="text-base font-semibold tracking-tight">{city}</h3>
              <span className="chip bg-soft text-muted">{rows.length} {rows.length === 1 ? "clínica" : "clínicas"}</span>
              <SelectAll group={city} label="Marcar esta ciudad" />
            </div>
            <table className="table min-w-[860px] table-fixed">
              <thead>
                <tr><th className="w-10"></th><th className="w-[20%]">Clínica</th><th className="w-[27%]">Dirección</th><th className="w-[13%]">Teléfono / web</th><th className="w-[15%]">Google</th><th className="w-[13%]">Estado</th><th className="w-24">Código</th></tr>
              </thead>
              <tbody>
                {rows.map((p) => {
                  const inactive = isInactive(p, now);
                  return (
                    <tr key={p.id} className={inactive ? "bg-warn-soft/70 hover:!bg-warn-soft" : undefined}>
                      <td><input type="checkbox" name="id" value={p.id} data-group={city} disabled={p.status === "registrado"} /></td>
                      <td className="font-medium">{p.clinic}{p.name && <div className="text-xs font-normal text-subtle">{p.name}</div>}</td>
                      <td className="text-muted">{p.address ?? <span className="text-subtle">Sin dirección</span>}</td>
                      <td>{p.phone}{p.website && <div className="text-xs"><a href={p.website} className="link" target="_blank" rel="noreferrer">web ↗</a></div>}</td>
                      <td className="whitespace-nowrap">
                        {p.rating_count == null ? (
                          <span className="text-muted">—</span>
                        ) : p.rating_count === 0 ? (
                          "Sin opiniones"
                        ) : (
                          <><span className="text-[#d99a1e]">★</span> <span className="font-medium tabular-nums">{Number(p.rating).toFixed(1).replace(".", ",")}</span> <span className="text-xs text-subtle">({p.rating_count})</span></>
                        )}
                        {p.last_review_at && <div className="text-xs text-muted">Última: {new Date(p.last_review_at).toLocaleDateString("es-ES", { month: "short", year: "numeric" })}</div>}
                        {inactive && <span className="chip mt-1 bg-warn/15 text-warn">Inactiva en Google</span>}
                      </td>
                      <td><span className={`chip ${STATUS_TONE[p.status] ?? "bg-soft text-muted"}`}>{LABEL[p.status] ?? p.status}</span></td>
                      <td className="font-mono text-xs text-subtle">{p.code}</td>
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
