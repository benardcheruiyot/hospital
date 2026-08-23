# Deployment Troubleshooting Guide

This guide helps you resolve common deployment issues, especially permission-related errors.

## Common Errors & Solutions

### Error: `mkdir: cannot create directory '/home/runner': Permission denied`

**Root Cause:**
- The deploy user's home directory doesn't exist or has incorrect permissions
- The setup-server.sh script wasn't run properly on the remote server
- The deploy user wasn't created with proper home directory initialization

**Solution:**

#### Option 1: Re-run the setup script (Recommended)

SSH into your server as root and re-run the automated setup:

```bash
# SSH as root
ssh root@YOUR_VPS_IP

# Run the automated setup script
curl -fsSL https://raw.githubusercontent.com/benardcheruiyot/hospital/main/scripts/setup-server.sh | bash -s production
```

This will:
- Create/fix the deploy user home directory
- Set proper permissions on all directories
- Install Docker and required tools
- Create the application directories structure

#### Option 2: Manual fix (If you can't use the setup script)

SSH into your server as root and run these commands:

```bash
#!/bin/bash
DEPLOY_USER="deploy"
DEPLOY_HOME="/home/$DEPLOY_USER"
APP_DIR="$DEPLOY_HOME/hospital-digital-platform"

# Verify deploy user exists
if ! id "$DEPLOY_USER" &>/dev/null; then
  echo "Creating deploy user..."
  useradd -m -s /bin/bash $DEPLOY_USER
else
  echo "Deploy user exists"
fi

# Fix home directory permissions
if [ ! -d "$DEPLOY_HOME" ]; then
  mkdir -p "$DEPLOY_HOME"
  chown $DEPLOY_USER:$DEPLOY_USER "$DEPLOY_HOME"
  chmod 755 "$DEPLOY_HOME"
else
  chmod 755 "$DEPLOY_HOME"
  chown $DEPLOY_USER:$DEPLOY_USER "$DEPLOY_HOME"
fi

# Create application directory with proper permissions
mkdir -p "$APP_DIR"/{ssl,logs,backups}
chown -R $DEPLOY_USER:$DEPLOY_USER "$APP_DIR"
chmod 755 "$APP_DIR"

# Setup SSH directory
mkdir -p "$DEPLOY_HOME/.ssh"
chmod 700 "$DEPLOY_HOME/.ssh"
chown $DEPLOY_USER:$DEPLOY_USER "$DEPLOY_HOME/.ssh"

# Add deploy user to docker group
usermod -aG docker $DEPLOY_USER

echo "✓ Deployment directory structure fixed"
echo "Deploy user: $DEPLOY_USER"
echo "App directory: $APP_DIR"
```

#### Option 3: Verify permissions after setup

After running the setup script, verify everything is correct:

```bash
# SSH as root
ssh root@YOUR_VPS_IP

# Check deploy user
id deploy

# Check home directory
ls -la /home/deploy

# Check app directory
ls -la /home/deploy/hospital-digital-platform/

# Check SSH directory
ls -la /home/deploy/.ssh
```

**Expected output:**
```
drwxr-xr-x  deploy deploy  /home/deploy
drwxr-xr-x  deploy deploy  /home/deploy/hospital-digital-platform
drwxr-xr-x  deploy deploy  /home/deploy/hospital-digital-platform/ssl
drwxr-xr-x  deploy deploy  /home/deploy/hospital-digital-platform/logs
drwxr-xr-x  deploy deploy  /home/deploy/hospital-digital-platform/backups
drwx------  deploy deploy  /home/deploy/.ssh
```

---

## Pre-Deployment Checklist

Before running the GitHub Actions deployment workflow, verify:

### 1. Server Setup
- [ ] SSH access to server works: `ssh -i ~/.ssh/deploy_key deploy@YOUR_VPS_IP`
- [ ] Deploy user exists: `id deploy` returns a valid user
- [ ] Home directory exists: `/home/deploy` is readable and writable by deploy user
- [ ] Docker is installed: `docker --version` returns a version
- [ ] Docker Compose is installed: `docker-compose --version` returns a version

### 2. GitHub Secrets
- [ ] `DEPLOY_HOST` is set to your VPS IP or domain
- [ ] `DEPLOY_USER` is set to `deploy`
- [ ] `DEPLOY_KEY` contains the full private key (with newlines preserved)
- [ ] Production secrets are set: `DB_PASSWORD`, `JWT_SECRET`, `CLIENT_URL`, `API_URL`, `SOCKET_URL`

### 3. SSH Configuration
- [ ] SSH public key added to `/home/deploy/.ssh/authorized_keys`
- [ ] Permissions are correct: `authorized_keys` has mode 600
- [ ] SSH directory has correct permissions: `~/.ssh` has mode 700

### 4. Directory Structure
- [ ] `/home/deploy/hospital-digital-platform` exists
- [ ] `/home/deploy/hospital-digital-platform/ssl` exists (for production SSL certs)
- [ ] `/home/deploy/hospital-digital-platform/logs` exists
- [ ] `/home/deploy/hospital-digital-platform/backups` exists

### 5. Environment Configuration
- [ ] `.env` file will be created by the deployment workflow (or manually placed)
- [ ] Required environment variables are in GitHub Secrets
- [ ] Database password and JWT secret are strong and random

---

## Deployment Workflow Steps

The GitHub Actions workflow performs these steps:

1. **Setup SSH** - Creates SSH key pair from GitHub Secrets
2. **Verify SSH Access** - Tests SSH connection
3. **Verify home directory** - Checks deploy user home directory exists and is writable
4. **Create deployment directory** - Creates application directories (handles existing directories)
5. **Copy files** - Transfers docker-compose files and config
6. **Configure environment** - Creates .env file with secrets (production only)
7. **Deploy with Docker Compose** - Starts services and verifies health
8. **Verify deployment** - Checks application is responding

---

## Debug Mode: Manual Deployment Steps

If the workflow fails, you can run these steps manually:

```bash
# 1. SSH into your server
ssh -i ~/.ssh/deploy_key deploy@YOUR_VPS_IP

# 2. Navigate to app directory
cd ~/hospital-digital-platform

# 3. Check if files exist
ls -la

# 4. View environment file
cat .env

# 5. Check Docker Compose status
docker compose ps

# 6. View logs
docker compose logs backend
docker compose logs frontend

# 7. Restart services
docker compose restart

# 8. Pull latest images
docker compose pull
docker compose up -d
```

---

## Contact & Support

For additional help:
- Review the main README.md
- Check INTERSERVER_DEPLOYMENT.md for server setup details
- Check GITHUB_ACTIONS_SETUP.md for GitHub configuration
- Review GitHub Actions logs for the full error output

