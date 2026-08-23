#!/bin/bash

# Hospital Platform - Emergency Permissions Fix Script
# Run this on the deployment server as root if you encounter permission issues
# Usage: bash fix-permissions.sh

set -e

echo "🔐 Hospital Platform - Fixing Permissions"
echo "=========================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo -e "${RED}This script must be run as root${NC}"
   exit 1
fi

DEPLOY_USER="deploy"
DEPLOY_HOME="/home/$DEPLOY_USER"
APP_DIR="$DEPLOY_HOME/hospital-digital-platform"

echo -e "${YELLOW}Fixing permissions for:${NC}"
echo "  User: $DEPLOY_USER"
echo "  Home: $DEPLOY_HOME"
echo "  App:  $APP_DIR"
echo ""

# Step 1: Verify deploy user exists
echo -e "${GREEN}1️⃣  Checking deploy user...${NC}"
if id "$DEPLOY_USER" &>/dev/null; then
    echo "✓ Deploy user exists"
else
    echo -e "${RED}✗ Deploy user does not exist - creating it${NC}"
    useradd -m -s /bin/bash $DEPLOY_USER
    echo "✓ Created deploy user"
fi

# Step 2: Fix home directory
echo -e "${GREEN}2️⃣  Fixing home directory permissions...${NC}"
if [ ! -d "$DEPLOY_HOME" ]; then
    echo "✗ Home directory does not exist - creating it"
    mkdir -p "$DEPLOY_HOME"
fi
chown $DEPLOY_USER:$DEPLOY_USER "$DEPLOY_HOME"
chmod 755 "$DEPLOY_HOME"
echo "✓ Home directory: $DEPLOY_HOME (mode 755, owner $DEPLOY_USER:$DEPLOY_USER)"

# Step 3: Fix SSH directory
echo -e "${GREEN}3️⃣  Fixing SSH directory...${NC}"
mkdir -p "$DEPLOY_HOME/.ssh"
chmod 700 "$DEPLOY_HOME/.ssh"
chown $DEPLOY_USER:$DEPLOY_USER "$DEPLOY_HOME/.ssh"
echo "✓ SSH directory: $DEPLOY_HOME/.ssh (mode 700)"

if [ -f "$DEPLOY_HOME/.ssh/authorized_keys" ]; then
    chmod 600 "$DEPLOY_HOME/.ssh/authorized_keys"
    chown $DEPLOY_USER:$DEPLOY_USER "$DEPLOY_HOME/.ssh/authorized_keys"
    echo "✓ authorized_keys: (mode 600)"
fi

# Step 4: Fix application directory
echo -e "${GREEN}4️⃣  Fixing application directory...${NC}"
if [ ! -d "$APP_DIR" ]; then
    echo "Creating application directory structure..."
    mkdir -p "$APP_DIR"/{ssl,logs,backups}
fi

# Create subdirectories if they don't exist
for subdir in ssl logs backups; do
    if [ ! -d "$APP_DIR/$subdir" ]; then
        mkdir -p "$APP_DIR/$subdir"
        echo "  Created: $APP_DIR/$subdir"
    fi
done

# Fix permissions recursively
chown -R $DEPLOY_USER:$DEPLOY_USER "$APP_DIR"
find "$APP_DIR" -type d -exec chmod 755 {} \;
find "$APP_DIR" -type f -exec chmod 644 {} \;

# Preserve 600 permissions for .env files
for envfile in "$APP_DIR"/.env*; do
    if [ -f "$envfile" ]; then
        chmod 600 "$envfile"
    fi
done

echo "✓ Application directory: $APP_DIR"
echo "  - Directories: mode 755"
echo "  - Files: mode 644"
echo "  - .env files: mode 600"
echo "  - Owner: $DEPLOY_USER:$DEPLOY_USER"

# Step 5: Fix Docker group
echo -e "${GREEN}5️⃣  Adding deploy user to Docker group...${NC}"
if getent group docker > /dev/null; then
    usermod -aG docker $DEPLOY_USER
    echo "✓ Deploy user added to docker group"
else
    echo "⚠ Docker group not found"
fi

# Step 6: Verify permissions
echo ""
echo -e "${GREEN}6️⃣  Verification${NC}"
echo "─────────────────────────────────────────"
echo "Home directory:"
ls -ld "$DEPLOY_HOME"
echo ""

echo "Application directory:"
ls -ld "$APP_DIR"
echo ""

echo "Subdirectories:"
ls -ld "$APP_DIR"/*
echo ""

if [ -d "$DEPLOY_HOME/.ssh" ]; then
    echo "SSH directory:"
    ls -ld "$DEPLOY_HOME/.ssh"
fi
echo ""

# Step 7: Test SSH access
echo -e "${GREEN}7️⃣  Testing SSH access...${NC}"
echo "To test SSH access as the deploy user, run:"
echo "  su - $DEPLOY_USER"
echo "  pwd"
echo "  mkdir -p test-dir"
echo "  rm -rf test-dir"
echo ""

echo -e "${GREEN}✅ Permissions fixed successfully!${NC}"
echo ""
echo "Next steps:"
echo "1. Ensure SSH public key is in: $DEPLOY_HOME/.ssh/authorized_keys"
echo "2. Test SSH login: ssh -i ~/.ssh/deploy_key $DEPLOY_USER@your-server-ip"
echo "3. Retry the GitHub Actions deployment workflow"
