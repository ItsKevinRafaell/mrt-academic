#!/bin/bash
# MRT Production Installation Script
# Usage: sudo ./install.sh

set -euo pipefail

# Configuration
APP_USER="mrt"
APP_DIR="/opt/mrt"
APP_REPO="https://github.com/your-org/mrt.git"  # Update this
BACKEND_DIR="$APP_DIR/backend"
FRONTEND_DIR="$APP_DIR/frontend"

echo "=== MRT Production Installation ==="

# Create user if not exists
if ! id "$APP_USER" &>/dev/null; then
    echo "Creating user: $APP_USER"
    useradd --system --create-home --shell /bin/false "$APP_USER"
fi

# Create directories
echo "Creating directories..."
mkdir -p "$APP_DIR"
mkdir -p /var/log/mrt
mkdir -p /var/www/mrt

# Clone or pull repo
if [ -d "$APP_DIR/.git" ]; then
    echo "Updating existing installation..."
    cd "$APP_DIR"
    git pull
else
    echo "Cloning repository..."
    git clone "$APP_REPO" "$APP_DIR"
    cd "$APP_DIR"
fi

# Build backend
echo "Building backend..."
cd "$BACKEND_DIR"
go mod download
go build -o bin/mrt-server ./cmd/api

# Build frontend
echo "Building frontend..."
cd "$FRONTEND_DIR"
npm ci
npm run build

# Set permissions
echo "Setting permissions..."
chown -R "$APP_USER:$APP_USER" "$APP_DIR"
chmod +x "$BACKEND_DIR/bin/mrt-server"

# Copy and configure service
echo "Installing systemd service..."
cp "$APP_DIR/deploy/mrt-api.service" /etc/systemd/system/
systemctl daemon-reload
systemctl enable mrt-api

# Copy Caddyfile
echo "Installing Caddyfile..."
cp "$APP_DIR/deploy/Caddyfile" /etc/caddy/Caddyfile

# Create .env
if [ ! -f "$BACKEND_DIR/.env" ]; then
    echo "Creating .env file..."
    cat > "$BACKEND_DIR/.env" << 'EOF'
PORT=9090
DATABASE_URL=postgres://mrt:CHANGEME@localhost:5432/mrt_db?sslmode=disable
JWT_SECRET=CHANGEME-32-CHARS-MIN
ALLOWED_ORIGINS=https://mrt.yourdomain.com
RATE_LIMIT_RPM=100
SEARCH_CACHE_TTL=5m
DASHBOARD_CACHE_TTL=1m
EOF
    chmod 600 "$BACKEND_DIR/.env"
    chown "$APP_USER:$APP_USER" "$BACKEND_DIR/.env"
    echo "WARNING: Please edit $BACKEND_DIR/.env with real values!"
fi

# Run migrations
echo "Running database migrations..."
cd "$APP_DIR"
./scripts/db-migrate.sh

# Start services
echo "Starting services..."
systemctl restart mrt-api
systemctl restart caddy

# Health check
echo "Running health check..."
sleep 2
curl -sf http://localhost:9090/api/health && echo " Backend: OK" || echo " Backend: FAILED"
curl -sf http://localhost/health && echo " Frontend: OK" || echo " Frontend: FAILED"

echo ""
echo "=== Installation Complete ==="
echo "Backend: systemctl status mrt-api"
echo "Caddy: systemctl status caddy"
echo "Logs: journalctl -u mrt-api -f"
