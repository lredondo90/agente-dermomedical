import Link from "next/link";
import { brand } from "@/lib/company";
import { listLines } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function Home() {
  const lines = await listLines();
  return (
    <div className="space-y-16">
      <section className="tile px-5 py-12 text-center md:px-8 md:py-24">
        <div className="mx-auto max-w-2xl space-y-5">
          <p className="eyebrow">Solo para dermatólogos y profesionales sanitarios</p>
          <h1 className="text-3xl font-semibold leading-[1.08] sm:text-4xl md:text-5xl">
            {brand.headline}
          </h1>
          <p className="text-muted">
            Date de alta, recibe gratis una muestra de la línea que más te interese y haz tus pedidos cuando quieras,
            con descuento por volumen de hasta el 10 %.
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Link href="/alta" className="btn h-12 px-8 text-base">Quiero mi muestra gratuita</Link>
            <Link href="/catalogo" className="btn-ghost h-12 px-8 text-base">Ver catálogo</Link>
          </div>
        </div>
      </section>
      <section className="grid gap-8 text-center sm:grid-cols-3">
        {[
          ["Alta profesional", "Con tu número de colegiado, en un minuto."],
          ["Muestra gratuita", "Te enviamos un vial de 1 ml de la línea que elijas."],
          ["Pedido online", "Precios profesionales, descuento por volumen y reposición con un clic."],
        ].map(([title, text], i) => (
          <div key={title} className="space-y-1">
            <div className="text-sm text-subtle">Paso {i + 1}</div>
            <div className="text-xl font-semibold">{title}</div>
            <p className="text-sm text-muted">{text}</p>
          </div>
        ))}
      </section>
      <section>
        <h2 className="mb-8 text-center text-3xl font-semibold md:text-4xl">Líneas</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {lines.map((l) => (
            <Link key={l.id} href={`/catalogo?linea=${l.id}`} className="tile group flex flex-col items-center gap-2 text-center">
              <div className="text-sm text-subtle">{l.focus}</div>
              <div className="text-2xl font-semibold tracking-tight">{l.name}</div>
              <span className="text-sm text-[#1890ff] group-hover:underline">Ver productos ›</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
