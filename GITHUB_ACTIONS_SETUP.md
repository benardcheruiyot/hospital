# GitHub Actions & CI/CD Configuration Guide

This guide walks you through setting up GitHub Actions for CI/CD with automatic testing, building, and deployment.

## 📋 Table of Contents

1. [Initial Setup](#initial-setup)
2. [GitHub Secrets Configuration](#github-secrets-configuration)
3. [GitHub Environments Setup](#github-environments-setup)
4. [Deployment Server Prerequisites](#deployment-server-prerequisites)
5. [Testing the Pipeline](#testing-the-pipeline)
6. [Monitoring Deployments](#monitoring-deployments)

---

## 🚀 Initial Setup

### 1. Enable GitHub Actions

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Actions** → **General**
3. Under "Actions permissions", select "Allow all actions and reusable workflows"
4. Save changes

### 2. Verify Workflow Files

The following workflow files should be in `.github/workflows/`:

- `ci.yml` - Linting and testing
- `build-push.yml` - Building and pushing Docker images
- `deploy.yml` - Deployment workflow

All workflows are automatically detected by GitHub and will run based on their triggers.

---

## 🔐 GitHub Secrets Configuration

Secrets are used to store sensitive information like passwords, API keys, and SSH keys.

### How to Add Secrets

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Click "New repository secret"
3. Enter the secret name and value
4. Click "Add secret"

### Required Secrets (Repository-level)

These are used by the build and push workflows:

```
GITHUB_TOKEN       # Automatically provided by GitHub Actions
```

No additional repository-level secrets needed for container registry—GHCR uses automatic authentication.

---

## 🌍 GitHub Environments Setup

Environments provide per-environment secrets and protection rules.

### Creating Environments

1. Go to **Settings** → **Environments**
2. Click "New environment"
3. Name it: `staging` or `production`
4. Add environment-specific secrets
5. (Optional) Add deployment protection rules

### Staging Environment

**Environment name:** `staging`

**Add these secrets:**

| Secret Name | Description | Example |
|------------|-------------|---------|
| `DEPLOY_HOST` | Staging server hostname | `staging.example.com` |
| `DEPLOY_USER` | SSH user for deployment | `deploy` |
| `DEPLOY_KEY` | SSH private key for authentication | (see below) |

**Protection Rules (Optional but Recommended):**
- ✅ "Require reviewers" - At least 1 review before deployment
- ✅ "Deployment branches" - Selected branches only (e.g., `develop`)

### Production Environment

**Environment name:** `production`

**Add these secrets:**

| Secret Name | Description | Example |
|------------|-------------|---------|
| `DEPLOY_HOST` | Production server hostname | `prod.example.com` |
| `DEPLOY_USER` | SSH user for deployment | `deploy` |
| `DEPLOY_KEY` | SSH private key for authentication | (see below) |
| `JWT_SECRET` | JWT signing secret | Generate: `openssl rand -hex 32` |
| `DB_PASSWORD` | Database password | Generate: `openssl rand -hex 16` |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | From Google Cloud Console |
| `CLIENT_URL` | Frontend URL | `https://prod.example.com` |
| `API_URL` | API URL | `https://prod.example.com/api` |
| `SOCKET_URL` | Socket.IO URL | `https://prod.example.com` |

**Protection Rules (Recommended):**
- ✅ "Require reviewers" - At least 1 review before deployment
- ✅ "Dismiss stale pull request approvals" - Checked
- ✅ "Require status checks to pass before deployment" - All CI checks
- ✅ "Deployment branches" - Only `main` branch

---

## 🔑 SSH Key Generation & Setup

### Generate SSH Key Pair

On your local machine:

```bash
# Generate a new SSH key pair (no passphrase)
ssh-keygen -t rsa -b 4096 -f deploy_key -N ""

# This creates:
# deploy_key      (private key - for GitHub Secret)
# deploy_key.pub  (public key - for server)
```

### Add Public Key to Server

```bash
# Copy the public key to your deployment server
ssh-copy-id -i deploy_key.pub deploy@your.server.com

# Or manually:
# 1. Cat the public key
cat deploy_key.pub

# 2. SSH to server and add to authorized_keys
ssh deploy@your.server.com
mkdir -p ~/.ssh
echo "YOUR_PUBLIC_KEY" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh
```

### Add Private Key to GitHub Secret

```bash
# Copy private key content to clipboard
cat deploy_key | pbcopy  # macOS
# or
wsl-copy < deploy_key    # Windows WSL
# or manually open and copy the file content

# 1. Go to GitHub Settings → Secrets → New Secret
# 2. Name: DEPLOY_KEY
# 3. Paste private key content
# 4. Add secret
```

---

## 🖥️ Deployment Server Prerequisites

Before running deployments, ensure your server is set up:

### Quick Setup (Automated)

```bash
# On your server (as root):
curl -fsSL https://raw.githubusercontent.com/benardcheruiyot/hospital/main/scripts/setup-server.sh | bash -s staging
# or for production:
curl -fsSL https://raw.githubusercontent.com/benardcheruiyot/hospital/main/scripts/setup-server.sh | bash -s production
```

### Manual Setup

If you prefer manual setup:

1. **Install Docker & Docker Compose**
   ```bash
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   sudo usermod -aG docker deploy
   ```

2. **Create deployment directories**
   ```bash
   sudo mkdir -p /home/deploy/hospital-platform/{ssl,backups,logs}
   sudo chown -R deploy:deploy /home/deploy/hospital-platform
   ```

3. **Configure environment file**
   ```bash
   # Copy and edit environment file
   cp .env.staging.example /home/deploy/hospital-platform/.env.staging
   # or
   cp .env.prod.example /home/deploy/hospital-platform/.env.prod
   
   # Edit with actual values
   vi /home/deploy/hospital-platform/.env.staging
   ```

4. **SSL Certificate (Production Only)**
   ```bash
   sudo certbot certonly --standalone -d your-domain.com
   sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem ~/hospital-platform/ssl/fullchain.pem
   sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem ~/hospital-platform/ssl/privkey.pem
   sudo chown deploy:deploy ~/hospital-platform/ssl/*
   ```

---

## 🧪 Testing the Pipeline

### Test 1: Verify CI Workflow

1. Create a feature branch:
   ```bash
   git checkout -b test/ci-workflow
   ```

2. Make a small change to trigger CI:
   ```bash
   echo "# Testing CI" >> README.md
   git add README.md
   git commit -m "test: trigger CI workflow"
   git push origin test/ci-workflow
   ```

3. Create a Pull Request
   - Go to GitHub → Pull Requests → New
   - The CI workflow should run automatically
   - Watch for "All checks passed"

4. Merge or close the PR

### Test 2: Verify Build & Push Workflow

1. Push to `develop` branch:
   ```bash
   git checkout develop
   git push origin develop
   ```

2. Go to **Actions** tab
   - Watch for "Build & Push Docker Images" workflow
   - Wait for completion (5-10 minutes)
   - Verify images are pushed to GHCR

3. View images:
   ```bash
   # In your repository
   go to Packages → Container Registry
   ```

### Test 3: Manual Deployment (Staging)

1. Go to **Actions** → **Deploy to Production**
2. Click **Run workflow**
3. Set:
   - Version: `develop`
   - Environment: `staging`
4. Click "Run workflow"
5. Watch logs for completion

### Test 4: Verify Deployment

```bash
# SSH to staging server
ssh deploy@staging.example.com

# Check services
cd hospital-platform
docker compose -f docker-compose.staging.yml ps

# View logs
docker compose -f docker-compose.staging.yml logs --tail=50

# Test API
curl http://staging.example.com/api/health
```

---

## 📊 Monitoring Deployments

### GitHub Actions

1. Go to **Actions** tab
2. Select workflow to view
3. Click on a workflow run to see details
4. Click on a job to see logs

**Status Badges:**
- 🟢 Green = Success
- 🟡 Yellow = In Progress
- 🔴 Red = Failed

### Deployment Server

```bash
# View real-time logs
docker compose -f docker-compose.prod.yml logs -f

# View specific service
docker compose -f docker-compose.prod.yml logs -f backend

# View services status
docker compose -f docker-compose.prod.yml ps

# Check database connection
docker compose -f docker-compose.prod.yml exec db psql -U postgres -c "SELECT version();"
```

### Health Checks

```bash
# API health
curl https://your-domain.com/api/health

# Frontend accessibility
curl -I https://your-domain.com

# Check all services
docker compose -f docker-compose.prod.yml exec backend curl http://localhost:5000/api/health
```

---

## 🆘 Troubleshooting

### Issue: "SSH Key Permission Denied"

**Solution:**
```bash
# Verify permissions on server
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys

# Test SSH from CI environment
ssh -i ~/.ssh/deploy_key deploy@host
```

### Issue: "Docker Images Not Found"

**Solution:**
```bash
# Check if build workflow ran
# Go to Actions → Build & Push → Check logs

# If images weren't pushed, manually login to GHCR:
echo ${{ secrets.GITHUB_TOKEN }} | docker login ghcr.io -u ${{ github.actor }} --password-stdin
```

### Issue: "Deployment Fails with 'Service Unhealthy'"

**Solution:**
```bash
# SSH to server and check logs
docker compose -f docker-compose.prod.yml logs backend
docker compose -f docker-compose.prod.yml logs db

# Check database connectivity
docker compose -f docker-compose.prod.yml exec backend curl http://db:5432

# Restart services
docker compose -f docker-compose.prod.yml restart
```

### Issue: "Port Already in Use"

**Solution:**
```bash
# Find process using the port
sudo lsof -i :5000

# Stop the container and restart
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d
```

---

## 📝 Useful Commands

```bash
# View workflow file syntax
gh workflow view ci.yml

# Trigger workflow manually
gh workflow run deploy.yml -f version=main -f environment=production

# View recent runs
gh run list --workflow=deploy.yml

# View specific run logs
gh run view RUN_ID --log

# Create secrets from command line
gh secret set DEPLOY_KEY < deploy_key
```

---

## 🔄 Updating Workflows

To update workflow files:

1. Edit `.github/workflows/*.yml`
2. Commit and push to repository
3. GitHub automatically detects and uses new workflows
4. No additional setup needed

To test workflow changes safely:
```bash
# Create a test branch
git checkout -b test/workflow-changes
# Make changes
git push origin test/workflow-changes
# Create PR to see workflows run in "pull_request" trigger
```

---

## 📚 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [GitHub Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [GitHub Environments](https://docs.github.com/en/actions/deployment/targeting-different-environments/using-environments-for-deployment)
- [Docker Container Registry (GHCR)](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)

---

## ❓ FAQ

**Q: Do I need to pay for GitHub Actions?**
A: GitHub Actions includes free minutes for public repositories (unlimited for private repos after initial setup).

**Q: Can I use a different container registry?**
A: Yes, modify the `REGISTRY` variable in `.github/workflows/build-push.yml` to use Docker Hub, ECR, etc.

**Q: What if deployment fails?**
A: Check the workflow logs in the Actions tab and deployment server logs via SSH.

**Q: How do I rollback to a previous version?**
A: SSH to server and run `docker compose -f docker-compose.prod.yml down && docker compose -f docker-compose.prod.yml up -d` with the previous image tag.

---

For more help, check the [main DEPLOYMENT.md](./DEPLOYMENT.md) guide.
