# GitHub Secrets Setup for TerraLink Health CI/CD

**Complete guide to configure GitHub Secrets for automated deployment**

---

## 🔐 Step 1: Access GitHub Secrets Settings

1. Go to your GitHub repository: https://github.com/benardcheruiyot/hospital
2. Click **Settings** tab
3. In left sidebar, click **Secrets and variables** → **Actions**

You should see:
- **Repository secrets** (top section)
- **Environments** (bottom section)

---

## 📝 Step 2: Create "production" Environment

1. Scroll down to **Environments** section
2. Click **New environment**
3. Name: `production`
4. Click **Configure environment**

---

## 🔑 Step 3: Generate Required Secrets

### Secret 1: JWT_SECRET

On your **local machine**, run:
```bash
openssl rand -hex 32
```

**Output example:**
```
a3f7b8c2e9d4f1a6b3c8e2f7a0d5c9e4b1f6a3c8e2d7f0a5b9c3e8f1a6b0d4
```

**Copy this value** - you'll use it as `JWT_SECRET`

---

### Secret 2: DB_PASSWORD

On your **local machine**, run:
```bash
openssl rand -hex 16
```

**Output example:**
```
7a3f2b8e1c9d4f6a
```

**Copy this value** - you'll use it as `DB_PASSWORD`

---

### Secret 3: DEPLOY_KEY (SSH Private Key)

On your **local machine**, the private key is at: `~/.ssh/terralink_deploy`

**View and copy the full private key:**
```bash
cat ~/.ssh/terralink_deploy
```

**Output looks like:**
```
-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA2v3U7H8k9jL2m4X5...
[many lines of text]
...nZ9q8K3Y7P2X1W9V8U7T6S5R4Q3P2O1N
-----END RSA PRIVATE KEY-----
```

**Copy the ENTIRE content** (including BEGIN and END lines) - you'll use it as `DEPLOY_KEY`

---

## 🔧 Step 4: Add Secrets to GitHub

Go to your "production" environment in GitHub Secrets.

You should now be in the **production environment secrets page**.

### Add Secret 1: DEPLOY_HOST

1. Click **"Add secret"**
2. **Name:** `DEPLOY_HOST`
3. **Value:** `53.75.247.188`
4. Click **"Add secret"**

✅ Secret added

---

### Add Secret 2: DEPLOY_USER

1. Click **"Add secret"**
2. **Name:** `DEPLOY_USER`
3. **Value:** `deploy`
4. Click **"Add secret"**

✅ Secret added

---

### Add Secret 3: DEPLOY_KEY

1. Click **"Add secret"**
2. **Name:** `DEPLOY_KEY`
3. **Value:** Paste the ENTIRE private key from ~/.ssh/terralink_deploy
   
   Should start with: `-----BEGIN RSA PRIVATE KEY-----`
   
   Should end with: `-----END RSA PRIVATE KEY-----`

4. Click **"Add secret"**

✅ Secret added

---

### Add Secret 4: JWT_SECRET

1. Click **"Add secret"**
2. **Name:** `JWT_SECRET`
3. **Value:** Paste the value from `openssl rand -hex 32` (from Step 3)
4. Click **"Add secret"**

✅ Secret added

---

### Add Secret 5: DB_PASSWORD

1. Click **"Add secret"**
2. **Name:** `DB_PASSWORD`
3. **Value:** Paste the value from `openssl rand -hex 16` (from Step 3)
4. Click **"Add secret"**

✅ Secret added

---

### Add Secret 6: CLIENT_URL

1. Click **"Add secret"**
2. **Name:** `CLIENT_URL`
3. **Value:** `https://terralinkhealth.co.ke`
4. Click **"Add secret"**

✅ Secret added

---

### Add Secret 7: API_URL

1. Click **"Add secret"**
2. **Name:** `API_URL`
3. **Value:** `https://terralinkhealth.co.ke/api`
4. Click **"Add secret"**

✅ Secret added

---

