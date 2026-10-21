# Diseño de la APP

Desde octubre de 2026 la APP usa un estilo propio, más actual, que sustituye al de DESIGN.md (tipo DJI), que se conserva solo como referencia.

- **Colores** (en `src/app/globals.css`): lienzo cálido `#f7f6f3`, tarjetas blancas, tinta `#14161a` y un verde clínico `#0f6b5c` como acento (`accent`, `accent-soft`, `accent-strong`). Avisos en ámbar (`warn`, `warn-soft`).
- **Tipografía**: Geist para el texto e Instrument Serif (clase `display`) para los titulares grandes de la tienda. El panel usa solo Geist.
- **Componentes**: `btn` (píldora negra), `btn-accent`, `btn-ghost`, `btn-soft`, `card` (radio 16 px con sombra suave), `input` (también para `select`, con flecha propia), `label`, `chip`, `eyebrow`, `page-title`, `section-title`, `link` y `table` para las tablas del panel.
- **Estructura**: la tienda vive en el grupo de rutas `src/app/(tienda)` con cabecera flotante y pie oscuro; el panel (`src/app/panel/layout.tsx`) tiene barra lateral propia y `PageHeader`/`Stat` para las cabeceras y las cifras.
