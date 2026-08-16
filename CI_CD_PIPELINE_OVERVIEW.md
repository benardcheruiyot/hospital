# 🔄 TerraLink Health - Complete CI/CD Pipeline Overview

**Domain:** terralinkhealth.co.ke  
**VPS:** 53.75.247.188 (Interserver)  
**Repository:** benardcheruiyot/hospital

---

## 📊 CI/CD Pipeline Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Your GitHub Repository                        │
│                  (benardcheruiyot/hospital)                      │
└─────────────────────────────────────────────────────────────────┘
                           ↓
                    ┌──────────────┐
                    │ Git Workflow │
                    │   Triggers   │
                    └──────────────┘
                    /    |    \    \
                   /     |     \     \
    Push to Main  /    Pull    \   Manual
    or Develop   /    Request   \  Trigger
               /         |        \
         ┌────▼────┐ ┌──▼──┐   ┌─▼──────┐
         │    CI   │ │ CI  │   │ Deploy │
         │ Lint +  │ │Test │   │        │
         │ Test    │ │     │   │        │
         └────┬────┘ └──┬──┘   └─┬──────┘
              │        │         │
              ├────────┴─────────┤
                       ↓
            ┌────────────────────┐
            │  GitHub Secrets    │
            │ (All credentials)  │
            └────────────────────┘
                       ↓
        ┌──────────────────────────────┐
        │  Build & Push Docker Images  │
        │ → ghcr.io/benardcheruiyot/   │
        │    hospital/backend:TAG      │
        │    hospital/frontend:TAG     │
        └──────────────────────────────┘
                       ↓
        ┌──────────────────────────────┐
        │   SSH + Docker Compose       │
        │  (Via GitHub Secrets)        │
        │ - DEPLOY_HOST: 53.75.247.188 │
        │ - DEPLOY_USER: deploy        │
        │ - DEPLOY_KEY: SSH private    │
        └──────────────┬───────────────┘
                       ↓
        ┌──────────────────────────────┐
        │  Interserver VPS             │
        │  53.75.247.188               │
        │                              │
        │  ┌────────────────────────┐  │
        │  │  Docker Containers:    │  │
        │  │  - PostgreSQL (db)     │  │
        │  │  - Node.js API (5000)  │  │
        │  │  - React App (nginx)   │  │
        │  │  - Nginx Proxy         │  │
        │  └────────────────────────┘  │
        │                              │
        │  ┌────────────────────────┐  │
        │  │  Domain Configuration: │  │
        │  │  - terralinkhealth.    │  │
        │  │    co.ke → 53.75...    │  │
        │  │  - SSL/TLS (Certbot)   │  │
        │  │  - Port 443 (HTTPS)    │  │
        │  └────────────────────────┘  │
        └──────────────┬───────────────┘
                       ↓
        ┌──────────────────────────────┐
        │   Verify Deployment          │
        │ - Health checks              │
        │ - Service startup            │
        │ - SSL certificate            │
        └──────────────┬───────────────┘
                       ↓
        ┌──────────────────────────────┐
        │   Live Application           │
        │ https://terralinkhealth.     │
        │         co.ke                │
        └──────────────────────────────┘
```

---

## 🔐 GitHub Secrets Configuration

These secrets are used by GitHub Actions workflows:

```
┌─────────────────────────────────────────────────────────┐
│          GitHub Actions Environment Secrets             │
│              (production environment)                   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Deployment Secrets:                                   │
│  • DEPLOY_HOST = 53.75.247.188                         │
│  • DEPLOY_USER = deploy                                │
│  • DEPLOY_KEY = (SSH private key)                      │
│                                                         │
│  Application Secrets:                                  │
│  • JWT_SECRET = (generated random hex)                 │
│  • DB_PASSWORD = (generated random hex)                │
│                                                         │
│  URL Configuration:                                    │
│  • CLIENT_URL = https://terralinkhealth.co.ke         │
│  • API_URL = https://terralinkhealth.co.ke/api        │
│  • SOCKET_URL = https://terralinkhealth.co.ke         │
│                                                         │
│  Optional:                                             │
│  • GOOGLE_CLIENT_ID = (if using OAuth)                │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 📁 Files Created for Your Deployment

```
hospital-digital-platform/
├── .github/
│   └── workflows/
│       ├── ci.yml                     # Lint & test on PR/push
│       ├── build-push.yml             # Build Docker images
│       └── deploy.yml                 # Deploy to production
│
├── docker-compose.yml                 # Local development
├── docker-compose.staging.yml         # Staging environment
├── docker-compose.prod.yml            # Production environment
├── nginx.conf                         # Nginx reverse proxy
│
├── backend/.dockerignore               # Docker optimization
├── frontend/.dockerignore              # Docker optimization
│
├── scripts/
│   └── setup-server.sh                # Automated VPS setup
│
├── .env.example                       # Backend env template
├── .env.staging.example               # Staging env template
├── .env.prod.example                  # Production env template
│
└── Documentation Files:
    ├── DEPLOYMENT.md                  # General deployment guide
    ├── GITHUB_ACTIONS_SETUP.md        # GitHub Actions config
    ├── GITHUB_SECRETS_SETUP.md        # Secrets setup guide
    ├── GITHUB_SECRETS_QUICK_REFERENCE.md  # Quick reference
    ├── INTERSERVER_DEPLOYMENT.md      # Interserver guide
    ├── INTERSERVER_QUICK_START.md     # Quick start
    ├── TERRALINK_DEPLOYMENT_CONFIG.md # Your config
    └── TERRALINK_DEPLOYMENT_CHECKLIST.md # Your checklist
```

