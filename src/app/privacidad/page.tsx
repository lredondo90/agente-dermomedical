import { company } from "@/lib/company";

export default function Privacidad() {
  return (
    <article className="prose mx-auto max-w-2xl space-y-3 text-sm">
      <h1 className="text-3xl font-semibold">Política de privacidad</h1>
      <p className="rounded-lg bg-amber-50 p-3">Borrador pendiente de revisión por un abogado.</p>
      <p><strong>Responsable:</strong> {company.name}, {company.taxId}, {company.address}. Contacto: {company.email}.</p>
      <p><strong>Datos:</strong> nombre, número de colegiado, clínica, provincia, correo, móvil, datos de facturación y envío, pedidos y conversaciones con nuestro asistente.</p>
      <p><strong>Finalidades y bases legales:</strong> gestionar tu cuenta profesional y tus pedidos (ejecución del contrato); enviarte información comercial por correo o WhatsApp solo si lo has aceptado (consentimiento); verificar que eres profesional sanitario y atender incidencias (interés legítimo); facturación (obligación legal).</p>
      <p><strong>Asistente automatizado:</strong> parte de la atención la realiza un asistente de inteligencia artificial. Siempre puedes pedir hablar con una persona.</p>
      <p><strong>Destinatarios:</strong> proveedores que nos prestan servicios (alojamiento, correo, WhatsApp de Meta, pagos, transporte), con contrato de encargo de tratamiento. No vendemos tus datos.</p>
      <p><strong>Conservación:</strong> mientras mantengas la cuenta y, después, el plazo legal de facturación (6 años). Las comunicaciones comerciales cesan en cuanto retiras el consentimiento.</p>
      <p><strong>Derechos:</strong> acceso, rectificación, supresión, oposición, limitación y portabilidad escribiendo a {company.email}. Puedes darte de baja desde tu cuenta o respondiendo BAJA. Puedes reclamar ante la Agencia Española de Protección de Datos (aepd.es).</p>
    </article>
  );
}
