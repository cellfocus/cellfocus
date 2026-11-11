#!/usr/bin/env bash
# =============================================================================
# CellFocus Automated Hostinger VPS Deployment Script
# Repository: https://github.com/Fahad25397/Ecomerece.git
# =============================================================================

set -e # Exit immediately if any command fails

echo "=========================================================="
echo "🚀 Starting CellFocus Production Deployment on Hostinger VPS"
echo "=========================================================="

APP_DIR="/var/www/cellfocus"

# 1. Check Root / Sudo permissions
if [ "$EUID" -ne 0 ]; then
  echo "❌ Error: Please run this deployment script as root or with sudo."
  exit 1
fi

# 2. Ensure system packages are present
echo "📦 Step 1: Checking system prerequisites (Node.js, Git, PM2, Nginx)..."
if ! command -v node >/dev/null 2>&1; then
  echo "Installing Node.js 20 LTS..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi

if ! command -v pm2 >/dev/null 2>&1; then
  echo "Installing PM2 Process Manager globally..."
  npm install -g pm2
fi

if ! command -v nginx >/dev/null 2>&1; then
  echo "Installing Nginx Web Server..."
  apt-get update && apt-get install -y nginx certbot python3-certbot-nginx
fi

# 3. Create destination directory if not exists
mkdir -p "$APP_DIR"
mkdir -p "$APP_DIR/logs"

# 4. Pull or navigate to repository
cd "$APP_DIR"
if [ -d ".git" ]; then
  echo "🔄 Step 2: Fetching latest code from GitHub..."
  git pull origin main || git pull origin master
else
  echo "ℹ️ Current folder is not a git repo, proceeding with local build files."
fi

# 5. Check server environment file
if [ ! -f "server/.env" ]; then
  echo "⚠️ Warning: server/.env not found! Creating from server/.env.production.example..."
  if [ -f "server/.env.production.example" ]; then
    cp server/.env.production.example server/.env
    echo "❗ Please edit server/.env with your production credentials."
  fi
fi

# 6. Install Server Dependencies
echo "📦 Step 3: Installing production backend dependencies..."
cd "$APP_DIR/server"
npm ci --omit=dev || npm install --omit=dev

# 7. Build Frontend Static Assets
echo "⚡ Step 4: Compiling production frontend bundle (Vite)..."
cd "$APP_DIR/client"
npm ci || npm install
npm run build

# 8. Configure Nginx Reverse Proxy
echo "🌐 Step 5: Configuring Nginx site..."
cd "$APP_DIR"
if [ -f "deploy/hostinger-nginx.conf" ]; then
  cp deploy/hostinger-nginx.conf /etc/nginx/sites-available/cellfocus.conf
  ln -sf /etc/nginx/sites-available/cellfocus.conf /etc/nginx/sites-enabled/
  # Remove default Nginx welcome page if present
  rm -f /etc/nginx/sites-enabled/default
  nginx -t && systemctl reload nginx
  echo "✓ Nginx reloaded successfully."
fi

# 9. Start / Reload Backend via PM2
echo "⚙️ Step 6: Reloading Node.js backend cluster with PM2..."
cd "$APP_DIR"
if pm2 describe cellfocus-api > /dev/null 2>&1; then
  pm2 reload ecosystem.config.js --env production
else
  pm2 start ecosystem.config.js --env production
fi
pm2 save

echo "=========================================================="
echo "✅ HOSTINGER DEPLOYMENT SUCCESSFUL!"
echo "Server Status: http://localhost:5000/api/health"
echo "Public Domain: https://cellfocus.pk"
echo "=========================================================="