---

## 🔄 CI/CD Workflow Triggers

### Workflow 1: CI (Lint & Test)
```
Trigger: Push to main/develop or Pull Request
├─ Backend Lint
│  └─ ESLint on backend code
├─ Frontend Lint + Build
│  ├─ ESLint on frontend code
│  └─ Build with Vite
└─ Frontend Tests
   └─ Run Playwright E2E tests
```

### Workflow 2: Build & Push
```
Trigger: Push to main/develop or release tag
├─ Build backend Docker image
│  └─ Push to ghcr.io/.../backend:TAG
└─ Build frontend Docker image
   └─ Push to ghcr.io/.../frontend:TAG
```

### Workflow 3: Deploy
```
Trigger: Manual workflow dispatch (GitHub Actions)
Input: Version (tag/branch) + Environment (staging/production)
├─ SSH to VPS (53.75.247.188)
├─ Pull latest Docker images
├─ Start services with docker-compose
├─ Health checks
└─ Verify deployment success
```

---

## 🚀 Deployment Process (Step by Step)

### Step 1: Code Push
```bash
git push origin main
```

### Step 2: GitHub Actions CI Runs (Automatic)
- Lint check ✓
- Unit tests ✓
- Build verification ✓

### Step 3: Docker Build & Push (Automatic)
- Backend image built and pushed
- Frontend image built and pushed
- Both tagged with branch name

### Step 4: Manual Deployment Trigger (Your Action)
```
GitHub → Actions → Deploy to Production
→ Run workflow (version: main, environment: production)
```

### Step 5: GitHub Actions Deploy (Automatic)
1. Load secrets from GitHub environment
2. SSH to 53.75.247.188 as deploy user
3. Pull latest Docker images
4. Update environment variables
5. Run: `docker-compose -f docker-compose.prod.yml up -d`
6. Health checks
7. Report success/failure

### Step 6: Live on Production
```
https://terralinkhealth.co.ke ✓
```

---

## 📊 Secret Usage in Deployment

```
GitHub Secrets (production env)
     ↓
Deploy Workflow reads secrets
     ↓
SSH to VPS using:
 • DEPLOY_HOST
 • DEPLOY_USER
 • DEPLOY_KEY (private key)
     ↓
On VPS, set environment variables:
 • JWT_SECRET → .env.prod
 • DB_PASSWORD → .env.prod
 • CLIENT_URL → .env.prod
 • API_URL → .env.prod
 • SOCKET_URL → .env.prod
     ↓
Start Docker containers with env vars
     ↓
Containers use secrets to configure app
```

---

## 🔒 Security Flow

```
1. You generate secrets locally:
   openssl rand -hex 32  → JWT_SECRET
   openssl rand -hex 16  → DB_PASSWORD

2. You add to GitHub Secrets (encrypted by GitHub)

3. Deployment workflow retrieves secrets:
   - Secrets are never logged
   - Secrets only visible during job execution
   - Secrets masked in logs as "***"

4. Secrets passed to VPS via SSH:
   - SSH connection encrypted (TLS)
   - Private key never exposed
   - Used only for authentication

5. Secrets set on VPS:
   - Loaded into container environment
   - Used by application
   - Never logged or exposed
```

---

## ✅ Complete Checklist

- [ ] GitHub Secrets environment created (production)
- [ ] 9 secrets added to production environment
  - [ ] DEPLOY_HOST
  - [ ] DEPLOY_USER
  - [ ] DEPLOY_KEY
  - [ ] JWT_SECRET
  - [ ] DB_PASSWORD
  - [ ] CLIENT_URL
  - [ ] API_URL
  - [ ] SOCKET_URL
  - [ ] GOOGLE_CLIENT_ID (optional)
- [ ] VPS is set up and running
- [ ] Domain DNS points to 53.75.247.188
- [ ] SSL certificate installed on VPS
- [ ] Deploy workflow is ready to run
- [ ] Application will be live at https://terralinkhealth.co.ke

---

## 🎯 Your Current Status

✅ **Completed:**
- GitHub Actions workflows created
- Docker configuration complete
- Interserver VPS setup script ready
- Deployment guides written
- CI/CD pipeline architecture defined

⏳ **Remaining (Final Step):**
- Add 9 GitHub Secrets to production environment

🚀 **After Adding Secrets:**
- Trigger deployment from GitHub Actions
- Application goes live
- CI/CD pipeline is fully operational

---

## 📞 Quick Links

- **GitHub Repository:** https://github.com/benardcheruiyot/hospital
- **GitHub Secrets Setup:** Settings → Secrets and variables → Actions
- **GitHub Actions:** repository → Actions tab
- **VPS Control Panel:** https://vpscontrol.net/ (Interserver)
- **Domain DNS:** HostPinnacle control panel

---

## 🎉 You're Almost There!

Just 9 GitHub Secrets to go, and your CI/CD pipeline is fully operational! 

**Next Action:** Add the secrets following [GITHUB_SECRETS_SETUP.md](./GITHUB_SECRETS_SETUP.md)
