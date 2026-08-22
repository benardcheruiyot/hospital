# TerraLink Health - Deployment Configuration

**Domain:** terralinkhealth.co.ke  
**VPS Provider:** Interserver  
**VPS IP:** 53.75.247.188  
**Deployment Date:** 2026-08-16

---

## 🚀 Step 1: Connect to Your Interserver VPS

```bash
# SSH into your VPS as root
ssh root@53.75.247.188

# Update system
apt-get update
apt-get upgrade -y
```

**First-time setup:**
- Use the **root password** from your Interserver welcome email
- After login, you can set up key-based authentication

---

## 📋 Step 2: Run Automated Setup

```bash
# As root, download and execute the setup script
curl -fsSL https://raw.githubusercontent.com/benardcheruiyot/hospital/main/scripts/setup-server.sh | bash -s production
```

This automatically:
- ✅ Installs Docker & Docker Compose
- ✅ Creates `deploy` user
- ✅ Configures firewall
- ✅ Sets up application directories
- ✅ Creates environment file template

**Time:** ~5 minutes

---

## 🔐 Step 3: Set Up SSH Key Authentication

On your **local machine**:

```bash
# Generate SSH key pair
ssh-keygen -t rsa -b 4096 -f ~/.ssh/terralink_deploy -N ""

# Copy public key to root user
ssh-copy-id -i ~/.ssh/terralink_deploy.pub root@53.75.247.188

# Copy public key to deploy user
ssh-copy-id -i ~/.ssh/terralink_deploy.pub deploy@53.75.247.188

# Test SSH connection
ssh -i ~/.ssh/terralink_deploy deploy@53.75.247.188 "whoami"
# Should output: deploy
```

---

## 🎯 Step 4: Configure GitHub Secrets

Go to **GitHub Repository → Settings → Secrets and variables → Environments**

### Create "production" Environment with these secrets:

```
DEPLOY_HOST  = 53.75.247.188
DEPLOY_USER  = deploy
DEPLOY_KEY   = (paste content of ~/.ssh/terralink_deploy)

JWT_SECRET           = (generate: openssl rand -hex 32)
DB_PASSWORD          = (generate: openssl rand -hex 16)
GOOGLE_CLIENT_ID     = (optional)
CLIENT_URL           = https://terralinkhealth.co.ke
API_URL              = https://terralinkhealth.co.ke/api
SOCKET_URL           = https://terralinkhealth.co.ke
```

**Generate secrets on your machine:**
```bash
# Generate JWT_SECRET
openssl rand -hex 32
# Copy the output

# Generate DB_PASSWORD
openssl rand -hex 16
# Copy the output
```

---

## 🌐 Step 5: Point Domain to VPS

**In HostPinnacle DNS Settings:**

1. Go to **DNS Management** for terralinkhealth.co.ke
2. Add/Update these DNS records:

```
Type: A
Name: @ (or blank)
Value: 53.75.247.188
TTL: 3600

Type: A
Name: www
Value: 53.75.247.188
TTL: 3600
```

**Wait 5-15 minutes for DNS to propagate**

Verify DNS resolution:
```bash
# On your local machine
nslookup terralinkhealth.co.ke
# Should show: 53.75.247.188

# or
dig terralinkhealth.co.ke
```

---

## 🔒 Step 6: Install SSL Certificate

```bash
# SSH to VPS as root
ssh -i ~/.ssh/terralink_deploy root@53.75.247.188

# Install Certbot
apt-get install -y certbot

# Generate SSL certificate
certbot certonly --standalone -d terralinkhealth.co.ke -d www.terralinkhealth.co.ke

# Follow prompts:
# - Enter email when asked
# - Accept terms
# - Certificate will be generated

# Copy certificates to app directory
cp /etc/letsencrypt/live/terralinkhealth.co.ke/fullchain.pem /home/deploy/hospital-platform/ssl/fullchain.pem
cp /etc/letsencrypt/live/terralinkhealth.co.ke/privkey.pem /home/deploy/hospital-platform/ssl/privkey.pem
chown deploy:deploy /home/deploy/hospital-platform/ssl/*

# Verify certificates
ls -la /home/deploy/hospital-platform/ssl/
```

