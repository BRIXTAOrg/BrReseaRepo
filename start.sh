#!/bin/bash

# Ensure the script stops if any command fails
set -e

# 1. Load the credentials from the .env file
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
else
  echo "Error: .env file not found."
  exit 1
fi

# 2. Safety check matching your new variable names
if [ -z "$INFISICAL_CLIENT_ID" ] || [ -z "$INFISICAL_CLIENT_SECRET" ]; then
    echo "Error: Infisical Universal Auth credentials are missing from .env" 
    exit 1 
fi

# 3. Inject the Universal Auth credentials into the cluster
# This dynamically creates the secret that 02-infisical-secret.yaml references
echo "Injecting Infisical Machine Identity credentials into Kubernetes..."
kubectl create secret generic universal-auth-credentials \
  --from-literal=clientId="${INFISICAL_CLIENT_ID}" \
  --from-literal=clientSecret="${INFISICAL_CLIENT_SECRET}" \
  --namespace=default \
  --dry-run=client -o yaml | kubectl apply -f -

# 4. Start the Kubernetes Deployments (Replaces docker compose up)
echo "Applying Kubernetes manifests..."
kubectl apply -f k8s/

# 5. Confirm success
if [ $? -eq 0 ]; then
  echo "Kubernetes manifests applied successfully! The Infisical Operator is syncing secrets."
else
  echo "Failed to apply manifests. Check the output above."
fi