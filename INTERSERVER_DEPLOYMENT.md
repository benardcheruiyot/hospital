# Deploying Hospital Platform on Interserver VPS

This guide covers setting up and deploying the Hospital Digital Platform on an Interserver VPS.

## 🖥️ Interserver VPS Setup Overview

### 1. Get Your VPS Details

From Interserver control panel, you'll have:
- **IP Address**: e.g., `123.45.67.89`
- **SSH Port**: Usually `22` (can be custom)
- **Root Password**: Provided in welcome email
- **Hostname**: e.g., `vps12345.interserver.net`

### 2. Initial VPS Connection

```bash
# SSH into your VPS as root
ssh root@123.45.67.89
# or if custom port
ssh -p 2222 root@123.45.67.89

# Update system
apt-get update
apt-get upgrade -y
```

---

## 📋 Step-by-Step Interserver Deployment

### Step 1: Initial Server Setup (Run Once)

```bash
# SSH as root
ssh root@YOUR_VPS_IP

# Run the automated setup script
curl -fsSL https://raw.githubusercontent.com/benardcheruiyot/hospital/main/scripts/setup-server.sh | bash -s production
```

This will:
- Install Docker & Docker Compose
- Create `deploy` user
- Set up directories and permissions
- Configure firewall
- Create environment file template

### Step 2: Configure SSH Access

Generate SSH key pair on your local machine:

```bash
# On your local machine
ssh-keygen -t rsa -b 4096 -f ~/.ssh/interserver_deploy -N ""

# Copy public key to server
ssh-copy-id -i ~/.ssh/interserver_deploy.pub root@YOUR_VPS_IP

# Switch to deploy user and add key
ssh -i ~/.ssh/interserver_deploy root@YOUR_VPS_IP
su - deploy
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# Back on local machine, copy the key again for deploy user
ssh-copy-id -i ~/.ssh/interserver_deploy.pub -p 22 deploy@YOUR_VPS_IP
```

### Step 3: Configure GitHub Secrets

In your GitHub repository **Settings → Secrets and variables → Environments**:

Create `production` environment with these secrets:

```
DEPLOY_HOST  = YOUR_VPS_IP
DEPLOY_USER  = deploy
DEPLOY_KEY   = (paste content of ~/.ssh/interserver_deploy)
```

And add these production-only secrets:

```
JWT_SECRET          = (generate: openssl rand -hex 32)
DB_PASSWORD         = (generate: openssl rand -hex 16)
GOOGLE_CLIENT_ID    = (optional)
CLIENT_URL          = https://YOUR_DOMAIN.com
API_URL             = https://YOUR_DOMAIN.com/api
SOCKET_URL          = https://YOUR_DOMAIN.com
```

### Step 4: Set Up Domain & SSL (Optional but Recommended)

If you have a domain:

```bash
# SSH to VPS as root
ssh root@YOUR_VPS_IP

# Install Certbot
apt-get install -y certbot python3-certbot-nginx

# Generate SSL certificate
certbot certonly --standalone -d your-domain.com

# Copy to app directory
cp /etc/letsencrypt/live/your-domain.com/fullchain.pem /home/deploy/hospital-platform/ssl/cert.pem
cp /etc/letsencrypt/live/your-domain.com/privkey.pem /home/deploy/hospital-platform/ssl/key.pem
chown deploy:deploy /home/deploy/hospital-platform/ssl/*
```

### Step 5: Configure Environment File

SSH to your VPS and edit environment configuration:

```bash
ssh deploy@YOUR_VPS_IP
vi ~/hospital-platform/.env.prod
```

Edit the following variables:

```env
NODE_ENV=production
PORT=5000
CLIENT_URL=https://YOUR_DOMAIN.com    # or http://YOUR_VPS_IP

DB_HOST=db
DB_PORT=5432
DB_NAME=hospital_platform
DB_USER=postgres
DB_PASSWORD=YOUR_STRONG_PASSWORD_HERE

JWT_SECRET=YOUR_LONG_RANDOM_SECRET_HERE
JWT_EXPIRES_IN=7d

API_URL=https://YOUR_DOMAIN.com/api   # or http://YOUR_VPS_IP/api
SOCKET_URL=https://YOUR_DOMAIN.com     # or http://YOUR_VPS_IP

GOOGLE_CLIENT_ID=your-client-id-here  # optional
```

