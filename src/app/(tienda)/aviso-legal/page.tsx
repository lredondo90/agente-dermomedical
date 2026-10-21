import { brand, company } from "@/lib/company";

export default function AvisoLegal() {
  return (
    <article className="card mx-auto max-w-2xl space-y-4 p-8 text-sm leading-relaxed sm:p-10">
      <h1 className="display text-5xl leading-none">Aviso legal</h1>
      <p className="rounded-xl border border-warn/20 bg-warn-soft px-4 py-3 text-warn">Borrador pendiente de revisión por un abogado.</p>
      <p>Titular: {company.name}, {company.taxId}, {company.address}. Contacto: {company.email}.</p>
      <p>{company.name} es distribuidor de los productos {brand.name}, marca de {brand.owner}. Las marcas, nombres e imágenes de producto pertenecen a sus titulares y se usan con autorización.</p>
      <p>Esta web está dirigida exclusivamente a profesionales sanitarios. La información de producto es de carácter cosmético y no sustituye el criterio clínico.</p>
    </article>
  );
}
