import Link from "next/link";
import { getSession } from "@/lib/session";
import { CartView } from "./CartView";

export const dynamic = "force-dynamic";

export default async function CarritoPage() {
  const session = await getSession();
  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-semibold">Carrito</h1>
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