**Save:** Press `Esc` → `:wq` → Enter

### Step 6: Test SSH Connection from GitHub Actions

This ensures GitHub can authenticate with your VPS:

```bash
# On your local machine
ssh -i ~/.ssh/interserver_deploy deploy@YOUR_VPS_IP "docker compose -f ~/hospital-platform/docker-compose.prod.yml --version"
```

Should output Docker Compose version without errors.

### Step 7: Trigger First Deployment

1. Go to GitHub → **Actions**
2. Select **Deploy to Production**
3. Click **Run workflow**
4. Fill in:
   - **Version**: `main`
   - **Environment**: `production`
5. Click "Run workflow"
6. Watch the logs

---

## 🔗 Firewall Configuration

Interserver VPS comes with a firewall. Configure it to allow necessary ports:

```bash
# SSH to VPS as root
ssh root@YOUR_VPS_IP

# Enable UFW firewall
ufw enable

# Allow essential ports
ufw allow 22/tcp      # SSH
ufw allow 80/tcp      # HTTP
ufw allow 443/tcp     # HTTPS

# Verify rules
ufw status
```

---

## 📊 Monitoring Your Deployment

### Check Services Status

```bash
ssh deploy@YOUR_VPS_IP
cd ~/hospital-platform

# View all services
docker compose -f docker-compose.prod.yml ps

# View logs
docker compose -f docker-compose.prod.yml logs -f

# View specific service
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml logs -f frontend
docker compose -f docker-compose.prod.yml logs -f db
```

### Test API Endpoint

```bash
# If using domain
curl https://your-domain.com/api/health

# If using IP directly
curl http://YOUR_VPS_IP/api/health
```

---

## 🔄 Updating Your Application

To deploy a new version:

1. Push your changes to GitHub
   ```bash
   git push origin main
   ```

2. Trigger deployment
   - Go to GitHub Actions → Deploy to Production
   - Select version: `main` (or specific tag like `v1.0.0`)
   - Click "Run workflow"

3. Monitor deployment
   - Watch GitHub Actions logs
   - SSH to VPS and check `docker compose ps`

---

## 💾 Database Backups

Automatic backups run daily at 2 AM:

```bash
# View backups
ssh deploy@YOUR_VPS_IP
ls -lh ~/hospital-platform/backups/

# Manual backup
cd ~/hospital-platform
docker compose -f docker-compose.prod.yml exec -T db pg_dump -U postgres hospital_platform | \
    gzip > backups/backup_manual_$(date +%s).sql.gz
```

### Restore from Backup

```bash
ssh deploy@YOUR_VPS_IP
cd ~/hospital-platform

# List backups
ls -lh backups/

# Restore (replace BACKUP_FILE with actual filename)
gunzip < backups/BACKUP_FILE.sql.gz | \
    docker compose -f docker-compose.prod.yml exec -T db psql -U postgres hospital_platform
```

---

## 🆘 Troubleshooting Interserver Deployment

### Issue: "Connection refused" when deploying

**Solution:**
```bash
# Verify deploy user can SSH
ssh -i ~/.ssh/interserver_deploy deploy@YOUR_VPS_IP "whoami"

# Check SSH permissions
ssh -i ~/.ssh/interserver_deploy deploy@YOUR_VPS_IP "ls -la ~/.ssh"
# Should show: -rw------- authorized_keys
```

### Issue: "Docker command not found"

**Solution:**
```bash
# Reconnect terminal (new SSH session might be needed)
exit
ssh deploy@YOUR_VPS_IP

# Verify Docker installation
docker --version
docker compose --version
```

### Issue: "Port 443 already in use"

**Solution:**
```bash
# Check what's using port 443
sudo lsof -i :443

# If it's another process, stop it
sudo systemctl stop <service-name>

# Restart services
docker compose -f docker-compose.prod.yml restart
```

### Issue: "Database connection timeout"

**Solution:**
```bash
# Check if database is running
docker compose -f docker-compose.prod.yml ps db

# Check database logs
docker compose -f docker-compose.prod.yml logs db

# Restart database
docker compose -f docker-compose.prod.yml restart db

# Wait 10 seconds and check again
sleep 10
docker compose -f docker-compose.prod.yml ps
```

### Issue: "SSL certificate error"

