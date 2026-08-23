#!/bin/bash

# Hospital Platform - Server Setup Script
# Run this on your deployment server as root or with sudo

set -e

echo "🏥 Hospital Platform - Server Setup"
echo "===================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo -e "${RED}This script must be run as root${NC}" 
   exit 1
fi

# Define variables
DEPLOY_USER="deploy"
DEPLOY_HOME="/home/$DEPLOY_USER"
APP_DIR="$DEPLOY_HOME/hospital-digital-platform"
ENVIRONMENT=${1:-staging}

if [ "$ENVIRONMENT" != "staging" ] && [ "$ENVIRONMENT" != "production" ]; then
    echo -e "${RED}Invalid environment. Use 'staging' or 'production'${NC}"
    exit 1
fi

echo -e "${YELLOW}Setting up for: $ENVIRONMENT${NC}"

# Step 1: Update system
echo -e "${GREEN}📦 Updating system packages...${NC}"
apt-get update
apt-get upgrade -y

# Step 2: Install Docker
echo -e "${GREEN}🐳 Installing Docker...${NC}"
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
else
    echo "✓ Docker already installed"
fi

# Step 3: Create deploy user
echo -e "${GREEN}👤 Setting up deploy user...${NC}"
if ! id "$DEPLOY_USER" &>/dev/null; then
    useradd -m -s /bin/bash $DEPLOY_USER
    echo "$DEPLOY_USER user created"
else
    echo "✓ $DEPLOY_USER user already exists"
fi

# Add deploy user to docker group
usermod -aG docker $DEPLOY_USER
newgrp docker << END
id
END

# Step 4: Create application directory
echo -e "${GREEN}📁 Creating application directory...${NC}"
mkdir -p $APP_DIR
chown -R $DEPLOY_USER:$DEPLOY_USER $APP_DIR

# Create required subdirectories
mkdir -p $APP_DIR/ssl
mkdir -p $APP_DIR/backups
mkdir -p $APP_DIR/logs
chown -R $DEPLOY_USER:$DEPLOY_USER $APP_DIR

# Step 5: Configure SSH for deploy user
echo -e "${GREEN}🔐 Setting up SSH...${NC}"
mkdir -p $DEPLOY_HOME/.ssh
chmod 700 $DEPLOY_HOME/.ssh
chown -R $DEPLOY_USER:$DEPLOY_USER $DEPLOY_HOME/.ssh

echo -e "${YELLOW}Add your public SSH key to: $DEPLOY_HOME/.ssh/authorized_keys${NC}"
echo "Then run: chmod 600 $DEPLOY_HOME/.ssh/authorized_keys"

# Step 6: Install Docker Compose
echo -e "${GREEN}🐳 Installing Docker Compose...${NC}"
if ! command -v docker-compose &> /dev/null; then
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
else
    echo "✓ Docker Compose already installed"
fi

# Step 7: Install additional tools
echo -e "${GREEN}🛠️  Installing utility tools...${NC}"
apt-get install -y \
    curl \
    wget \
    git \
    htop \
    ufw \
    certbot \
    python3-certbot-nginx \
    net-tools

# Step 8: Configure firewall
echo -e "${GREEN}🔥 Configuring firewall...${NC}"
ufw --force enable
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 5000/tcp  # Backend API (restrict this later)
ufw allow 5432/tcp  # Database (restrict this later)

# Step 9: Create environment file
echo -e "${GREEN}📝 Creating environment file...${NC}"
ENV_FILE="$APP_DIR/.env.$ENVIRONMENT"
if [ ! -f "$ENV_FILE" ]; then
    if [ "$ENVIRONMENT" = "production" ]; then
        cat > "$ENV_FILE" << 'EOF'
# Production Environment
NODE_ENV=production
PORT=5000
CLIENT_URL=https://your-domain.com

