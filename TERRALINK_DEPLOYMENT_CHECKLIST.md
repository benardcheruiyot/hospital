# 🚀 TerraLink Health - Deployment Checklist

**Domain:** terralinkhealth.co.ke  
**VPS IP:** 53.75.247.188  
**Provider:** Interserver

---

## ✅ Pre-Deployment Checklist

- [ ] Have Interserver welcome email with root password
- [ ] Have HostPinnacle domain management access
- [ ] Have GitHub account with repository access
- [ ] OpenSSL or similar tool available locally (for generating secrets)

---

## 🔧 Phase 1: Server Setup (10 minutes)

**Task 1: Initial SSH Connection**
```bash
ssh root@53.75.247.188
# Use password from Interserver welcome email
```
- [ ] Successfully logged into VPS as root

**Task 2: Run Automated Setup**
```bash
curl -fsSL https://raw.githubusercontent.com/benardcheruiyot/hospital/main/scripts/setup-server.sh | bash -s production
```
- [ ] Setup script ran without errors
- [ ] Deployment user created
- [ ] Docker installed successfully
- [ ] Firewall configured

**Task 3: Generate SSH Keys (on your local machine)**
```bash
ssh-keygen -t rsa -b 4096 -f ~/.ssh/terralink_deploy -N ""
ssh-copy-id -i ~/.ssh/terralink_deploy.pub deploy@53.75.247.188
ssh -i ~/.ssh/terralink_deploy deploy@53.75.247.188 "whoami"
```
- [ ] SSH key pair generated
- [ ] Public key added to VPS
- [ ] SSH connection verified

---

## 🔐 Phase 2: GitHub Configuration (5 minutes)

**Task 4: Generate Secrets**
```bash
# Generate JWT_SECRET
openssl rand -hex 32
# Copy output

# Generate DB_PASSWORD
openssl rand -hex 16
# Copy output
```
- [ ] JWT_SECRET generated and copied
- [ ] DB_PASSWORD generated and copied

**Task 5: Create GitHub Environment**
1. Go to GitHub Repository
2. Settings → Secrets and variables → Environments
3. Click "New environment"
4. Name: `production`

- [ ] Environment created

**Task 6: Add GitHub Secrets**

Add to `production` environment:

| Secret | Value |
|--------|-------|
| DEPLOY_HOST | `53.75.247.188` |
| DEPLOY_USER | `deploy` |
| DEPLOY_KEY | (content of ~/.ssh/terralink_deploy) |
| JWT_SECRET | (from Step 4) |
| DB_PASSWORD | (from Step 4) |
| CLIENT_URL | `https://terralinkhealth.co.ke` |
| API_URL | `https://terralinkhealth.co.ke/api` |
| SOCKET_URL | `https://terralinkhealth.co.ke` |
| GOOGLE_CLIENT_ID | (optional) |

- [ ] DEPLOY_HOST added
- [ ] DEPLOY_USER added
- [ ] DEPLOY_KEY added
- [ ] JWT_SECRET added
- [ ] DB_PASSWORD added
- [ ] CLIENT_URL added
- [ ] API_URL added
- [ ] SOCKET_URL added

---

## 🌐 Phase 3: Domain Configuration (5 minutes)

**Task 7: Configure DNS in HostPinnacle**

1. Go to HostPinnacle DNS Management
2. For domain: `terralinkhealth.co.ke`
3. Add/Update DNS records:

**Record 1 (Root Domain)**
- Type: A
- Name: @ (or leave blank)
- Value: `53.75.247.188`
- TTL: 3600

**Record 2 (WWW Subdomain)**
- Type: A
- Name: www
- Value: `53.75.247.188`
- TTL: 3600

- [ ] A record for @ added
- [ ] A record for www added

**Task 8: Verify DNS Propagation** (wait 5-15 minutes)
```bash
# Test on your local machine
nslookup terralinkhealth.co.ke
# Should show: 53.75.247.188
```
- [ ] DNS resolves to 53.75.247.188

---

## 🔒 Phase 4: SSL Certificate (5 minutes)

**Task 9: Install SSL Certificate**
```bash
ssh -i ~/.ssh/terralink_deploy root@53.75.247.188

apt-get install -y certbot

certbot certonly --standalone \
  -d terralinkhealth.co.ke \
  -d www.terralinkhealth.co.ke

# Follow prompts (enter email, accept terms)

# Copy certificates
cp /etc/letsencrypt/live/terralinkhealth.co.ke/fullchain.pem \
   /home/deploy/hospital-platform/ssl/cert.pem
cp /etc/letsencrypt/live/terralinkhealth.co.ke/privkey.pem \
   /home/deploy/hospital-platform/ssl/key.pem
chown deploy:deploy /home/deploy/hospital-platform/ssl/*

# Verify
ls -la /home/deploy/hospital-platform/ssl/
```
- [ ] Certbot installed
- [ ] Certificate generated successfully
- [ ] Certificates copied to correct location
- [ ] File permissions set correctly

---

## ⚙️ Phase 5: Environment Configuration (3 minutes)

**Task 10: Edit Environment File**
```bash
ssh -i ~/.ssh/terralink_deploy deploy@53.75.247.188
vi ~/hospital-platform/.env.prod
```

