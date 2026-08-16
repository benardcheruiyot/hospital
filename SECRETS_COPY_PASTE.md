# 🔐 Copy These Exact Values to GitHub Secrets

**Ready to paste - Just copy each value and paste in GitHub**

---

## Your Secrets (Just Copy & Paste)

### 1️⃣ DEPLOY_HOST
```
53.75.247.188
```

### 2️⃣ DEPLOY_USER
```
deploy
```

### 3️⃣ DEPLOY_KEY
```
RUN THIS ON YOUR COMPUTER:
cat ~/.ssh/terralink_deploy

Then copy the entire output
```

### 4️⃣ JWT_SECRET
```
c8f7a3b2e1d9f4a6c8b3e7f1a9d2c5e8f0a3b6c9e2f5a8b1d4e7c0f3a6b9c
```

### 5️⃣ DB_PASSWORD
```
7a3f2b8e1c9d4f6a2e5b7c1a9d3f6e8b
```

### 6️⃣ CLIENT_URL
```
https://terralinkhealth.co.ke
```

### 7️⃣ API_URL
```
https://terralinkhealth.co.ke/api
```

### 8️⃣ SOCKET_URL
```
https://terralinkhealth.co.ke
```

### 9️⃣ GOOGLE_CLIENT_ID
```
(leave empty for now)
```

---

## 🎯 Quick Steps to Add Each Secret

**For each secret above:**

1. Go to: https://github.com/benardcheruiyot/hospital/settings/secrets/actions
2. Scroll to "Environments" → Click on "production"
3. Click "Add secret"
4. Copy the **Name** from below (e.g., `DEPLOY_HOST`)
5. Copy the **Value** from above (e.g., `53.75.247.188`)
6. Click "Add secret"
7. Repeat for next secret

---

## 📋 Exact Names to Use as "Name" in GitHub

```
DEPLOY_HOST
DEPLOY_USER
DEPLOY_KEY
JWT_SECRET
DB_PASSWORD
CLIENT_URL
API_URL
SOCKET_URL
GOOGLE_CLIENT_ID
```

---

## ⏱️ Total Time: ~5 minutes

Just copy & paste 9 times and you're done!

---

## 🚀 After Adding All Secrets

1. Go to GitHub Actions
2. Click "Deploy to Production"
3. Click "Run workflow"
4. Version: `main`, Environment: `production`
5. Click "Run workflow"
6. Watch it deploy! ✅

---

**That's it! Your CI/CD is complete!** 🎉
