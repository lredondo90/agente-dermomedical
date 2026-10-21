import { brand } from "@/lib/company";
import { listLines } from "@/lib/store";
import { RegisterForm } from "./RegisterForm";

export const dynamic = "force-dynamic";

export default async function AltaPage({ searchParams }: { searchParams: Promise<{ origen?: string }> }) {
  const { origen } = await searchParams;
  const lines = await listLines();
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Alta profesional</h1>
        <p className="text-muted">Para dermatólogos y consultas médicas. Te enviamos una muestra gratuita al darte de alta.</p>
      </div>
      <RegisterForm lines={lines.map(({ id, name }) => ({ id, name }))} source={origen} brandName={brand.name} />
    </div>
  );
}
