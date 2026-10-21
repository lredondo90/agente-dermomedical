import QRCode from "qrcode";
import { requireAdmin } from "@/lib/session";
import { brand, company } from "@/lib/company";
import { getProspects } from "@/lib/agent/prospects";

export const dynamic = "force-dynamic";

// Cartas listas para imprimir (una por página) o para subir a un servicio de envío postal.
export default async function CartasPage({ searchParams }: { searchParams: Promise<{ ids?: string }> }) {
  await requireAdmin();
  const ids = (await searchParams).ids?.split(",").map(Number).filter(Number.isInteger) ?? [];
  const prospects = await getProspects(ids);
  const letters = await Promise.all(
    prospects.map(async (p) => {
      const url = `${company.siteUrl}/alta?origen=carta&c=${p.code}`;
      return { p, url, qr: await QRCode.toString(url, { type: "svg", margin: 0, errorCorrectionLevel: "M" }) };
    }),
  );
  const date = new Date().toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div>
      <style>{`
        @media print {
          header, footer, nav, aside, .no-print { display: none !important; }
          body { background: white; }
          .letter { break-after: page; border: 0 !important; margin: 0 !important; padding: 0 !important; }
        }
        @page { size: A4; margin: 20mm; }
      `}</style>
      <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">{letters.length} cartas. Imprímelas con Ctrl+P (o guárdalas en PDF para un servicio de envío postal) y después márcalas como enviadas.</p>
        <a href="/panel/agente/clinicas?estado=carta-preparada" className="btn-ghost">← Volver</a>
      </div>
      {letters.map(({ p, url, qr }) => (
        <article key={p.id} className="letter mx-auto mb-8 max-w-[210mm] space-y-6 rounded-2xl border border-card-border bg-white p-12 shadow-card text-[15px] leading-relaxed">
          <div className="flex justify-between gap-8 text-sm">
            <div>
              <b>{company.name}</b><br />{company.address}<br />{company.email}
            </div>
            <div className="text-right">
              <b>{p.name ?? "A la atención de dirección médica"}</b><br />{p.clinic}<br />
              <span className="whitespace-pre-line">{p.address?.replace(/,\s*España$/, "").replace(/,\s*/g, "\n")}</span>
            </div>
          </div>
          <p className="text-right text-sm">{date}</p>
          <p>Estimado/a doctor/a:</p>
          <p>
            Somos {company.name}, distribuidor en España de <b>{brand.name}</b>, peelings y cosmética de uso profesional para consultas de dermatología
            y medicina estética. Nos gustaría que pudiera probarlo en su consulta sin compromiso.
          </p>
          <p>
            Si le interesa, escanee este código o entre en la dirección de abajo: en dos minutos se da de alta como profesional y le enviamos
            una <b>muestra gratuita</b>. Después podrá ver los precios profesionales y hacer pedidos online cuando quiera.
          </p>
          <div className="flex items-center gap-6">
            <div className="h-32 w-32 shrink-0" dangerouslySetInnerHTML={{ __html: qr }} />
            <div className="text-sm">
              <div className="break-all font-mono">{url}</div>
              <div className="mt-1 text-muted">Su código: <b className="font-mono">{p.code}</b></div>
            </div>
          </div>
          <p>Un saludo cordial,<br />{company.name}</p>
          <p className="border-t border-card-border pt-4 text-[11px] leading-snug text-muted">
            Responsable: {company.name} ({company.taxId}), {company.address}. Hemos obtenido el nombre y la dirección de su consulta
            {p.source === "google-maps" ? " de fuentes públicas (Google Maps)" : " de nuestra agenda de contactos profesionales"} y los tratamos por interés legítimo para presentarle productos profesionales. No volveremos a
            escribirle si no se da de alta. Puede oponerse, pedir la supresión de sus datos o ejercer sus demás derechos en {company.email}. Más información en
            {" "}{company.siteUrl}/privacidad.
          </p>
        </article>
      ))}
    </div>
  );
}
