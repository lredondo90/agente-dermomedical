import { requireAdmin } from "@/lib/session";
import { listProspects, PROSPECT_STATUSES } from "@/lib/agent/prospects";
import { discardProspects, importClinics, markLettersSent, prepareLetters, resetProspects, searchClinics } from "../actions";
import { PanelNav } from "../../PanelNav";
import { Flash } from "../Flash";

export const dynamic = "force-dynamic";

const LABEL: Record<string, string> = {
  nuevo: "Nueva",
  "carta-preparada": "Carta preparada",
  "carta-enviada": "Carta enviada",
  registrado: "Registrada",
  descartado: "Descartada",
};

export default async function ClinicasPage({ searchParams }: { searchParams: Promise<{ msg?: string; estado?: string }> }) {
  await requireAdmin();
  const { msg, estado } = await searchParams;
  const prospects = await listProspects(estado || undefined);

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
          <p className="text-muted">Prueba «dermatólogo», «clínica dermatológica» o «medicina estética» con cada ciudad. Hasta 60 resultados por búsqueda.</p>
          <button className="btn">Buscar y añadir</button>
        </form>
        <form action={importClinics} className="card space-y-3 text-sm">
          <h2 className="text-lg font-semibold">Importar tus contactos (CSV)</h2>
          <input type="file" name="file" accept=".csv,text/csv" className="input" />
          <textarea name="csv" rows={3} className="input" placeholder={"clinica;nombre;direccion;provincia;telefono;email\nClínica Dermasol;Dra. Ruiz;C/ Colón 1, 46004 Valencia;Valencia;600112233;"} />
          <p className="text-muted">Columnas: clinica, nombre, direccion, provincia, telefono, web, email, notas. Separador ; o ,. Se puede exportar desde Excel.</p>
          <button className="btn-ghost">Importar</button>
        </form>
      </div>

      <nav className="flex flex-wrap gap-2 text-sm">
        <a href="/panel/agente/clinicas" className={!estado ? "btn-soft" : "btn-ghost"}>Todas</a>
        {PROSPECT_STATUSES.map((s) => (
          <a key={s} href={`/panel/agente/clinicas?estado=${s}`} className={estado === s ? "btn-soft" : "btn-ghost"}>{LABEL[s]}</a>
        ))}
      </nav>

      <form className="space-y-3">
        <div className="flex flex-wrap gap-2 text-sm">
          <button formAction={prepareLetters} className="btn">Preparar cartas de las marcadas</button>
          <button formAction={markLettersSent} className="btn-ghost">Marcar como enviadas</button>
          <button formAction={discardProspects} className="btn-ghost">Descartar</button>
          <button formAction={resetProspects} className="btn-ghost">Volver a «nueva»</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-muted">
              <tr><th className="py-2"></th><th>Clínica</th><th>Dirección</th><th>Teléfono / web</th><th>Origen</th><th>Estado</th><th>Código</th></tr>
            </thead>
            <tbody className="divide-y divide-line">
              {prospects.map((p) => (
                <tr key={p.id}>
                  <td className="py-2 pr-2"><input type="checkbox" name="id" value={p.id} disabled={p.status === "registrado"} /></td>
                  <td>{p.clinic}{p.name && <div className="text-xs text-muted">{p.name}</div>}</td>
                  <td className="max-w-xs">{p.address ?? <span className="text-muted">Sin dirección</span>}<div className="text-xs text-muted">{p.province}</div></td>
                  <td>{p.phone}{p.website && <div className="text-xs"><a href={p.website} className="underline" target="_blank" rel="noreferrer">web</a></div>}</td>
                  <td>{p.source}</td>
                  <td>{LABEL[p.status] ?? p.status}</td>
                  <td className="font-mono text-xs">{p.code}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {prospects.length === 0 && <p className="py-4 text-sm text-muted">No hay clínicas en esta lista.</p>}
        </div>
      </form>
    </div>
  );
}
