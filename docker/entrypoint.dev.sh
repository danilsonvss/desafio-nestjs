#!/usr/bin/env bash
set -e

: "${DB_HOST:=db}"
: "${DB_PORT:=5432}"
: "${DB_USER:=postgres}"

echo "Waiting for Postgres at ${DB_HOST}:${DB_PORT}..."
until pg_isready -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" >/dev/null 2>&1; do
  sleep 1
done
echo "Postgres is ready."

# Ensure dependencies exist when node_modules volume is empty
if [ ! -d node_modules ]; then
  echo "Installing dependencies..."
  if [ -f package-lock.json ]; then
    npm ci
  else
    npm install
  fi
fi

# Prisma: generate client and sync schema in dev (non-fatal if absent)
if [ -f prisma/schema.prisma ]; then
  echo "Generating Prisma client..."
  npx prisma generate || true
  
  if [ -n "${DATABASE_URL}" ]; then
    echo "Pushing Prisma schema to database..."
    npx prisma db push || true
  fi
fi

echo "Starting NestJS in watch mode..."
exec npm run start:dev
