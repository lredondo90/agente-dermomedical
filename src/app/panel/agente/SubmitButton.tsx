"use client";

import { useFormStatus } from "react-dom";

// Botón que se desactiva mientras se envía el formulario, para que un doble clic no lo envíe dos veces.
export function SubmitButton({ children, pending, className }: { children: React.ReactNode; pending: string; className: string }) {
  const status = useFormStatus();
  return (
    <button className={className} disabled={status.pending}>
      {status.pending ? pending : children}
    </button>
  );
}
