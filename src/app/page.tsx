import Link from "next/link";
import { listLines } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function Home() {
  const lines = await listLines();
  return (
    <div className="space-y-12">
      <section className="grid gap-8 md:grid-cols-2 md:items-center">
        <div className="space-y-4">
          <p className="text-sm font-medium text-accent">Solo para dermatólogos y profesionales sanitarios</p>
          <h1 className="text-3xl font-semibold leading-tight md:text-4xl">
            Peelings bioquímicos Larimedical para tu consulta, con pedido en dos minutos
          </h1>
          <p className="text-muted">
            Date de alta, recibe gratis una muestra de la línea que más te interese y haz tus pedidos cuando quieras,
            con descuento por volumen de hasta el 10 %.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/alta" className="btn">Quiero mi muestra gratuita</Link>
            <Link href="/catalogo" className="btn-ghost">Ver catálogo</Link>
          </div>
        </div>
        <ol className="card space-y-3 text-sm">
          <li><strong>1. Alta profesional.</strong> Con tu número de colegiado, en un minuto.</li>
          <li><strong>2. Muestra gratuita.</strong> Te enviamos un vial de 1 ml de la línea que elijas.</li>
          <li><strong>3. Pedido online.</strong> Precios profesionales, descuento por volumen y reposición con un clic.</li>
        </ol>
      </section>
      <section>
        <h2 className="mb-4 text-xl font-semibold">Líneas</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {lines.map((l) => (
            <Link key={l.id} href={`/catalogo?linea=${l.id}`} className="card hover:border-accent">
              <div className="font-medium">{l.name}</div>
              <div className="text-sm text-muted">{l.focus}</div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
