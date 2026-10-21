# Agente Dermomedical

APP de pedidos para dermatólogos, preparada para cualquier marca de dermocosmética. Los dermatólogos se dan de alta
(con sus consentimientos de correo y WhatsApp), reciben una muestra gratuita y hacen pedidos con descuento por volumen.
La primera instalación vende el catálogo Larimedical. El distribuidor lo gestiona todo desde `/panel`.
Es la base sobre la que trabajará el agente de IA (paso 3).

## Qué incluye

| Parte | Ruta | Qué hace |
| --- | --- | --- |
| Inicio | `/` | Presentación para médicos y acceso a la muestra gratuita |
| Alta profesional | `/alta` | Nº de colegiado, clínica, provincia, consentimientos separados de correo y WhatsApp, muestra gratuita. `?origen=carta` guarda de dónde vino |
| Entrar | `/entrar` | Acceso sin contraseña con enlace por correo (caduca en 30 min) |
| Catálogo | `/catalogo` | 68 productos en 10 líneas. Sin precio = visible pero no se puede pedir |
| Carrito | `/carrito` | Cantidades, descuento por volumen (máx. 10 %), envío, IVA (0 % en Canarias, Ceuta y Melilla) |
| Mis pedidos | `/pedidos` | Historial, detalle, datos de transferencia y «Repetir este pedido» |
| Mi cuenta | `/cuenta` | Darse de baja de correo o WhatsApp al momento |
| Panel | `/panel` | Resumen, pedidos y su estado, clientes con sus consentimientos, precios y descuentos |
| Legal | `/privacidad`, `/aviso-legal`, `/condiciones` | Borradores para revisar con un abogado |

Cada alta, consentimiento, muestra, pedido y cambio de estado queda en la tabla `events`, que también usará el agente.

## Arrancar en local

Requiere Node 20 o superior.

```bash
npm install
cp .env.example .env.local   # pon al menos ADMIN_PASSWORD
npm run dev                  # http://localhost:3000
npm test                     # pruebas de precios y descuentos
```

Sin `DATABASE_URL` usa una base de datos local en `.data/` (PGlite), sin instalar nada. Sin `RESEND_API_KEY` los correos
se escriben en la consola y la página de entrar muestra el enlace de acceso.

## Poner en marcha

1. Crear un proyecto en Supabase y copiar su cadena de conexión en `DATABASE_URL`. Las tablas se crean solas al arrancar (`db/schema.sql`).
2. Desplegar en Vercel con las variables de `.env.example` (`SESSION_SECRET` largo y aleatorio).
3. Dominio propio y cuenta de Resend para `MAIL_FROM`.
4. Entrar en `/panel/productos` y poner los precios profesionales.

Para una demo online gratuita en Azure, ver [docs/despliegue-azure.md](docs/despliegue-azure.md).

## Marca y catálogo

La marca se elige con variables de entorno (`BRAND_NAME`, `BRAND_OWNER`, `BRAND_HEADLINE`) y el catálogo con
`CATALOG`, que apunta a `data/catalogos/<CATALOG>.json`. Para un cliente nuevo: añadir su JSON con el mismo formato
(líneas y productos) y desplegar otra instancia con sus variables.

`data/catalogos/larimedical.json` se sacó de la web pública de Larimide el 21/10/2026. Al arrancar se actualizan nombres y líneas,
pero nunca se pisan los precios ni los productos desactivados en el panel. La línea de limpiadores solo tiene un producto
porque su página no se pudo leer; se pueden añadir al JSON.

## Diseño

El aspecto de la web sigue `DESIGN.md` (lenguaje visual tipo DJI, añadido con `npx getdesign@latest add dji`):
lienzo blanco, letra Open Sans, un único azul para las acciones y botones redondeados. Los colores están
centralizados en `src/app/globals.css`, así que cambiar de estilo para otro cliente solo toca ese fichero.
