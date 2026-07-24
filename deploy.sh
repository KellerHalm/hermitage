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

# Validate critical env vars
errors=0
if [ -z "$HOST_IP" ] || [ "$HOST_IP" = "YOUR_SERVER_IP" ]; then
    echo "ERROR: HOST_IP is not set or still has the default value in .env"
    errors=1
fi
if [ -z "$JWT_SECRET" ] || [ "$JWT_SECRET" = "change_this_to_a_strong_random_string_at_least_32_chars" ]; then
    echo "ERROR: JWT_SECRET must be changed from the default value in .env"
    errors=1
fi
if [ -z "$POSTGRES_PASSWORD" ] || [ "$POSTGRES_PASSWORD" = "change_this_password" ]; then
    echo "ERROR: POSTGRES_PASSWORD must be changed from the default value in .env"
    errors=1
fi
if [ $errors -eq 1 ]; then
    echo ">> Please fix the above issues in .env and try again."
    exit 1
fi

echo "Building and starting containers..."
docker compose down
docker compose build --no-cache
docker compose up -d

echo "Waiting for database to be ready..."
sleep 10

echo "Running migrations..."
docker compose exec backend npx prisma migrate deploy

echo "Seeding database (if empty)..."
if ! docker compose exec backend node prisma/seed.js; then
    echo "WARNING: Seed script failed (database may already be seeded)"
fi

echo ""
echo "=== Deployment complete ==="
echo "Frontend: http://${HOST_IP}"
echo "Backend API: http://${HOST_IP}:5000/api"
echo ""
echo "Useful commands:"
echo "  docker compose logs -f          # View logs"
echo "  docker compose down              # Stop all"
echo "  docker compose restart backend   # Restart backend"