# Database
DB_HOST=db
DB_PORT=5432
DB_NAME=hospital_platform
DB_USER=postgres
DB_PASSWORD=CHANGE_ME_STRONG_PASSWORD

# Auth
JWT_SECRET=CHANGE_ME_STRONG_SECRET_MIN_32_CHARS
JWT_EXPIRES_IN=7d

# Deployment URLs
API_URL=https://your-domain.com/api
SOCKET_URL=https://your-domain.com
CLIENT_URL=https://your-domain.com

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your-client-id-here
EOF
    else
        cat > "$ENV_FILE" << 'EOF'
# Staging Environment
NODE_ENV=staging
PORT=5000
CLIENT_URL=http://staging.example.com

# Database
DB_HOST=db
DB_PORT=5432
DB_NAME=hospital_platform_staging
DB_USER=postgres
DB_PASSWORD=CHANGE_ME_STAGING_PASSWORD

# Auth
JWT_SECRET=CHANGE_ME_STAGING_SECRET
JWT_EXPIRES_IN=7d

# Deployment
STAGING_DOMAIN=staging.example.com

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your-client-id-here
EOF
    fi
    
    chown $DEPLOY_USER:$DEPLOY_USER "$ENV_FILE"
    chmod 600 "$ENV_FILE"
    echo "✓ Created $ENV_FILE"
    echo -e "${YELLOW}⚠️  IMPORTANT: Edit $ENV_FILE and update with your actual values${NC}"
else
    echo "✓ $ENV_FILE already exists"
fi

# Step 10: Log rotation
echo -e "${GREEN}📋 Setting up log rotation...${NC}"
cat > /etc/logrotate.d/hospital-platform << EOF
$APP_DIR/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 $DEPLOY_USER $DEPLOY_USER
    sharedscripts
}
EOF

# Step 11: Setup cron for database backups (production only)
if [ "$ENVIRONMENT" = "production" ]; then
    echo -e "${GREEN}💾 Setting up database backups...${NC}"
    BACKUP_SCRIPT="$APP_DIR/backup-db.sh"
    cat > "$BACKUP_SCRIPT" << 'EOFBACKUP'
#!/bin/bash
APP_DIR=/home/deploy/hospital-digital-platform
BACKUP_DIR=$APP_DIR/backups
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

cd $APP_DIR
docker compose -f docker-compose.prod.yml exec -T db pg_dump -U postgres hospital_platform | \
    gzip > $BACKUP_DIR/backup_$TIMESTAMP.sql.gz

# Keep only last 30 days
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +30 -delete
EOFBACKUP
    
    chmod +x "$BACKUP_SCRIPT"
    chown $DEPLOY_USER:$DEPLOY_USER "$BACKUP_SCRIPT"
    
    # Add to cron (run daily at 2 AM)
    (crontab -u $DEPLOY_USER -l 2>/dev/null || true; echo "0 2 * * * $BACKUP_SCRIPT") | crontab -u $DEPLOY_USER -
    echo "✓ Database backup scheduled daily at 2 AM"
fi

# Summary
echo ""
echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Add SSH public key to: $DEPLOY_HOME/.ssh/authorized_keys"
echo "2. Run: chmod 600 $DEPLOY_HOME/.ssh/authorized_keys"
echo "3. Edit environment file: $ENV_FILE"
if [ "$ENVIRONMENT" = "production" ]; then
    echo "4. Generate SSL certificate: certbot certonly --standalone -d your-domain.com"
    echo "5. Copy certificate to: $APP_DIR/ssl/"
fi
echo "6. Configure GitHub Secrets in repository settings"
echo "7. Trigger deployment via GitHub Actions"
echo ""
echo "Useful commands:"
echo "  su - $DEPLOY_USER              # Switch to deploy user"
echo "  cd $APP_DIR                     # Go to app directory"
echo "  docker compose -f docker-compose.$ENVIRONMENT.yml logs -f  # View logs"
echo ""
