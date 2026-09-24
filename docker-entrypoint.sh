#!/bin/sh
set -e

echo "[AvPocket] Running database migrations..."
npx prisma@6 db push --skip-generate 2>/dev/null || echo "[AvPocket] Migration skipped or already up to date"

echo "[AvPocket] Starting server..."
exec node server.js
