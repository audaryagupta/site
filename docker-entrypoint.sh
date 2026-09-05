#!/bin/sh
set -e

# Ensure the SQLite schema exists / is up to date on the mounted volume.
# The prisma CLI bin isn't on PATH in the standalone image, so call it directly.
mkdir -p /data
node ./node_modules/prisma/build/index.js db push --skip-generate --accept-data-loss || true

# Idempotent content seed (article drafts, brand spelling fixes).
node ./scripts/seed-drafts.mjs || true

# Start the Next.js standalone server.
exec node server.js
