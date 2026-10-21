import { brand, company } from "@/lib/company";

export default function AvisoLegal() {
  return (
    <article className="mx-auto max-w-2xl space-y-3 text-sm">
      <h1 className="text-3xl font-semibold">Aviso legal</h1>
      <p className="rounded-lg bg-amber-50 p-3">Borrador pendiente de revisión por un abogado.</p>
      <p>Titular: {company.name}, {company.taxId}, {company.address}. Contacto: {company.email}.</p>
      <p>{company.name} es distribuidor de los productos {brand.name}, marca de {brand.owner}. Las marcas, nombres e imágenes de producto pertenecen a sus titulares y se usan con autorización.</p>
      <p>Esta web está dirigida exclusivamente a profesionales sanitarios. La información de producto es de carácter cosmético y no sustituye el criterio clínico.</p>
    </article>
  );
}