**Solution:**
```bash
# Check certificate files exist
ls -l ~/hospital-platform/ssl/

# Renew certificate (valid 90 days)
sudo certbot renew --force-renewal -d your-domain.com

# Copy new cert
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem ~/hospital-platform/ssl/cert.pem
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem ~/hospital-platform/ssl/key.pem
sudo chown deploy:deploy ~/hospital-platform/ssl/*

# Restart Nginx
docker compose -f docker-compose.prod.yml restart nginx
```

---

## 📱 Access Your Application

### Via IP Address

```
Frontend:  http://YOUR_VPS_IP
API:       http://YOUR_VPS_IP/api
Health:    http://YOUR_VPS_IP/api/health
```

### Via Domain Name

```
Frontend:  https://your-domain.com
API:       https://your-domain.com/api
Health:    https://your-domain.com/api/health
```

### Login Credentials

After deployment, default accounts are seeded:

- **Admin**: `admin@hospital-platform.local` (password: `admin`)
- **Patient**: `patient@hospital-platform.local` (password: `patient`)
- **Doctor**: `doctor@hospital-platform.local` (password: `doctor`)

⚠️ **Important**: Change these passwords in production!

---

## 🔐 Security Recommendations

1. **Change Default Passwords**
   ```bash
   # SSH to backend container
   docker compose -f docker-compose.prod.yml exec backend npm run db:seed
   ```

2. **Set Strong JWT Secret**
   ```bash
   # Already in .env but verify
   cat ~/hospital-platform/.env.prod | grep JWT_SECRET
   ```

3. **Enable Firewall**
   ```bash
   sudo ufw enable
   sudo ufw allow 22/tcp
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   ```

4. **Regular Updates**
   ```bash
   # Update system
   sudo apt-get update && sudo apt-get upgrade -y
   
   # Rebuild Docker images with latest base images
   docker compose -f docker-compose.prod.yml pull
   docker compose -f docker-compose.prod.yml up -d
   ```

5. **Enable SSH Key Authentication Only**
   ```bash
   # SSH to VPS as root
   sudo sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
   sudo systemctl restart sshd
   ```

---

## 📈 Resource Monitoring

Monitor VPS resource usage:

```bash
# Check CPU and memory
docker stats

# Check disk usage
df -h

# Check running processes
top
# or
htop  # if installed
```

Interserver VPS recommendations:
- **2GB RAM** minimum for development/staging
- **4GB+ RAM** recommended for production
- **20GB SSD** minimum storage

---

## 🔄 Updating Interserver Configuration

To update your configuration after initial setup:

1. Edit environment variables
   ```bash
   ssh deploy@YOUR_VPS_IP
   vi ~/hospital-platform/.env.prod
   ```

2. Restart services
   ```bash
   docker compose -f docker-compose.prod.yml restart backend
   ```

3. Or redeploy from GitHub Actions
   ```
   Workflow → Run workflow → version: main → environment: production
   ```

---

## 📞 Interserver Support Resources

- **Interserver Dashboard**: https://vpscontrol.net/
- **Support**: support@interserver.net
- **Documentation**: https://interserver.net/docs/

For VPS management:
1. Log into Interserver VPS Control Panel
2. Reboot VPS if needed
3. View resource usage
4. Configure backups
5. Monitor bandwidth

---

## ✅ Deployment Checklist

- [ ] VPS provisioned on Interserver
- [ ] SSH key generated and added to VPS
- [ ] Setup script ran successfully
- [ ] GitHub Secrets configured (DEPLOY_HOST, DEPLOY_USER, DEPLOY_KEY)
- [ ] Environment file edited with actual values
- [ ] Domain configured (if applicable)
- [ ] SSL certificate installed (if using domain)
- [ ] Firewall configured
- [ ] First deployment successful
- [ ] Services running (`docker compose ps`)
- [ ] API health check passing
- [ ] Frontend accessible
- [ ] Default passwords changed
- [ ] Backups configured and tested

---

## 🚀 You're Ready!

Your Hospital Digital Platform is now deployed on Interserver VPS with:
- ✅ Automated CI/CD via GitHub Actions
- ✅ Zero-downtime deployments
- ✅ Daily backups
- ✅ SSL/TLS encryption (if configured)
- ✅ Nginx reverse proxy
- ✅ Docker containerization
- ✅ PostgreSQL database

For questions or issues, refer to the main [DEPLOYMENT.md](./DEPLOYMENT.md) guide.
