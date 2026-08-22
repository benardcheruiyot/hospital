# Quick Start: Interserver Deployment Guide

Follow these steps to deploy the Hospital Platform on your Interserver VPS.

## 🚀 5-Minute Quick Start

### 1. Get VPS Details from Interserver

From your Interserver account:
- Note your VPS **IP Address** (e.g., `123.45.67.89`)
- Default **SSH Port**: `22`
- Use **root password** from welcome email

### 2. Run Automated Setup (2 minutes)

```bash
# SSH into VPS as root
ssh root@YOUR_VPS_IP

# Download and run setup script
curl -fsSL https://raw.githubusercontent.com/benardcheruiyot/hospital/main/scripts/setup-server.sh | bash -s production
```

This automatically installs Docker, creates deploy user, configures firewall, and sets up directories.

### 3. Generate SSH Key Pair (Local Machine)

```bash
# On your local machine
ssh-keygen -t rsa -b 4096 -f ~/.ssh/hospital_deploy -N ""

# Add key to VPS
ssh-copy-id -i ~/.ssh/hospital_deploy.pub root@YOUR_VPS_IP
ssh-copy-id -i ~/.ssh/hospital_deploy.pub deploy@YOUR_VPS_IP
```

### 4. Add GitHub Secrets (1 minute)

Go to GitHub → **Settings → Environments → Production**

Add these secrets:

| Name | Value |
|------|-------|
| `DEPLOY_HOST` | `YOUR_VPS_IP` |
| `DEPLOY_USER` | `deploy` |
| `DEPLOY_KEY` | Paste content of `~/.ssh/hospital_deploy` |
| `JWT_SECRET` | Run: `openssl rand -hex 32` |
| `DB_PASSWORD` | Run: `openssl rand -hex 16` |
| `CLIENT_URL` | `http://YOUR_VPS_IP` (or your domain) |
| `API_URL` | `http://YOUR_VPS_IP/api` (or your domain) |
| `SOCKET_URL` | `http://YOUR_VPS_IP` (or your domain) |

### 5. Edit Environment Configuration

```bash
# SSH to deploy user
ssh deploy@YOUR_VPS_IP

# Edit environment file
vi ~/hospital-platform/.env.prod
```

Update these values:
```env
CLIENT_URL=http://YOUR_VPS_IP
DB_PASSWORD=<use the one from GitHub Secret>
JWT_SECRET=<use the one from GitHub Secret>
API_URL=http://YOUR_VPS_IP/api
SOCKET_URL=http://YOUR_VPS_IP
```

### 6. Deploy! 🎉

Go to GitHub → **Actions → Deploy to Production**

Click **Run workflow**:
- Version: `main`
- Environment: `production`
- Click "Run workflow"

Monitor the logs. Deployment takes 2-5 minutes.

### 7. Test

```bash
# Check services are running
curl http://YOUR_VPS_IP/api/health
# Should return: {"status":"ok"}

# Access frontend
Open browser: http://YOUR_VPS_IP

# Login with default credentials
Email: admin@hospital-platform.local
Password: admin
```

---

## 🔒 With Custom Domain (Optional)

If you have a domain name (e.g., `hospital.example.com`):

```bash
# SSH as root
ssh root@YOUR_VPS_IP

# Install SSL certificate
apt-get install -y certbot
certbot certonly --standalone -d hospital.example.com

# Copy certificate
cp /etc/letsencrypt/live/hospital.example.com/fullchain.pem \
   /home/deploy/hospital-platform/ssl/fullchain.pem
cp /etc/letsencrypt/live/hospital.example.com/privkey.pem \
   /home/deploy/hospital-platform/ssl/privkey.pem
chown deploy:deploy /home/deploy/hospital-platform/ssl/*
```

Update GitHub Secrets:
```
CLIENT_URL = https://hospital.example.com
API_URL = https://hospital.example.com/api
SOCKET_URL = https://hospital.example.com
```

Redeploy via GitHub Actions.

---

## 📋 Useful Commands

```bash
# View services status
ssh deploy@YOUR_VPS_IP
cd ~/hospital-platform
docker compose -f docker-compose.prod.yml ps

# View logs
docker compose -f docker-compose.prod.yml logs -f backend

# Restart services
docker compose -f docker-compose.prod.yml restart

# Update application
# Push code → GitHub Actions Deploy workflow → watch logs
```

---

## ❓ Common Issues

| Issue | Solution |
|-------|----------|
| SSH connection fails | Verify SSH key: `ssh -i ~/.ssh/hospital_deploy deploy@YOUR_VPS_IP` |
| Docker not found | SSH session needs refresh. Exit and reconnect. |
| Port already in use | Likely old container running. Run: `docker compose down && docker compose up -d` |
| Database connection error | Give it 30 seconds after deployment. Check: `docker compose logs db` |

---

## 📚 Full Documentation

For detailed setup and troubleshooting, see:
- [INTERSERVER_DEPLOYMENT.md](./INTERSERVER_DEPLOYMENT.md) - Complete Interserver guide
- [DEPLOYMENT.md](./DEPLOYMENT.md) - General deployment documentation
- [GITHUB_ACTIONS_SETUP.md](./GITHUB_ACTIONS_SETUP.md) - GitHub Actions configuration

---

## ✅ You're Done!

Your application is now:
- ✅ Running on Interserver VPS
- ✅ Auto-deployable via GitHub Actions
- ✅ Backed up daily
- ✅ Accessible at `http://YOUR_VPS_IP`

**Login & test it now!** 🏥
