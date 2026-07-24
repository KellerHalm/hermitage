#!/bin/bash
set -e

echo "=== Hermitage Decor Deployment ==="

# Check if .env exists
if [ ! -f .env ]; then
    echo "Creating .env from .env.production template..."
    cp .env.production .env
    echo ">> Edit .env with your server settings before running again!"
    echo ">> Required: HOST_IP, POSTGRES_PASSWORD, JWT_SECRET, POSTGRES_USER"
    exit 1
fi

# Load env
export $(grep -v '^#' .env | xargs)

# Validate critical env vars
errors=0
if [ -z "$HOST_IP" ] || [ "$HOST_IP" = "YOUR_SERVER_IP" ]; then
    echo "ERROR: HOST_IP is not set or still has placeholder value in .env"
    errors=1
fi
if [ -z "$JWT_SECRET" ] || [ "$JWT_SECRET" = "CHANGE_ME_TO_RANDOM_32_PLUS_CHARS" ]; then
    echo "ERROR: JWT_SECRET must be changed from placeholder in .env"
    errors=1
fi
if [ -z "$POSTGRES_PASSWORD" ] || [ "$POSTGRES_PASSWORD" = "CHANGE_ME_TO_A_STRONG_PASSWORD" ]; then
    echo "ERROR: POSTGRES_PASSWORD must be changed from placeholder in .env"
    errors=1
fi
if [ -z "$POSTGRES_USER" ] || [ "$POSTGRES_USER" = "CHANGE_ME" ]; then
    echo "ERROR: POSTGRES_USER must be changed from placeholder in .env"
    errors=1
fi
if [ $errors -eq 1 ]; then
    echo ">> Please fix the above issues in .env and try again."
    exit 1
fi

# Check SSL certificates
if [ ! -f nginx/ssl/fullchain.pem ] || [ ! -f nginx/ssl/privkey.pem ]; then
    echo "WARNING: SSL certificates not found in nginx/ssl/"
    echo ">> HTTPS will not work without certificates."
    echo ">> See DEPLOY.md section 9 for SSL setup instructions."
    echo ""
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
echo "Frontend: https://${HOST_IP}"
echo "Backend API: https://${HOST_IP}/api"
echo ""
echo "Useful commands:"
echo "  docker compose logs -f          # View logs"
echo "  docker compose down              # Stop all"
echo "  docker compose restart backend   # Restart backend"