---

## ⚙️ Step 7: Configure Environment File

```bash
# SSH to VPS as deploy user
ssh -i ~/.ssh/terralik_deploy deploy@53.75.247.188

# Edit environment configuration
vi ~/hospital-platform/.env.prod
```

**Update with these values:**

```env
# Server
NODE_ENV=production
PORT=5000
CLIENT_URL=https://terralinkhealth.co.ke

# Database
DB_HOST=db
DB_PORT=5432
DB_NAME=hospital_platform
DB_USER=postgres
DB_PASSWORD=PASTE_YOUR_GENERATED_PASSWORD_HERE

# Authentication
JWT_SECRET=PASTE_YOUR_GENERATED_SECRET_HERE
JWT_EXPIRES_IN=7d

# Deployment URLs
API_URL=https://terralinkhealth.co.ke/api
SOCKET_URL=https://terralinkhealth.co.ke

# Google OAuth (if using)
GOOGLE_CLIENT_ID=your-client-id-here
```

**Save:** Press `Esc` → `:wq` → Enter

---

## 🚀 Step 8: Deploy Application

### Via GitHub Actions (Recommended)

1. Go to **GitHub → Actions → Deploy to Production**
2. Click **"Run workflow"**
3. Fill in:
   - **Version:** `main`
   - **Environment:** `production`
4. Click **"Run workflow"**
5. Monitor logs (takes 3-5 minutes)

### Via Command Line

```bash
# If you have GitHub CLI installed
gh workflow run deploy.yml \
  -f version=main \
  -f environment=production
```

---

## ✅ Step 9: Verify Deployment

```bash
# Check services are running
curl https://terralinkhealth.co.ke/api/health
# Expected output: {"status":"ok"}

# Check Docker services
ssh -i ~/.ssh/terralink_deploy deploy@53.75.247.188
cd ~/hospital-platform
docker compose -f docker-compose.prod.yml ps
# All services should show "Up"

# View logs
docker compose -f docker-compose.prod.yml logs -f backend
```

**Access your application:**
- Frontend: https://terralinkhealth.co.ke
- API: https://terralinkhealth.co.ke/api
- API Health: https://terralinkhealth.co.ke/api/health

---

## 👤 Step 10: Login & Customize

**Default Demo Accounts:**

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@hospital-platform.local | admin |
| Patient | patient@hospital-platform.local | patient |
| Doctor | doctor@hospital-platform.local | doctor |

**⚠️ Important Security Steps:**

1. Change all default passwords immediately
2. Create new admin account with strong password
3. Disable demo accounts or change passwords
4. Review user management in admin panel

---

## 🔄 Firewall Configuration

Verify firewall is properly configured:

```bash
# SSH as root
ssh -i ~/.ssh/terralink_deploy root@53.75.247.188

# Check firewall status
ufw status

# Should show these rules allowed:
# - 22/tcp (SSH)
# - 80/tcp (HTTP)
# - 443/tcp (HTTPS)

# If needed, enable them:
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

---

## 📊 Monitoring & Maintenance

### Regular Checks

```bash
# Check services status
ssh -i ~/.ssh/terralink_deploy deploy@53.75.247.188
cd ~/hospital-platform
docker compose -f docker-compose.prod.yml ps

# View latest logs
docker compose -f docker-compose.prod.yml logs --tail=50

# Check disk usage
df -h

# Check resource usage
docker stats
```

### Update Application

To deploy a new version after code changes:

1. Push to GitHub: `git push origin main`
2. Go to **GitHub Actions → Deploy to Production**
3. Run workflow with version `main`

### Renew SSL Certificate

SSL certificates expire every 90 days. Set automatic renewal:

```bash
# SSH as root
ssh -i ~/.ssh/terralink_deploy root@53.75.247.188

