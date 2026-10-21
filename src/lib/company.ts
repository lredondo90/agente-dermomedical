// Datos del distribuidor. Se rellenan con variables de entorno; los valores por defecto son marcadores visibles.
export const company = {
  name: process.env.COMPANY_NAME ?? "[Tu empresa]",
  taxId: process.env.COMPANY_TAX_ID ?? "[CIF]",
  address: process.env.COMPANY_ADDRESS ?? "[Dirección fiscal]",
  email: process.env.COMPANY_EMAIL ?? "[correo de contacto]",
  iban: process.env.COMPANY_IBAN ?? "[IBAN]",
  siteUrl: process.env.SITE_URL ?? "http://localhost:3000",
};

export const CONSENT_VERSION = "2026-10-21";
