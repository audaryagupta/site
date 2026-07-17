#!/bin/sh
set -e

# Ensure the SQLite schema exists / is up to date on the mounted volume.
mkdir -p /data
npx prisma db push --skip-generate --accept-data-loss=false || npx prisma db push --skip-generate

# Start the Next.js standalone server.
exec node server.js
