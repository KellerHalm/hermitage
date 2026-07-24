#!/bin/bash
set -e

echo "=== Hermitage Decor Deployment ==="

# Check if .env exists
if [ ! -f .env ]; then
    echo "Creating .env from .env.production template..."
    cp .env.production .env
    echo ">> Edit .env with your server settings before running again!"
    exit 1
fi

# Load env
export $(grep -v '^#' .env | xargs)

echo "Building and starting containers..."
docker compose down
docker compose build --no-cache
docker compose up -d

echo "Waiting for database..."
sleep 5

echo "Running migrations..."
docker compose exec backend npx prisma migrate deploy

echo "Seeding database (if empty)..."
docker compose exec backend node prisma/seed.js || true

echo ""
echo "=== Deployment complete ==="
echo "Frontend: http://${HOST_IP:-localhost}"
echo "Backend API: http://${HOST_IP:-localhost}:5000/api"
echo ""
echo "Useful commands:"
echo "  docker compose logs -f          # View logs"
echo "  docker compose down              # Stop all"
echo "  docker compose restart backend   # Restart backend"
