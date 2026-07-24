#!/bin/bash
set -e

echo "=== Hermitage Decor - Server Setup ==="
echo "Run this ONCE on a fresh Ubuntu/Debian server"

# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
rm get-docker.sh

# Install Docker Compose
apt install -y docker-compose-plugin

# Enable Docker
systemctl enable docker
systemctl start docker

# Open firewall ports
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 22/tcp
ufw --force enable

echo ""
echo "=== Server setup complete ==="
echo "Now upload the project and run deploy.sh"
