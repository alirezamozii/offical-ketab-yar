#!/bin/bash
set -e
echo "=== 1. Pulling latest code ==="
git pull origin main

echo "=== 2. Building and starting application ==="
docker compose up -d --build app

echo "=== 3. Setting up Database & Seeding Books ==="
net_name=$(docker network ls --format '{{.Name}}' | grep ketab-yar | head -n 1)
[ -z "$net_name" ] && net_name="ketab-yar_ketab-yar-net"

docker run --rm --network "$net_name"   -v $(pwd):/app -w /app   -e DATABASE_URL="postgresql://ky:ketabyar_secret123@db:5432/ketabyar?schema=public"   oven/bun:1-alpine sh -c "apk add --no-cache openssl && bun install --frozen-lockfile && bun run db:generate && bunx prisma db push && bun run db:seed:prod"

echo "=== 4. Cleaning build cache ==="
docker system prune -f

echo "🎉 All Done! Application is live at http://5.231.108.102:3000"

