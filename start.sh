#!/bin/sh
set -e

echo "Running prisma db push..."
npx prisma db push

echo "Starting Next.js..."
exec npx next start -p ${PORT:-3000}
