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

# 3. Generate self-signed SSL certificate if not present
SSL_DIR="./nginx/ssl"
if [ ! -f "$SSL_DIR/fullchain.pem" ] || [ ! -f "$SSL_DIR/privkey.pem" ]; then
    echo ""
    echo -e "${YELLOW}SSL certificates not found. Generating self-signed certificate...${NC}"
    mkdir -p "$SSL_DIR"
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout "$SSL_DIR/privkey.pem" \
        -out "$SSL_DIR/fullchain.pem" \
        -subj "/C=RU/ST=Local/L=Local/O=Hermitage/CN=${HOST_IP}" \
        2>/dev/null
    chmod 600 "$SSL_DIR/privkey.pem"
    echo -e "${GREEN}✓ Self-signed SSL certificate generated (valid 365 days)${NC}"
fi

# 3b. Try to obtain Let's Encrypt certificate if DOMAIN is set and certbot is available
if [ -n "$DOMAIN" ] && [ "$DOMAIN" != "YOUR_DOMAIN" ] && command -v certbot &>/dev/null; then
    echo ""
    echo -e "${YELLOW}DOMAIN is set ($DOMAIN). Attempting Let's Encrypt...${NC}"

    # Stop nginx temporarily so certbot can use port 80 for HTTP-01 challenge
    docker compose stop nginx 2>/dev/null || true

    certbot certonly --standalone -d "$DOMAIN" --non-interactive --agree-tos --email "admin@${DOMAIN}" 2>/dev/null && {
        # Copy certificates to nginx ssl directory
        mkdir -p "$SSL_DIR"
        cp "/etc/letsencrypt/live/${DOMAIN}/fullchain.pem" "$SSL_DIR/fullchain.pem"
        cp "/etc/letsencrypt/live/${DOMAIN}/privkey.pem" "$SSL_DIR/privkey.pem"
        chmod 600 "$SSL_DIR/privkey.pem"
        echo -e "${GREEN}✓ Let's Encrypt certificate obtained for ${DOMAIN}${NC}"

        # Set up auto-renewal cron job
        CRON_LINE="0 3 * * * certbot renew --quiet --post-hook 'cp /etc/letsencrypt/live/${DOMAIN}/fullchain.pem /opt/hermitage/nginx/ssl/ && cp /etc/letsencrypt/live/${DOMAIN}/privkey.pem /opt/hermitage/nginx/ssl/ && chmod 600 /opt/hermitage/nginx/ssl/privkey.pem' && cd /opt/hermitage && docker compose restart nginx >> /var/log/hermitage-certbot.log 2>&1"
        (crontab -l 2>/dev/null | grep -v 'certbot renew'; echo "$CRON_LINE") | crontab -
        echo -e "${GREEN}✓ Auto-renewal cron job installed (daily at 03:00)${NC}"
    } || {
        echo -e "${YELLOW}⚠ Let's Encrypt failed (no DNS record or port 80 blocked). Using self-signed certificate.${NC}"
        echo "  To manually obtain a certificate later:"
        echo "    1. Ensure DNS A-record points to this server for: ${DOMAIN}"
        echo "    2. Ensure port 80 is open: ufw allow 80/tcp"
        echo "    3. Run: certbot certonly --standalone -d ${DOMAIN}"
    }
fi

# 3c. Install daily database backup cron job
echo ""
echo -e "${YELLOW}Installing daily database backup cron job (02:30)...${NC}"
chmod +x ./backup-db.sh
BACKUP_CRON="30 2 * * * /opt/hermitage/backup-db.sh >> /var/log/hermitage-backup.log 2>&1"
(crontab -l 2>/dev/null | grep -v 'backup-db.sh'; echo "$BACKUP_CRON") | crontab -
echo -e "${GREEN}✓ Daily backup cron job installed (keeps 30 days)${NC}"

# 4. Stop old containers
echo ""
echo "Stopping existing containers..."
docker compose down 2>/dev/null || true

# 5. Build and start
echo ""
echo "Building and starting services (this may take 5-15 minutes on first run)..."
docker compose up -d --build

# 6. Wait for database
echo ""
echo "Waiting for database to be ready..."
sleep 10

# 7. Apply migrations
echo ""
echo "Applying database migrations..."
docker compose exec -T backend npx prisma migrate deploy 2>/dev/null || echo "Note: Migrations may have already been applied."

# 8. Done
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
echo "  ./backup-db.sh                   # Manual database backup"
echo "  ls backups/                      # List backups"
