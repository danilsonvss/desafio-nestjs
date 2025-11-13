FROM node:20-alpine

WORKDIR /usr/src/app

# OS deps needed by Prisma and wait script
RUN apk add --no-cache bash openssl libc6-compat postgresql-client

# Install dependencies (use cached layer when possible)
COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# Copy prisma only (source code will be bind-mounted in dev)
COPY prisma ./prisma

# Pre-generate Prisma client if schema exists (non-fatal)
RUN npx prisma generate || true

EXPOSE 3000

# Entrypoint will wait for DB, generate client, sync schema, then start
COPY docker/entrypoint.dev.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]
