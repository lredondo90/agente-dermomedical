#!/usr/bin/env bash
# Crea la demo de la APP en Azure Container Apps, dentro del uso gratuito.
# Requisitos: Azure CLI con sesión iniciada (Azure Cloud Shell sirve) y un token de GitHub con permiso
# read:packages para descargar la imagen de ghcr.io.
#
# Uso: GHCR_TOKEN="ghp_tu_token" BUDGET_EMAIL="tu@correo.com" ADMIN_PASSWORD="una_contraseña" ./infra/azure-demo.sh
set -euo pipefail

RG="${RG:-agente-dermomedical-demo}"
LOCATION="${LOCATION:-spaincentral}"
ENV_NAME="${ENV_NAME:-agente-dermomedical-env}"
OWNER="${OWNER:-lredondo90}"
COMPANY_NAME="${COMPANY_NAME:-[Tu empresa]}"
: "${GHCR_TOKEN:?Indica GHCR_TOKEN (token de GitHub con read:packages)}"
: "${BUDGET_EMAIL:?Indica BUDGET_EMAIL para el aviso de gasto}"
: "${ADMIN_PASSWORD:?Indica ADMIN_PASSWORD, la contraseña del panel /panel}"
SESSION_SECRET="$(openssl rand -hex 32)"

az extension add --name containerapp --upgrade --only-show-errors
az provider register --namespace Microsoft.App --wait

az group create -n "$RG" -l "$LOCATION" -o none

# Entorno sin Log Analytics para no generar coste de registros.
az containerapp env create -g "$RG" -n "$ENV_NAME" -l "$LOCATION" --logs-destination none -o none

# Una sola réplica porque la base de datos de la demo vive dentro del contenedor.
# Se apaga sin visitas (min-replicas 0): gratis, pero los datos de prueba se pierden al apagarse.
az containerapp create -g "$RG" -n agente-dermomedical --environment "$ENV_NAME" \
  --image "ghcr.io/$OWNER/agente-dermomedical:latest" \
  --registry-server ghcr.io --registry-username "$OWNER" --registry-password "$GHCR_TOKEN" \
  --target-port 3000 --ingress external \
  --secrets "session-secret=$SESSION_SECRET" "admin-password=$ADMIN_PASSWORD" \
  --env-vars SESSION_SECRET=secretref:session-secret ADMIN_PASSWORD=secretref:admin-password \
    DEMO_PRICES=1 "COMPANY_NAME=$COMPANY_NAME" \
  --cpu 0.5 --memory 1Gi --min-replicas 0 --max-replicas 1 -o none

FQDN=$(az containerapp show -g "$RG" -n agente-dermomedical --query properties.configuration.ingress.fqdn -o tsv)
az containerapp update -g "$RG" -n agente-dermomedical --set-env-vars "SITE_URL=https://$FQDN" -o none

# Aviso por correo en cuanto el gasto del mes pase de 1 €.
SUB=$(az account show --query id -o tsv)
az consumption budget create-with-rg -g "$RG" --budget-name aviso-1-euro --amount 1 --category Cost --time-grain Monthly \
  --time-period start-date="$(date +%Y-%m-01)" \
  --notifications "{\"Actual_GreaterThan_1_Percent\":{\"enabled\":true,\"operator\":\"GreaterThan\",\"threshold\":1,\"contact-emails\":[\"$BUDGET_EMAIL\"]}}" -o none \
  || echo "No se pudo crear el aviso de gasto automáticamente; créalo en Cost Management > Budgets (suscripción $SUB)."

echo "APP publicada en: https://$FQDN"
echo "Panel: https://$FQDN/panel (contraseña: la que has indicado en ADMIN_PASSWORD)"
