import Link from "next/link";
import { getSession } from "@/lib/session";
import { CartView } from "./CartView";

export const dynamic = "force-dynamic";

export default async function CarritoPage() {
  const session = await getSession();
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-2xl font-semibold">Carrito</h1>
      {session?.kind === "customer" ? (
        <CartView />
      ) : (
        <p className="text-muted">
          <Link href="/entrar" className="underline">Entra</Link> o <Link href="/alta" className="underline">date de alta</Link> para hacer pedidos.
        </p>
      )}
    </div>
  );
}
