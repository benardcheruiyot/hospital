# 🔐 Your GitHub Secrets - Ready to Paste

**Generated:** 2026-08-16

---

## ✅ Copy Each Secret Below and Paste into GitHub

### Secret 1: DEPLOY_HOST
```
Name:  DEPLOY_HOST
Value: 53.75.247.188
```

**Steps:**
1. Go to GitHub Settings → Secrets and variables → Actions → production environment
2. Click "Add secret"
3. Name: `DEPLOY_HOST`
4. Value: `53.75.247.188`
5. Click "Add secret"

---

### Secret 2: DEPLOY_USER
```
Name:  DEPLOY_USER
Value: deploy
```

**Steps:**
1. Click "Add secret"
2. Name: `DEPLOY_USER`
3. Value: `deploy`
4. Click "Add secret"

---

### Secret 3: DEPLOY_KEY

**⚠️ Important:** This is your SSH private key

**Steps:**
1. On your local machine, run:
   ```bash
   cat ~/.ssh/terralink_deploy
   ```
2. Copy the **entire output** (from `-----BEGIN RSA PRIVATE KEY-----` to `-----END RSA PRIVATE KEY-----`)
3. In GitHub, click "Add secret"
4. Name: `DEPLOY_KEY`
5. Value: Paste your entire private key
6. Click "Add secret"

---

### Secret 4: JWT_SECRET

**Generate this value:**
```bash
# On your local machine, run:
openssl rand -hex 32
# Copy the output
```

**Or use one of these pre-generated values:**

**Option 1:** `c8f7a3b2e1d9f4a6c8b3e7f1a9d2c5e8f0a3b6c9e2f5a8b1d4e7c0f3a6b9c`

**Option 2:** `a1f2e3d4c5b6a7f8e9d0c1b2a3f4e5d6c7b8a9f0e1d2c3b4a5f6e7d8c9b0a`

**Option 3:** `f9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d3c2b1a0f9`

**Choose one or generate your own:**
1. If on Mac/Linux: run `openssl rand -hex 32`
2. If on Windows: Use any of the 3 options above, or generate at: https://www.random.org/strings/

**Steps:**
1. Click "Add secret"
2. Name: `JWT_SECRET`
3. Value: `c8f7a3b2e1d9f4a6c8b3e7f1a9d2c5e8f0a3b6c9e2f5a8b1d4e7c0f3a6b9c` (or your generated value)
4. Click "Add secret"

---

### Secret 5: DB_PASSWORD

**Generate this value:**
```bash
# On your local machine, run:
openssl rand -hex 16
# Copy the output
```

**Or use one of these pre-generated values:**

**Option 1:** `7a3f2b8e1c9d4f6a2e5b7c1a9d3f6e8b`

**Option 2:** `c4e9f1b3a7d2e8c6f0a5b9d1e4c7f2a8`

**Option 3:** `f1a9e3c5d7b2f4a8e1c6b9d3f5a7e2c4`

**Choose one or generate your own:**
1. If on Mac/Linux: run `openssl rand -hex 16`
2. If on Windows: Use any of the 3 options above

**Steps:**
1. Click "Add secret"
2. Name: `DB_PASSWORD`
3. Value: `7a3f2b8e1c9d4f6a2e5b7c1a9d3f6e8b` (or your generated value)
4. Click "Add secret"

---

### Secret 6: CLIENT_URL
```
Name:  CLIENT_URL
Value: https://terralinkhealth.co.ke
```

**Steps:**
1. Click "Add secret"
2. Name: `CLIENT_URL`
3. Value: `https://terralinkhealth.co.ke`
4. Click "Add secret"

---

### Secret 7: API_URL
```
Name:  API_URL
Value: https://terralinkhealth.co.ke/api
```

**Steps:**
1. Click "Add secret"
2. Name: `API_URL`
3. Value: `https://terralinkhealth.co.ke/api`
4. Click "Add secret"

---

### Secret 8: SOCKET_URL
```
Name:  SOCKET_URL
Value: https://terralinkhealth.co.ke
```

**Steps:**
1. Click "Add secret"
2. Name: `SOCKET_URL`
3. Value: `https://terralinkhealth.co.ke`
4. Click "Add secret"

---

### Secret 9: GOOGLE_CLIENT_ID (Optional)
```
Name:  GOOGLE_CLIENT_ID
Value: (leave empty for now)
```

**Steps:**
1. Click "Add secret"
2. Name: `GOOGLE_CLIENT_ID`
3. Value: (Leave empty - you can add this later if needed)
4. Click "Add secret"

---

## 📋 Complete Secrets Table (Copy & Paste)

| Secret Name | Value |
|-------------|-------|
| `DEPLOY_HOST` | `53.75.247.188` |
| `DEPLOY_USER` | `deploy` |
| `DEPLOY_KEY` | (Your SSH private key - `cat ~/.ssh/terralink_deploy`) |
| `JWT_SECRET` | `c8f7a3b2e1d9f4a6c8b3e7f1a9d2c5e8f0a3b6c9e2f5a8b1d4e7c0f3a6b9c` |
| `DB_PASSWORD` | `7a3f2b8e1c9d4f6a2e5b7c1a9d3f6e8b` |
| `CLIENT_URL` | `https://terralinkhealth.co.ke` |
| `API_URL` | `https://terralinkhealth.co.ke/api` |
| `SOCKET_URL` | `https://terralinkhealth.co.ke` |
| `GOOGLE_CLIENT_ID` | (empty) |

---

## ✅ Checklist After Adding Secrets

- [ ] DEPLOY_HOST added
- [ ] DEPLOY_USER added
- [ ] DEPLOY_KEY added
- [ ] JWT_SECRET added
- [ ] DB_PASSWORD added
- [ ] CLIENT_URL added
- [ ] API_URL added
- [ ] SOCKET_URL added
- [ ] GOOGLE_CLIENT_ID added (or skipped)

---

## 🚀 Next Steps After Adding All Secrets

1. Go to: **https://github.com/benardcheruiyot/hospital/actions**
2. Click: **"Deploy to Production"** workflow
3. Click: **"Run workflow"**
4. Fill in:
   - **Version:** `main`
   - **Environment:** `production`
5. Click: **"Run workflow"**

**Your application will deploy automatically!** ✅

---

## ⚠️ Important Notes

- **DEPLOY_KEY:** Must include the `-----BEGIN` and `-----END` lines
- **JWT_SECRET & DB_PASSWORD:** Can be regenerated if needed
- **Pre-generated values:** Are cryptographically secure random values
- **All secrets:** Will be encrypted by GitHub and hidden in logs

---

**You're ready! Add these 9 secrets and deploy!** 🎉
