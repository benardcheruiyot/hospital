#!/usr/bin/env bash

set -euo pipefail

DOMAIN="${DOMAIN:-terralinkhealth.co.ke}"
CERTBOT_EMAIL="${CERTBOT_EMAIL:?Set CERTBOT_EMAIL to the certificate administrator email}"
APP_DIR="${APP_DIR:-/home/deploy/hospital-platform}"

if [[ "$(id -u)" -ne 0 ]]; then
  echo "Run this script as root."
  exit 1
fi

for hostname in "$DOMAIN" "www.$DOMAIN"; do
  if ! getent hosts "$hostname" >/dev/null; then
    echo "DNS does not resolve for $hostname. Point its A record to this VPS first."
    exit 1
  fi
done

apt-get update
apt-get install -y certbot

systemctl stop apache2 2>/dev/null || true
systemctl stop nginx 2>/dev/null || true

if [[ -f "$APP_DIR/docker-compose.prod.yml" ]]; then
  docker compose -f "$APP_DIR/docker-compose.prod.yml" stop nginx 2>/dev/null || true
fi

certbot certonly --standalone \
  --non-interactive \
  --agree-tos \
  --email "$CERTBOT_EMAIL" \
  --keep-until-expiring \
  -d "$DOMAIN" \
  -d "www.$DOMAIN"

install -d -o deploy -g deploy "$APP_DIR/ssl"
install -o deploy -g deploy -m 0644 \
  "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" \
  "$APP_DIR/ssl/fullchain.pem"
install -o deploy -g deploy -m 0600 \
  "/etc/letsencrypt/live/$DOMAIN/privkey.pem" \
  "$APP_DIR/ssl/privkey.pem"

cd "$APP_DIR"
docker compose -f docker-compose.prod.yml config >/dev/null
docker compose -f docker-compose.prod.yml up -d --force-recreate nginx

echo "TLS repaired. Verify with: curl --fail https://$DOMAIN/api/health"