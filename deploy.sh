#!/bin/bash
set -e

echo "=== 1. Pulling latest code ==="
git pull origin main

echo "=== 2. Building and starting application (with layer caching) ==="
# Docker compose --build will use cached layers for dependencies & prisma if unchanged
docker compose up -d --build app

echo "=== 3. Database Sync & Seeding (if needed) ==="
# Run migrations using the existing app image without downloading bun/deps from scratch
docker compose exec -T app sh -c "npx prisma db push --skip-generate || true"

echo "=== 4. Cleaning dangling unused images only (keeps build layer cache!) ==="
docker image prune -f

echo "🎉 All Done! Application updated."


