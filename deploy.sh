#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=== HERMITAGE DECOR — Deployment ==="
echo ""

# 1. Check .env file exists
if [ ! -f .env ]; then
    echo -e "${RED}ERROR: .env file not found.${NC}"
    echo "Copy the template first:"
    echo "  cp .env.production .env"
    echo "  nano .env"
    exit 1
fi

# Source .env to check values
set -a
source .env
set +a

# 2. Validate required variables
ERRORS=0

if [ -z "$HOST_IP" ] || [ "$HOST_IP" = "YOUR_SERVER_IP" ]; then
    echo -e "${RED}ERROR: HOST_IP is not set or still default.${NC}"
    ERRORS=$((ERRORS + 1))
fi

if [ -z "$POSTGRES_PASSWORD" ] || [ "$POSTGRES_PASSWORD" = "CHANGE_ME_TO_A_STRONG_PASSWORD" ]; then
    echo -e "${RED}ERROR: POSTGRES_PASSWORD must be changed from default.${NC}"
    ERRORS=$((ERRORS + 1))
fi

if [ -z "$POSTGRES_USER" ] || [ "$POSTGRES_USER" = "CHANGE_ME" ]; then
    echo -e "${RED}ERROR: POSTGRES_USER must be changed from default.${NC}"
    ERRORS=$((ERRORS + 1))
fi

if [ -z "$JWT_SECRET" ] || [ "$JWT_SECRET" = "CHANGE_ME_TO_RANDOM_32_PLUS_CHARS" ]; then
    echo -e "${RED}ERROR: JWT_SECRET must be changed from default.${NC}"
    ERRORS=$((ERRORS + 1))
fi

if [ -z "$JWT_REFRESH_SECRET" ] || [ "$JWT_REFRESH_SECRET" = "CHANGE_ME_TO_RANDOM_32_PLUS_CHARS" ]; then
    echo -e "${RED}ERROR: JWT_REFRESH_SECRET must be changed from default.${NC}"
    ERRORS=$((ERRORS + 1))
fi

if [ $ERRORS -gt 0 ]; then
    echo ""
    echo "Fix the errors above in your .env file and try again."
    exit 1
fi

echo -e "${GREEN}✓ .env validation passed${NC}"

# 3. Stop old containers
echo ""
echo "Stopping existing containers..."
docker compose down 2>/dev/null || true

# 4. Build and start
echo ""
echo "Building and starting services (this may take 5-15 minutes on first run)..."
docker compose up -d --build

# 5. Wait for database
echo ""
echo "Waiting for database to be ready..."
sleep 10

# 6. Apply migrations
echo ""
echo "Applying database migrations..."
docker compose exec -T backend npx prisma migrate deploy 2>/dev/null || echo "Note: Migrations may have already been applied."

# 7. Done
HOST_URL="https://${HOST_IP}"
API_URL="https://${HOST_IP}/api"

echo ""
echo -e "${GREEN}=== Deployment complete ===${NC}"
echo "Frontend:    ${HOST_URL}"
echo "Backend API: ${API_URL}"
echo ""
echo "Useful commands:"
echo "  docker compose logs -f          # View logs"
echo "  docker compose down              # Stop all"
echo "  docker compose restart backend   # Restart backend"
