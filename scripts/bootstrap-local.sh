#!/bin/sh
set -eu

if [ -n "${PYTHON_BIN:-}" ]; then
  CANDIDATES="$PYTHON_BIN"
else
  CANDIDATES="python3.11 python3.12 python3.13"
fi

PYTHON_BIN=""
for CANDIDATE in $CANDIDATES; do
  if command -v "$CANDIDATE" >/dev/null 2>&1; then
    PYTHON_BIN="$CANDIDATE"
    break
  fi
done

if [ -z "$PYTHON_BIN" ]; then
  echo "BRIXTA needs Python 3.11, 3.12, or 3.13. Install one or set PYTHON_BIN explicitly." >&2
  exit 1
fi

VERSION="$($PYTHON_BIN -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")')"
case "$VERSION" in
  3.11|3.12|3.13) ;;
  *) echo "Unsupported Python $VERSION. Use Python 3.11–3.13." >&2; exit 1 ;;
esac

if [ ! -d Resea ]; then
  "$PYTHON_BIN" -m venv Resea
fi

Resea/bin/python -m pip install --upgrade pip
Resea/bin/python -m pip install -r requirements.txt
Resea/bin/python -m pip install -e .

if [ ! -f .env ]; then
  cp .env.example .env
  echo "Created .env from .env.example"
fi

if command -v docker >/dev/null 2>&1; then
  docker compose up -d --wait postgres redis minio
  docker compose up minio-init
else
  echo "Docker was not found; start PostgreSQL/pgvector, Redis, and optional MinIO yourself."
fi

if command -v npm >/dev/null 2>&1; then
  (cd infra && npm install && npm run db:migrate)
  (cd brixta-dashboard && npm install)
else
  echo "npm was not found; install Node.js before running the dashboard or migrations."
fi

echo
echo "BRIXTA setup complete. Activate it with: source Resea/bin/activate"
echo "Then run: brixta doctor"
