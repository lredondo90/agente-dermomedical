# Demo en Azure

La demo publica la APP en Azure Container Apps, igual que la demo de portal-pedidos, y está pensada para no salir del
uso gratuito.

| Pieza | Configuración | Por qué no cuesta |
| --- | --- | --- |
| `agente-dermomedical` | 0,5 vCPU, 1 GiB, de 0 a 1 réplicas, acceso público | Se apaga sin visitas y queda dentro de la cuota gratuita mensual |
| Imagen | GitHub Container Registry | Gratis; no se usa Azure Container Registry |
| Registros | Desactivados | Log Analytics se cobra por GB |
| Aviso de gasto | Presupuesto de 1 € con aviso por correo | Avisa de cualquier cargo |

**Importante:** en la demo la base de datos vive dentro del contenedor. Cuando la web se apaga por falta de visitas,
las altas y pedidos de prueba se borran y los precios vuelven a los de ejemplo (`DEMO_PRICES=1`). La primera visita
tras un rato sin uso tarda unos segundos. Para datos permanentes, añade `DATABASE_URL` con una base de Supabase
(gratis) y quita `DEMO_PRICES`.

## Pasos

1. Fusionar en `main`: el workflow **Publicar** construye la imagen y la sube a `ghcr.io/lredondo90/agente-dermomedical`.
2. Crear en GitHub un token con permiso `read:packages` (o reutilizar el de portal-pedidos).
3. En [Azure Cloud Shell](https://shell.azure.com) (Bash), con el repositorio clonado:

   ```bash
   GHCR_TOKEN="ghp_tu_token" BUDGET_EMAIL="tu@correo.com" ADMIN_PASSWORD="una_contraseña" ./infra/azure-demo.sh
   ```

   Pon los valores entre comillas y sin los símbolos < >, que Bash interpreta como ficheros.

   Al terminar imprime la dirección pública.

4. Opcional, para que cada cambio en `main` se publique solo: crear un service principal con
   `az ad sp create-for-rbac --name agente-dermomedical-ci --role contributor --scopes /subscriptions/<id>/resourceGroups/agente-dermomedical-demo --sdk-auth`,
   guardar su salida como secreto `AZURE_CREDENTIALS` y crear la variable `AZURE_RESOURCE_GROUP=agente-dermomedical-demo`.

Si ya tienes otro entorno de Container Apps (por ejemplo el de portal-pedidos), el script lo reutiliza, porque las
suscripciones gratuitas solo admiten uno por región. Borrar este grupo de recursos no afecta a ese entorno.

## Borrar la demo

```bash
az group delete -n agente-dermomedical-demo --yes
```