# Test renewal (doesn't actually renew yet)
certbot renew --dry-run

# Automatic renewal runs via cron (already configured)
# Check renewal status:
certbot renew --status
```

---

## 💾 Database Backups

Automatic daily backups are configured at **2 AM UTC**

### Manual Backup

```bash
ssh -i ~/.ssh/terralink_deploy deploy@53.75.247.188
cd ~/hospital-platform

# Create backup
docker compose -f docker-compose.prod.yml exec -T db pg_dump -U postgres hospital_platform | \
    gzip > backups/backup_$(date +%Y%m%d_%H%M%S).sql.gz

# List backups
ls -lh backups/
```

### Restore from Backup

```bash
cd ~/hospital-platform

# Restore from specific backup
gunzip < backups/backup_20260816_020000.sql.gz | \
    docker compose -f docker-compose.prod.yml exec -T db psql -U postgres hospital_platform
```

---

## 🆘 Troubleshooting

### Issue: "DNS not resolving"
```bash
# Wait a few minutes and test again
nslookup terralinkhealth.co.ke

# Check DNS propagation status
dig terralinkhealth.co.ke +short
# Should show: 53.75.247.188
```

### Issue: "SSL certificate error"
```bash
# Check if certificate exists
ssh -i ~/.ssh/terralink_deploy deploy@53.75.247.188
ls -la ~/hospital-platform/ssl/

# Renew certificate
ssh root@53.75.247.188
certbot renew -v
```

### Issue: "Services not starting"
```bash
# Check logs
docker compose -f docker-compose.prod.yml logs

# Restart all services
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d

# Wait 30 seconds and check
sleep 30
docker compose -f docker-compose.prod.yml ps
```

### Issue: "Can't SSH to VPS"
```bash
# Verify SSH key
ssh -i ~/.ssh/terralink_deploy -v deploy@53.75.247.188

# If connection refused, check Interserver firewall
# Go to Interserver VPS Control Panel → Security → Firewall Rules

# Should allow:
# - SSH port 22
# - HTTP port 80
# - HTTPS port 443
```

---

## 📞 Support Contacts

- **HostPinnacle Support:** For domain/DNS issues
- **Interserver Support:** For VPS issues
  - Dashboard: https://vpscontrol.net/
  - Support: support@interserver.net

---

## ✅ Quick Reference

| Item | Value |
|------|-------|
| **Domain** | terralinkhealth.co.ke |
| **VPS IP** | 53.75.247.188 |
| **VPS Provider** | Interserver |
| **Deploy User** | deploy |
| **App Directory** | /home/deploy/hospital-platform |
| **Frontend URL** | https://terralinkhealth.co.ke |
| **API URL** | https://terralinkhealth.co.ke/api |
| **Database** | PostgreSQL (containerized) |
| **SSL Certificate** | /home/deploy/hospital-platform/ssl/ |

---

## 🎉 Deployment Complete!

Your Hospital Platform (TerraLink Health) is now:
- ✅ Deployed on Interserver VPS (53.75.247.188)
- ✅ Accessible via terralinkhealth.co.ke
- ✅ Running with SSL/TLS encryption
- ✅ Configured with automatic backups
- ✅ Set up for automatic CI/CD deployments

**Next Steps:**
1. Verify the site loads: https://terralinkhealth.co.ke
2. Login with admin account
3. Change default passwords
4. Configure hospital settings
5. Add real users and doctors

For detailed documentation, see:
- [INTERSERVER_DEPLOYMENT.md](./INTERSERVER_DEPLOYMENT.md)
- [INTERSERVER_QUICK_START.md](./INTERSERVER_QUICK_START.md)
- [DEPLOYMENT.md](./DEPLOYMENT.md)
