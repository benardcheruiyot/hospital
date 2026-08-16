# CI/CD Setup & Deployment Guide

This document describes the complete CI/CD pipeline for the Hospital Digital Platform.

## 📋 Architecture Overview

```
GitHub Repository
    ↓
CI Pipeline (GitHub Actions)
    ├─ Lint & Test (on PR/push)
    ├─ Build Docker Images (on main/develop)
    ├─ Push to Docker Registry (GitHub Container Registry)
    └─ Deploy (manual trigger)
         ├─ Staging Environment
         └─ Production Environment
```

## 🔄 Workflows

### 1. CI Workflow (`ci.yml`)

Runs on every push and pull request to test code quality.

**Triggers:**
- Push to: `main`, `develop`, `chore/upgrade-deps-2026`
- Pull requests to: `main`, `develop`

**Jobs:**
- **backend-lint**: Runs ESLint on backend code
- **frontend-lint**: Runs ESLint and builds frontend
- **frontend-tests**: Runs Playwright E2E tests

**Artifacts:**
- Playwright test results (30-day retention)

### 2. Build & Push Workflow (`build-push.yml`)

Builds Docker images and pushes them to GitHub Container Registry.

**Triggers:**
- Push to: `main`, `develop`
- Tagged releases: `v*`
- Manual workflow dispatch

**Images Published:**
```
ghcr.io/benardcheruiyot/hospital/backend:TAG
ghcr.io/benardcheruiyot/hospital/frontend:TAG
```

**Tag Strategy:**
- Branch: `develop`, `main`
- Semver tags: `v1.0.0` → `1.0.0`, `1.0`
- Commit SHA: `develop-abc123def`
- Latest: Applied to default branch (main)

### 3. Deploy Workflow (`deploy.yml`)

Deploys to staging or production environments.

**Triggers:**
- Manual workflow dispatch

**Inputs:**
- Version to deploy (tag, branch, or commit)
- Target environment (staging/production)

**Requirements:**
- SSH access to deployment server
- GitHub Environment secrets configured

---

## 🚀 Getting Started

### Prerequisites

1. **GitHub Repository Setup**
   ```bash
   # Ensure you're on a branch with workflows
   git checkout main
   git pull origin main
   ```

2. **Container Registry Access**
   - GitHub Container Registry (GHCR) is used by default
   - No additional setup needed—uses repository secrets

3. **Deployment Server** (for production/staging)
   - SSH access available
   - Docker & Docker Compose installed
   - PostgreSQL database accessible or containerized

### Step 1: Configure GitHub Environments

Add these GitHub Secrets for your environments:

**Settings → Secrets and variables → Actions**

#### Staging Environment
```
DEPLOY_HOST          = staging.example.com
DEPLOY_USER          = deploy
DEPLOY_KEY           = (SSH private key)
```

#### Production Environment
```
DEPLOY_HOST          = prod.example.com
DEPLOY_USER          = deploy
DEPLOY_KEY           = (SSH private key)
JWT_SECRET           = (strong random string)
DB_PASSWORD          = (strong random string)
GOOGLE_CLIENT_ID     = (from Google Cloud Console)
CLIENT_URL           = https://prod.example.com
API_URL              = https://prod.example.com/api
SOCKET_URL           = https://prod.example.com
```

### Step 2: Set Up Deployment Server

On your deployment server:

```bash
# Create deployment user
sudo useradd -m -s /bin/bash deploy

# Add SSH public key
mkdir -p /home/deploy/.ssh
echo "YOUR_PUBLIC_KEY" >> /home/deploy/.ssh/authorized_keys
chmod 600 /home/deploy/.ssh/authorized_keys
chmod 700 /home/deploy/.ssh
chown -R deploy:deploy /home/deploy/.ssh

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker deploy

# Create application directory
sudo mkdir -p /home/deploy/hospital-platform
sudo chown deploy:deploy /home/deploy/hospital-platform
```

### Step 3: Create Environment Files

Create `.env.staging` and `.env.prod` on your deployment server:

**Staging (.env.staging):**
```bash
DB_NAME=hospital_platform_staging
DB_USER=postgres
DB_PASSWORD=staging_password_here
STAGING_DOMAIN=staging.example.com
JWT_SECRET=staging_jwt_secret_here
```

**Production (.env.prod):**
```bash
DB_NAME=hospital_platform
DB_USER=postgres
DB_PASSWORD=production_password_here
CLIENT_URL=https://prod.example.com
API_URL=https://prod.example.com/api
SOCKET_URL=https://prod.example.com
JWT_SECRET=production_jwt_secret_here
GOOGLE_CLIENT_ID=your_google_client_id
```

### Step 4: Generate SSL Certificates

