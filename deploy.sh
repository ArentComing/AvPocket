#!/bin/bash
# ==============================================================
# AvPocket - Production Deployment Script
# Domain: av-api.ir
# Usage:  chmod +x deploy.sh && ./deploy.sh
# ==============================================================

set -euo pipefail

# ── Colors ──
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log()   { echo -e "${GREEN}[AvPocket]${NC} $1"; }
warn()  { echo -e "${YELLOW}[WARNING]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

APP_DIR="$(cd "$(dirname "$0")" && pwd)"
DOMAIN="av-api.ir"
COMPOSE_FILE="$APP_DIR/docker-compose.yml"

# ── Step 0: Prerequisites Check ──
log "🔍 Checking prerequisites..."

command -v docker >/dev/null 2>&1 || error "Docker is not installed! Install: https://docs.docker.com/engine/install/"
command -v docker compose >/dev/null 2>&1 || error "Docker Compose V2 is not installed!"

if [ ! -f "$APP_DIR/.env.production" ]; then
    warn ".env.production not found. Creating from template..."
    cat > "$APP_DIR/.env.production" << 'ENVEOF'
# AvPocket Production Environment
# IMPORTANT: Change ALL values below before deploying!

POSTGRES_PASSWORD=AvP0ck3t_Secur3_DB_2026_CHANGEME
JWT_SECRET=your-very-long-random-jwt-secret-at-least-64-chars-CHANGEME
GITHUB_WEBHOOK_SECRET=your-github-webhook-secret
NEXT_PUBLIC_APP_URL=https://av-api.ir
ENVEOF
    warn "⚠️  Edit .env.production with your actual secrets before continuing!"
    warn "   nano $APP_DIR/.env.production"
    read -p "Press Enter after editing .env.production..." </dev/tty
fi

# Load production env
set -a
source "$APP_DIR/.env.production"
set +a

# ── Step 1: SSL Certificate Setup ──
log "🔒 Setting up SSL certificate for $DOMAIN..."

CERT_PATH="/etc/letsencrypt/live/$DOMAIN/fullchain.pem"

if [ ! -f "$CERT_PATH" ]; then
    log "No SSL certificate found. Obtaining via Let's Encrypt..."

    # Start nginx temporarily with HTTP-only config for ACME challenge
    mkdir -p "$APP_DIR/nginx/conf.d"

    # Create temporary HTTP-only nginx config
    cat > /tmp/nginx-temp.conf << 'NGINXEOF'
worker_processes auto;
events { worker_connections 1024; }
http {
    server {
        listen 80;
        server_name av-api.ir www.av-api.ir;
        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
        }
        location / {
            return 200 'AvPocket is being configured...';
            add_header Content-Type text/plain;
        }
    }
}
NGINXEOF

    # Run temporary nginx for cert challenge
    docker run -d --name avpocket-temp-nginx \
        -p 80:80 \
        -v /tmp/nginx-temp.conf:/etc/nginx/nginx.conf:ro \
        -v avpocket_webroot:/var/www/certbot \
        nginx:alpine

    # Request certificate
    docker run --rm \
        -v avpocket_certbot_etc:/etc/letsencrypt \
        -v avpocket_certbot_var:/var/lib/letsencrypt \
        -v avpocket_webroot:/var/www/certbot \
        certbot/certbot certonly \
        --webroot --webroot-path=/var/www/certbot \
        --email admin@$DOMAIN \
        --agree-tos --no-eff-email \
        -d $DOMAIN -d www.$DOMAIN

    # Stop temporary nginx
    docker stop avpocket-temp-nginx && docker rm avpocket-temp-nginx
    rm /tmp/nginx-temp.conf

    log "✅ SSL certificate obtained successfully!"
else
    log "✅ SSL certificate already exists."
fi

# ── Step 2: Build & Deploy ──
log "🏗️  Building AvPocket Docker images..."
cd "$APP_DIR"

docker compose -f "$COMPOSE_FILE" build --no-cache app

# ── Step 3: Start Services ──
log "🚀 Starting AvPocket services..."
docker compose -f "$COMPOSE_FILE" up -d

# ── Step 4: Wait for PostgreSQL ──
log "⏳ Waiting for PostgreSQL to be ready..."
sleep 5

# ── Step 5: Run Database Migrations ──
log "📦 Running Prisma database migrations..."
docker compose -f "$COMPOSE_FILE" exec -T app npx prisma db push --accept-data-loss 2>/dev/null || \
    docker compose -f "$COMPOSE_FILE" exec -T app npx prisma db push

log "🌱 Seeding database with initial data..."
docker compose -f "$COMPOSE_FILE" exec -T app npx prisma db seed 2>/dev/null || \
    warn "Seed skipped (may already be seeded)"

# ── Step 6: Setup Auto-Backup Cron ──
log "🗄️  Setting up automated daily backups..."
BACKUP_DIR="$APP_DIR/backups"
mkdir -p "$BACKUP_DIR"

BACKUP_CRON="0 3 * * * cd $APP_DIR && ./scripts/backup.sh >> $BACKUP_DIR/backup.log 2>&1"
(crontab -l 2>/dev/null | grep -v "avpocket.*backup" ; echo "$BACKUP_CRON") | crontab -

# ── Step 7: Setup SSL Auto-Renewal Cron ──
log "🔄 Setting up SSL auto-renewal..."
RENEW_CRON="0 0 */15 * * docker compose -f $COMPOSE_FILE exec -T certbot certbot renew --quiet && docker compose -f $COMPOSE_FILE exec -T nginx nginx -s reload"
(crontab -l 2>/dev/null | grep -v "certbot renew" ; echo "$RENEW_CRON") | crontab -

# ── Step 8: Health Check ──
log "🩺 Running health check..."
sleep 10

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/" 2>/dev/null || echo "000")

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "308" ] || [ "$HTTP_CODE" = "301" ]; then
    log "✅ Application is responding (HTTP $HTTP_CODE)"
else
    warn "Application returned HTTP $HTTP_CODE - check logs: docker compose logs app"
fi

# ── Done! ──
echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════${NC}"
echo -e "${GREEN} 🎉 AvPocket Deployment Complete!${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════${NC}"
echo ""
echo -e " 🌐 Website:  ${CYAN}https://$DOMAIN${NC}"
echo -e " 📊 API:      ${CYAN}https://$DOMAIN/api${NC}"
echo -e " 🔑 License:  ${CYAN}https://$DOMAIN/api/v1/license/verify${NC}"
echo ""
echo -e " 📋 Useful Commands:"
echo -e "   ${YELLOW}docker compose logs -f app${NC}      # Application logs"
echo -e "   ${YELLOW}docker compose logs -f nginx${NC}    # Nginx access logs"
echo -e "   ${YELLOW}docker compose ps${NC}               # Service status"
echo -e "   ${YELLOW}docker compose restart app${NC}      # Restart app"
echo -e "   ${YELLOW}./scripts/backup.sh${NC}             # Manual backup"
echo ""
