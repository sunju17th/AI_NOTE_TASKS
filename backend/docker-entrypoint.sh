#!/bin/sh
set -e

echo "==> Running Prisma migration deploy..."
npx prisma migrate deploy

echo "==> Starting Node.js server..."
exec node src/server.js
