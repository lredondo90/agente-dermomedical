"use client";

import Link from "next/link";
import { useActionState } from "react";
import { register, type FormState } from "@/app/actions";
import { PROVINCES } from "@/lib/provinces";

export function RegisterForm({ lines, source, brandName }: { lines: { id: string; name: string }[]; source?: string; brandName: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(register, {});
  return (
    <form action={action} className="card grid gap-5 p-6 sm:grid-cols-2 sm:p-8">
      <input type="hidden" name="source" value={source ?? "alta-web"} />
      <div>
        <label className="label" htmlFor="name">Nombre y apellidos</label>
        <input className="input" id="name" name="name" required autoComplete="name" />
      </div>
      <div>
        <label className="label" htmlFor="licenseNumber">Nº de colegiado</label>
        <input className="input" id="licenseNumber" name="licenseNumber" required />
      </div>
      <div>
        <label className="label" htmlFor="clinic">Clínica o consulta</label>
        <input className="input" id="clinic" name="clinic" required autoComplete="organization" />
      </div>
      <div>
        <label className="label" htmlFor="province">Provincia</label>
        <select className="input" id="province" name="province" required defaultValue="">
          <option value="" disabled>Elige…</option>
          {PROVINCES.map((p) => <option key={p}>{p}</option>)}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="email">Correo profesional</label>
        <input className="input" id="email" name="email" type="email" required autoComplete="email" />
      </div>
      <div>
        <label className="label" htmlFor="phone">Móvil (opcional)</label>
        <input className="input" id="phone" name="phone" type="tel" autoComplete="tel" />
      </div>
      <div>
        <label className="label" htmlFor="taxId">NIF o CIF para facturar (opcional)</label>
        <input className="input" id="taxId" name="taxId" />
      </div>
      <div>
        <label className="label" htmlFor="interestLineId">Línea que más te interesa</label>
        <select className="input" id="interestLineId" name="interestLineId" defaultValue="">
          <option value="">Sin preferencia</option>
          {lines.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
      </div>
      <div className="sm:col-span-2">
        <label className="label" htmlFor="address">Dirección de envío</label>
        <input className="input" id="address" name="address" autoComplete="street-address" />
      </div>

      <fieldset className="space-y-3 rounded-2xl bg-soft p-5 text-sm text-muted sm:col-span-2">
        <label className="flex items-start gap-2.5 [&>input]:mt-0.5"><input type="checkbox" name="wantsSample" defaultChecked /> Quiero recibir la muestra gratuita.</label>
        <label className="flex items-start gap-2.5 [&>input]:mt-0.5"><input type="checkbox" name="professional" required /> Declaro que soy profesional sanitario colegiado.</label>
        <label className="flex items-start gap-2.5 [&>input]:mt-0.5">
          <input type="checkbox" name="consentEmail" />
          Acepto recibir por correo electrónico información comercial y profesional sobre productos {brandName}.
        </label>
        <label className="flex items-start gap-2.5 [&>input]:mt-0.5">
          <input type="checkbox" name="consentWhatsapp" />
          Acepto recibir mensajes por WhatsApp sobre mis pedidos y novedades de {brandName}.
        </label>
        <label className="flex items-start gap-2.5 [&>input]:mt-0.5">
          <input type="checkbox" name="privacy" required />
          <span>He leído la <Link href="/privacidad" className="link" target="_blank">política de privacidad</Link>. Puedo darme de baja en cualquier momento.</span>
        </label>
      </fieldset>

      {state.error && <p className="text-sm text-danger sm:col-span-2">{state.error}</p>}
      <div className="sm:col-span-2">
        <button className="btn h-12 w-full px-6 text-[15px] sm:w-auto" disabled={pending}>{pending ? "Enviando…" : "Darme de alta"}</button>
      </div>
    </form>
  );
}
