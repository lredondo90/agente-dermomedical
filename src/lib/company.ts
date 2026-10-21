// Datos del distribuidor. Se rellenan con variables de entorno; los valores por defecto son marcadores visibles.
export const company = {
  name: process.env.COMPANY_NAME ?? "[Tu empresa]",
  taxId: process.env.COMPANY_TAX_ID ?? "[CIF]",
  address: process.env.COMPANY_ADDRESS ?? "[Dirección fiscal]",
  email: process.env.COMPANY_EMAIL ?? "[correo de contacto]",
  iban: process.env.COMPANY_IBAN ?? "[IBAN]",
  siteUrl: process.env.SITE_URL ?? "http://localhost:3000",
};

// Marca y catálogo que vende esta instalación. Para otro cliente basta con cambiar estas variables
// y añadir su catálogo en data/catalogos/<CATALOG>.json.
export const brand = {
  name: process.env.BRAND_NAME ?? "Larimedical",
  owner: process.env.BRAND_OWNER ?? "Larimide S.L.U.",
  headline: process.env.BRAND_HEADLINE ?? "Peelings bioquímicos Larimedical para tu consulta, con pedido en dos minutos",
  catalog: process.env.CATALOG ?? "larimedical",
};

export const CONSENT_VERSION = "2026-10-21";