### Add Secret 8: SOCKET_URL

1. Click **"Add secret"**
2. **Name:** `SOCKET_URL`
3. **Value:** `https://terralinkhealth.co.ke`
4. Click **"Add secret"**

✅ Secret added

---

### Add Secret 9: GOOGLE_CLIENT_ID (Optional)

If you have Google OAuth configured:

1. Click **"Add secret"**
2. **Name:** `GOOGLE_CLIENT_ID`
3. **Value:** Your Google Client ID
4. Click **"Add secret"**

If you don't have this, skip it. Leave blank for now.

✅ Secret added (or skipped)

---

## ✅ Step 5: Verify All Secrets Are Added

Your GitHub production environment should now show these secrets:

```
DEPLOY_HOST           ••••••••••••••
DEPLOY_USER           ••••••••••••••
DEPLOY_KEY            ••••••••••••••  (very long)
JWT_SECRET            ••••••••••••••
DB_PASSWORD           ••••••••••••••
CLIENT_URL            ••••••••••••••
API_URL               ••••••••••••••
SOCKET_URL            ••••••••••••••
GOOGLE_CLIENT_ID      ••••••••••••••  (optional)
```

All values should show as dots/asterisks (hidden for security).

---

## 🚀 Step 6: Ready for Deployment!

Once all secrets are added:

1. Go to **Actions** tab in your GitHub repository
2. Select **"Deploy to Production"** workflow
3. Click **"Run workflow"**
4. Set:
   - **Version:** `main`
   - **Environment:** `production`
5. Click **"Run workflow"**

The deployment will now use all your GitHub secrets automatically! ✅

---

## 📋 Complete Secrets Checklist

- [ ] DEPLOY_HOST = `53.75.247.188`
- [ ] DEPLOY_USER = `deploy`
- [ ] DEPLOY_KEY = (full SSH private key from ~/.ssh/terralink_deploy)
- [ ] JWT_SECRET = (from `openssl rand -hex 32`)
- [ ] DB_PASSWORD = (from `openssl rand -hex 16`)
- [ ] CLIENT_URL = `https://terralinkhealth.co.ke`
- [ ] API_URL = `https://terralinkhealth.co.ke/api`
- [ ] SOCKET_URL = `https://terralinkhealth.co.ke`
- [ ] GOOGLE_CLIENT_ID = (optional)

---

## 🔍 Troubleshooting

### Issue: "Deployment fails with 'permission denied'"

**Solution:** Verify DEPLOY_KEY is correct:
```bash
# Make sure you copied the ENTIRE key
cat ~/.ssh/terralink_deploy | wc -l
# Should be 25+ lines
```

### Issue: "Can't read DEPLOY_KEY"

**Solution:** 
1. Go back to GitHub → Settings → Secrets
2. Click the pencil icon next to DEPLOY_KEY
3. Make sure it starts with: `-----BEGIN RSA PRIVATE KEY-----`
4. Make sure it ends with: `-----END RSA PRIVATE KEY-----`
5. Update if needed

### Issue: "Database connection failed"

**Solution:** Check DB_PASSWORD secret is not empty and matches what's on your VPS

### Issue: "JWT errors"

**Solution:** Check JWT_SECRET is long enough (32 hex characters = 64 characters total)

---

## ✅ Next Steps

After adding all secrets:

1. **SSH to your VPS** and verify environment file is updated:
   ```bash
   ssh -i ~/.ssh/terralink_deploy deploy@53.75.247.188
   cat ~/hospital-platform/.env.prod
   ```

2. **Trigger deployment** from GitHub Actions

3. **Monitor logs** - should see services starting up

4. **Test application** - https://terralinkhealth.co.ke

---

## 📚 Reference

- [GitHub Secrets Documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [GitHub Environments](https://docs.github.com/en/actions/deployment/targeting-different-environments/using-environments-for-deployment)
- [Deploy Workflow](../.github/workflows/deploy.yml)

---

**You're now ready for CI/CD! 🚀**
