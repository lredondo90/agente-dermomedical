import { requireCustomer } from "@/lib/session";
import { getCustomer } from "@/lib/store";
import { updateConsents } from "@/app/actions";

export const dynamic = "force-dynamic";

export default async function CuentaPage() {
  const c = (await getCustomer(await requireCustomer()))!;
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="display text-5xl leading-none">Mi cuenta</h1>
      <div className="card text-sm">
        <div className="font-medium">{c.name}</div>
        <div>{c.clinic} · {c.province}</div>
        <div>{c.email}{c.phone && ` · ${c.phone}`}</div>
      </div>
      <form action={updateConsents} className="card space-y-2 text-sm">
        <h2 className="section-title">Comunicaciones</h2>
        <label className="flex items-center gap-2.5"><input type="checkbox" name="consentEmail" defaultChecked={c.consent_email} /> Información comercial por correo</label>
        <label className="flex items-center gap-2.5"><input type="checkbox" name="consentWhatsapp" defaultChecked={c.consent_whatsapp} /> Mensajes por WhatsApp</label>
        <p className="text-muted">Desmarca para darte de baja. El cambio se aplica al momento.</p>
        <button className="btn">Guardar</button>
      </form>
    </div>
  );
}
