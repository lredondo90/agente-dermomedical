# El agente

El agente trabaja en tres frentes. Todo se ve y se controla desde `/panel/agente`.

## 1. Encontrar clínicas y escribirles por carta

- **Google Maps** (`/panel/agente/clinicas`): busca, por ejemplo, «dermatólogo Valencia» y añade hasta 60 clínicas por búsqueda,
  con dirección, teléfono y web. Necesita `GOOGLE_MAPS_API_KEY` (Google Cloud > Places API "New").
- **Tus contactos**: importa un CSV (se exporta desde Excel) con las columnas `clinica, nombre, direccion, provincia, telefono, web, email, notas`.
- **Cartas**: marca las clínicas y pulsa «Preparar cartas». Salen listas para imprimir (una por página A4) con un QR personal
  que lleva a `/alta?origen=carta&c=<código>`. Cuando el médico se da de alta con ese QR, la clínica pasa a «Registrada» y se
  ve qué cartas funcionan.

**Por qué carta y no correo o WhatsApp:** la LSSI (art. 21) prohíbe enviar publicidad por correo o WhatsApp a quien no lo ha
pedido, también a empresas y profesionales. La carta postal no está en la LSSI; se envía por interés legítimo (RGPD art. 6.1.f)
e informa del origen de los datos y de cómo oponerse (art. 14), como hace el pie de la carta. Si alguno de tus contactos ya es
cliente tuyo de productos parecidos, la LSSI permite escribirle por correo: consúltalo con el abogado antes de activarlo.

## 2. Seguimiento automático

Solo a clientes registrados que aceptaron correo o WhatsApp, en laborables de 9 a 20 h, sin pasar del límite diario:

| Cuándo | Mensaje |
| --- | --- |
| 7 días después de la muestra, si no ha pedido | ¿Ha podido probarla? ¿Alguna duda? |
| 21 días después de la muestra, si no ha pedido | Enlace al catálogo, envío gratis y descuento por volumen |
| 45 días después del último pedido | ¿Le preparo la reposición? |

Los días se cambian en el panel. Cada mensaje tiene una clave única, así que nunca se repite. Lo lanza `POST /api/agente/tick`
con `Authorization: Bearer $AGENT_CRON_SECRET`; el flujo de GitHub Actions `agente.yml` lo llama cada hora si defines la variable
`AGENT_URL` y el secreto `AGENT_CRON_SECRET` en el repositorio. También hay un botón «Ejecutar ahora» en el panel.

## 3. Contestar a los clientes con IA

Cuando un cliente escribe por WhatsApp o correo, el agente (Claude, de Anthropic) contesta con el catálogo, los precios y sus
pedidos delante. Puede:

- resolver dudas de productos, formatos, precios y envíos;
- preparar presupuestos exactos (descuento por volumen de la tarifa, máximo 10 %, envío e IVA);
- crear el pedido cuando el cliente lo confirma (queda «pendiente de pago», por transferencia);
- consultar el estado de sus pedidos.

Pasa la conversación a una persona (aparece arriba en `/panel/agente`) cuando hay reclamaciones, devoluciones, facturas,
dudas clínicas, peticiones de más descuento, si la IA no puede responder o si su respuesta contiene una frase prohibida
(«cura», «sin efectos secundarios»...; la lista se edita en el panel). Desde la conversación puedes contestar tú y marcarla
como resuelta, o probar el agente escribiendo como si fueras el cliente.

Todos los mensajes del agente llevan el aviso «Asistente virtual (IA)» (Reglamento de IA, art. 50) y cómo darse de baja.
Si el cliente responde **BAJA**, se le da de baja de ese canal al momento, sin pasar por la IA.

## Conexiones

| Qué | Variables | Dónde se consigue |
| --- | --- | --- |
| IA | `ANTHROPIC_API_KEY` | console.anthropic.com |
| WhatsApp | `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_APP_SECRET`, `WHATSAPP_VERIFY_TOKEN`, `WHATSAPP_TEMPLATE` | Meta Business > WhatsApp Cloud API. Webhook: `https://<tu-web>/api/webhooks/whatsapp` (campo `messages`) |
| Correo saliente | `RESEND_API_KEY`, `MAIL_FROM` | resend.com, con tu dominio verificado |
| Correo entrante | `EMAIL_WEBHOOK_SECRET` | Reenvía los correos recibidos a `POST /api/webhooks/email` con `{ from, subject, text }` (Resend Inbound, Cloudflare Email Routing...) |
| Google Maps | `GOOGLE_MAPS_API_KEY` | console.cloud.google.com > Places API (New) |
| Seguimiento | `AGENT_CRON_SECRET` | Inventa una cadena larga |

Cada conexión es opcional: sin ella, el agente guarda los mensajes en el panel como «sin enviar» y nada sale fuera.
Para WhatsApp, Meta solo permite que la empresa inicie la conversación con una **plantilla aprobada**: crea una plantilla
de tipo «Marketing» con un único parámetro en medio del texto (Meta no deja que empiece o acabe en él), por ejemplo
`Hola, tiene un mensaje de su distribuidor: {{1}} Gracias.`, y pon su nombre en `WHATSAPP_TEMPLATE`.

En la demo de Azure los datos se borran cuando el contenedor se apaga; para usarlo de verdad hace falta `DATABASE_URL` (Supabase).
