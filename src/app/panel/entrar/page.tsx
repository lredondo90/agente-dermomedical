"use client";

import { useActionState } from "react";
import { adminLogin, type FormState } from "../../actions";

export default function PanelLogin() {
  const [state, action, pending] = useActionState<FormState, FormData>(adminLogin, {});
  return (
    <form action={action} className="card mx-auto max-w-sm space-y-3">
      <h1 className="text-xl font-semibold">Panel del distribuidor</h1>
      <label className="label" htmlFor="password">Contraseña</label>
      <input className="input" id="password" name="password" type="password" required />
      {state.error && <p className="text-sm text-red-700">{state.error}</p>}
      <button className="btn" disabled={pending}>Entrar</button>
    </form>
  );
}