For production with Nginx:

```bash
# Using Let's Encrypt with Certbot
sudo apt-get install certbot python3-certbot-nginx
sudo certbot certonly --standalone -d prod.example.com

# Copy certificates to your application directory
sudo cp /etc/letsencrypt/live/prod.example.com/fullchain.pem ~/hospital-platform/ssl/cert.pem
sudo cp /etc/letsencrypt/live/prod.example.com/privkey.pem ~/hospital-platform/ssl/key.pem
sudo chown deploy:deploy ~/hospital-platform/ssl/*
```

---

## 📦 Docker Compose Files

### Development (`docker-compose.yml`)
- Local development setup
- Database, backend, frontend all containerized
- Hot reload enabled

### Staging (`docker-compose.staging.yml`)
- Staging environment deployment
- Uses `develop` branch images
- Database persistence enabled
- Health checks configured

### Production (`docker-compose.prod.yml`)
- Production environment deployment
- Uses `latest` branch images
- Nginx reverse proxy for SSL/TLS
- Comprehensive logging and monitoring
- Database backups directory
- Health checks with service startup delays

---

## 🚢 Deployment Process

### Manual Deployment

1. **Via GitHub UI:**
   - Go to Actions → Deploy to Production
   - Click "Run workflow"
   - Select version and environment
   - Click "Run workflow"

2. **Via GitHub CLI:**
   ```bash
   gh workflow run deploy.yml \
     -f version=main \
     -f environment=production
   ```

### Automatic Deployment (Optional)

To enable automatic deployment on push to main:

Edit `.github/workflows/deploy.yml` and add:

```yaml
on:
  push:
    branches: [main]
    paths:
      - 'backend/**'
      - 'frontend/**'
      - 'docker-compose.prod.yml'
```

### Rollback Procedure

If deployment fails or issues arise:

```bash
# SSH to server
ssh deploy@prod.example.com

cd ~/hospital-platform

# View deployment history
docker compose -f docker-compose.prod.yml ps

# Restart with previous version
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d

# Check logs
docker compose -f docker-compose.prod.yml logs -f
```

---

## 📊 Monitoring & Logs

### View Deployment Logs

**GitHub Actions:**
- Go to Actions tab → Select workflow → View logs

**On Deployment Server:**
```bash
# Real-time logs
ssh deploy@prod.example.com
cd ~/hospital-platform
docker compose -f docker-compose.prod.yml logs -f

# Specific service
docker compose -f docker-compose.prod.yml logs -f backend

# Last 50 lines
docker compose -f docker-compose.prod.yml logs --tail=50
```

### Health Checks

```bash
# API health
curl https://prod.example.com/api/health

# Service status
docker compose -f docker-compose.prod.yml ps
```

---

## 🔐 Security Best Practices

1. **Environment Variables:**
   - Never commit `.env` files
   - Use GitHub Secrets for sensitive data
   - Rotate secrets regularly

2. **SSH Keys:**
   - Use dedicated deploy user with limited permissions
   - Never commit private keys to repository
   - Restrict SSH to specific IPs if possible

3. **Database:**
   - Use strong passwords
   - Enable PostgreSQL connection SSL
   - Regular automated backups
   - Restrict database access to backend service only

4. **SSL/TLS:**
   - Always use HTTPS in production
   - Enable HTTP→HTTPS redirect
   - Use security headers (HSTS, CSP, etc.)
   - Keep certificates updated

5. **Secrets Management:**
   - Use GitHub Environments for per-environment secrets
   - Enable branch protection rules
   - Require status checks before merge

---

## 🛠️ Troubleshooting

### Build Fails: "Module not found"
```bash
# Clear npm cache and rebuild
cd backend
npm ci --omit=dev
```

### Deployment Fails: SSH Connection Error
```bash
# Verify SSH key permissions
chmod 600 ~/.ssh/deploy_key

# Test SSH connection
ssh -i ~/.ssh/deploy_key deploy@host
```

### Container Won't Start: Port Already in Use
```bash
# Find process using port
sudo lsof -i :5000

# Kill process or change port in env
docker compose -f docker-compose.prod.yml down
```

### Database Connection Error
```bash
# Verify database is running
docker compose -f docker-compose.prod.yml ps

# Check database logs
docker compose -f docker-compose.prod.yml logs db

# Restart database
docker compose -f docker-compose.prod.yml down db
docker compose -f docker-compose.prod.yml up -d db
```

---

## 📝 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [PostgreSQL Backups](https://www.postgresql.org/docs/current/backup.html)

---

## 📞 Support

For issues or questions:
1. Check the logs in GitHub Actions
2. Review deployment server logs
3. Check Docker service status
4. Verify environment variables are set correctly