Update these values in the file:
```env
CLIENT_URL=https://terralinkhealth.co.ke
DB_PASSWORD=PASTE_DB_PASSWORD_FROM_GITHUB_SECRETS
JWT_SECRET=PASTE_JWT_SECRET_FROM_GITHUB_SECRETS
API_URL=https://terralinkhealth.co.ke/api
SOCKET_URL=https://terralinkhealth.co.ke
```

**Save:** Press `Esc` → `:wq` → Enter

- [ ] Environment file updated
- [ ] All values replaced correctly
- [ ] File saved

---

## 🚀 Phase 6: Deploy Application (5-10 minutes)

**Task 11: Trigger Deployment**

1. Go to GitHub Repository
2. Click **Actions** tab
3. Select **"Deploy to Production"**
4. Click **"Run workflow"**
5. Set:
   - Version: `main`
   - Environment: `production`
6. Click **"Run workflow"**

- [ ] Workflow triggered
- [ ] Watching deployment logs
- [ ] No errors in logs
- [ ] Workflow completed successfully

**Monitor deployment:**
- Green checkmark = Success ✅
- Red X = Failed (check logs) ❌

---

## ✅ Phase 7: Verify Deployment (5 minutes)

**Task 12: Check Services**
```bash
ssh -i ~/.ssh/terralink_deploy deploy@53.75.247.188
cd ~/hospital-platform
docker compose -f docker-compose.prod.yml ps
```

Expected output:
```
STATUS              NAMES
Up (healthy)       hospital-platform-db-1
Up (healthy)       hospital-platform-backend-1
Up (healthy)       hospital-platform-frontend-1
Up (healthy)       hospital-platform-nginx-1
```

- [ ] All services showing "Up"
- [ ] All health checks passing

**Task 13: Test API**
```bash
curl https://terralinkhealth.co.ke/api/health
# Expected: {"status":"ok"}
```
- [ ] API responds with OK

**Task 14: Test Frontend**
1. Open browser: https://terralinkhealth.co.ke
2. Should see login page
3. Should show SSL certificate is valid (lock icon)

- [ ] Website loads
- [ ] SSL certificate valid
- [ ] Login page displays

---

## 🔐 Phase 8: Security & Customization (5 minutes)

**Task 15: Change Default Passwords**

Login to admin account:
- Email: `admin@hospital-platform.local`
- Password: `admin`

Then:
1. Go to admin settings
2. Change admin password
3. Disable or change patient/doctor demo accounts

- [ ] Logged in as admin
- [ ] Default passwords changed
- [ ] Demo accounts secured or disabled

**Task 16: Configure Hospital Settings**

In admin panel:
1. Hospital name: `TerraLink Health`
2. Logo/branding (if desired)
3. Contact information
4. Operating hours

- [ ] Hospital details configured
- [ ] Branding set up

---

## 📊 Phase 9: Final Verification (2 minutes)

**Task 17: Comprehensive Check**

```bash
# SSH to VPS
ssh -i ~/.ssh/terralink_deploy deploy@53.75.247.188
cd ~/hospital-platform

# Check all services
docker compose -f docker-compose.prod.yml ps

# View recent logs
docker compose -f docker-compose.prod.yml logs --tail=20

# Check disk space
df -h

# Check resource usage
docker stats --no-stream
```

- [ ] All services running
- [ ] No error messages in logs
- [ ] Disk space adequate (should have >5GB free)
- [ ] Memory/CPU usage reasonable

**Task 18: Accessibility Test**

- [ ] Can access https://terralinkhealth.co.ke
- [ ] Can access https://www.terralinkhealth.co.ke
- [ ] Can access https://terralinkhealth.co.ke/api/health
- [ ] SSL certificate is valid (no warnings)
- [ ] Can login with changed admin credentials

---

## 🎉 All Done!

- [ ] All tasks completed
- [ ] Application running in production
- [ ] SSL certificate active
- [ ] Backups configured
- [ ] CI/CD ready for future deployments

---

## 📝 Important Notes

### Daily Backups
Automatic backups run daily at 2 AM UTC. They're stored at:
```
/home/deploy/hospital-platform/backups/
```

### SSL Certificate Renewal
Automatic renewal is configured. Runs 30 days before expiration.

### Monitoring
Check application daily:
```bash
curl https://terralinkhealth.co.ke/api/health
```

### Updates
To deploy code updates:
1. Push to GitHub main branch
2. Go to Actions → Deploy to Production
3. Run workflow with version `main`

---

## 🆘 If Something Goes Wrong

**Check deployment logs:**
```bash
ssh -i ~/.ssh/terralink_deploy deploy@53.75.247.188
cd ~/hospital-platform
docker compose -f docker-compose.prod.yml logs
```

**Restart services:**
```bash
docker compose -f docker-compose.prod.yml restart
```

**Full redeploy:**
1. Go to GitHub Actions
2. Run Deploy workflow
3. Watch logs for completion

---

## 📞 Support

- **Domain Issues:** Contact HostPinnacle Support
- **VPS Issues:** Contact Interserver Support
- **Application Issues:** Check logs or review [INTERSERVER_DEPLOYMENT.md](./INTERSERVER_DEPLOYMENT.md)

---

**Deployment Status:** ⏳ Ready to deploy

**Start time:** When you complete Phase 1-2 above

**Expected completion:** ~45 minutes from start to fully operational
