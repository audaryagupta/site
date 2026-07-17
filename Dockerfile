# syntax=docker/dockerfile:1

FROM node:20-slim AS base
ENV NEXT_TELEMETRY_DISABLED=1
RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# ---- deps ----
FROM base AS deps
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

# ---- builder ----
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# A build-time DATABASE_URL is required for `prisma generate`/next build.
ENV DATABASE_URL="file:/data/prod.db"
RUN npx prisma generate
# Create an empty schema DB so pages that read Prisma can be prerendered.
# At runtime this is replaced by the persistent volume mounted at /data.
RUN mkdir -p /data && npx prisma db push --skip-generate
ENV NODE_OPTIONS=--max-old-space-size=4096
RUN npm run build

# ---- runner ----
FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
# Persisted SQLite database lives on a mounted volume at /data
ENV DATABASE_URL="file:/data/prod.db"

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

EXPOSE 3000
CMD ["./docker-entrypoint.sh"]
