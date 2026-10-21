import { brand } from "@/lib/company";
import { listLines } from "@/lib/store";
import { RegisterForm } from "./RegisterForm";

export const dynamic = "force-dynamic";

export default async function AltaPage({ searchParams }: { searchParams: Promise<{ origen?: string; c?: string }> }) {
  const { origen, c } = await searchParams;
  const source = origen === "carta" && c && /^[A-Z0-9]{4,12}$/i.test(c) ? `carta:${c}` : origen;
  const lines = await listLines();
  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="space-y-3 text-center">
        <p className="eyebrow">Solo profesionales sanitarios</p>
        <h1 className="display text-5xl leading-none">Alta profesional</h1>
        <p className="mx-auto max-w-md text-muted">Para dermatólogos y consultas médicas. Te enviamos una muestra gratuita al darte de alta.</p>
      </div>
      <RegisterForm lines={lines.map(({ id, name }) => ({ id, name }))} source={source} brandName={brand.name} />
    </div>
  );
}
