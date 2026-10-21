"use client";

import { useActionState } from "react";
import { requestLogin, type FormState } from "@/app/actions";

export default function EntrarPage() {
  const [state, action, pending] = useActionState<FormState, FormData>(requestLogin, {});
  return (
    <div className="mx-auto max-w-md space-y-6 py-6 text-center">
      <h1 className="display text-5xl leading-none">Entrar</h1>
      <p className="text-muted">Te enviamos un enlace a tu correo. No necesitas contraseña.</p>
      <form action={action} className="card space-y-4 p-8 text-left">
        <label className="label" htmlFor="email">Correo profesional</label>
        <input className="input" id="email" name="email" type="email" required autoComplete="email" />
        <button className="btn h-11 w-full" disabled={pending}>Enviar enlace</button>
        {state.info && <p className="text-sm">{state.info}</p>}
        {state.devLink && (
          <p className="text-xs text-muted">Desarrollo: <a className="link" href={state.devLink}>{state.devLink}</a></p>
        )}
      </form>
    </div>
  );
}
