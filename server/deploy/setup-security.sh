#!/usr/bin/env bash
# =============================================================================
# CellFocus DevOps Security Setup Script
# Run on Ubuntu/Debian server as root/sudo: bash setup-security.sh
# =============================================================================

set -e

echo "🔒 [1/4] Installing Apache Utilities for HTTP Basic Auth..."
apt-get update -y
apt-get install -y apache2-utils

echo "🔑 [2/4] Generating Server-Level .htpasswd File..."
read -p "Enter desired Admin Username [default: cellfocus_admin]: " ADMIN_USER
ADMIN_USER=${ADMIN_USER:-cellfocus_admin}

htpasswd -c /etc/nginx/.htpasswd "$ADMIN_USER"
chmod 640 /etc/nginx/.htpasswd
chown root:www-data /etc/nginx/.htpasswd

echo "🛡️ [3/4] Copying Nginx Configuration..."
if [ -d "/etc/nginx/sites-available" ]; then
    cp nginx.conf /etc/nginx/sites-available/cellfocus.conf
    ln -sf /etc/nginx/sites-available/cellfocus.conf /etc/nginx/sites-enabled/cellfocus.conf
    nginx -t
    systemctl reload nginx
    echo "✓ Nginx reloaded successfully!"
fi

echo "✅ [4/4] Multi-Layered Perimeter Security Installed Successfully!"

