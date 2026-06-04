#!/bin/sh
set -e

echo "▶ Resolving any previously failed migrations..."
npx prisma migrate resolve --rolled-back "20260604000000_add_user_profile_and_postgis" 2>/dev/null || true

echo "▶ Running database migrations..."
npx prisma migrate deploy

echo "▶ Starting server..."
exec node dist/main
