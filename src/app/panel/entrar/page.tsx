"use client";

import { useActionState } from "react";
import { adminLogin, type FormState } from "../../actions";

export default function PanelLogin() {
  const [state, action, pending] = useActionState<FormState, FormData>(adminLogin, {});
  return (
    <form action={action} className="card space-y-4 p-8">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">Panel del distribuidor</h1>
        <p className="text-sm text-muted">Pedidos, clientes, precios y el agente.</p>
      </div>
      <div>
        <label className="label" htmlFor="password">Contraseña</label>
        <input className="input" id="password" name="password" type="password" required autoFocus />
      </div>
      {state.error && <p className="text-sm text-danger">{state.error}</p>}
      <button className="btn h-11 w-full" disabled={pending}>{pending ? "Entrando…" : "Entrar"}</button>
    </form>
  );
}
