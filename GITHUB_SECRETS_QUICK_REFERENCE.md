# 🔐 GitHub Secrets Quick Reference - TerraLink Health

**For:** terralinkhealth.co.ke on Interserver VPS (53.75.247.188)

---

## 📋 All Secrets You Need to Add

Copy the exact values below into GitHub Settings → Secrets and variables → Actions → production environment

### Secret 1: DEPLOY_HOST
```
Name:  DEPLOY_HOST
Value: 53.75.247.188
```

### Secret 2: DEPLOY_USER
```
Name:  DEPLOY_USER
Value: deploy
```

### Secret 3: DEPLOY_KEY
```
Name:  DEPLOY_KEY
Value: (See instructions below)
```

### Secret 4: JWT_SECRET
```
Name:  JWT_SECRET
Value: (Generate with: openssl rand -hex 32)
```

### Secret 5: DB_PASSWORD
```
Name:  DB_PASSWORD
Value: (Generate with: openssl rand -hex 16)
```

### Secret 6: CLIENT_URL
```
Name:  CLIENT_URL
Value: https://terralinkhealth.co.ke
```

### Secret 7: API_URL
```
Name:  API_URL
Value: https://terralinkhealth.co.ke/api
```

### Secret 8: SOCKET_URL
```
Name:  SOCKET_URL
Value: https://terralinkhealth.co.ke
```

### Secret 9: GOOGLE_CLIENT_ID (Optional)
```
Name:  GOOGLE_CLIENT_ID
Value: (your-client-id or leave empty)
```

---

## 🔑 How to Get DEPLOY_KEY

### Step 1: View Your Private Key
```bash
cat ~/.ssh/terralink_deploy
```

### Step 2: Copy Everything
Your private key should look like:
```
-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5
y6z7a8b9c0d1e2f3g4h5i6j7k8l9m0n1o2p3q4r5s6t7u8v9w0x1y2z3a4b5c6d7
e8f9g0h1i2j3k4l5m6n7o8p9q0r1s2t3u4v5w6x7y8z9a0b1c2d3e4f5g6h7i8j9
k0l1m2n3o4p5q6r7s8t9u0v1w2x3y4z5a6b7c8d9e0f1g2h3i4j5k6l7m8n9o0p
-----END RSA PRIVATE KEY-----
```

### Step 3: Copy Everything to GitHub
- **Include** the `-----BEGIN RSA PRIVATE KEY-----` line
- **Include** the `-----END RSA PRIVATE KEY-----` line
- **Include** all the random characters in between
- Paste into GitHub Secret named `DEPLOY_KEY`

---

## 🎯 Step-by-Step to Add to GitHub

1. **Open GitHub:** https://github.com/benardcheruiyot/hospital
2. **Click:** Settings tab
3. **Click:** Secrets and variables → Actions
4. **Scroll down** to Environments section
5. **Click:** "New environment"
6. **Type:** `production`
7. **Click:** "Configure environment"
8. **Now add each secret:**
   - Click "Add secret"
   - Enter Name (e.g., `DEPLOY_HOST`)
   - Enter Value (e.g., `53.75.247.188`)
   - Click "Add secret"
9. **Repeat** for all 9 secrets above

---

## ⚡ Generate Secrets (Do This First!)

### Generate JWT_SECRET
```bash
openssl rand -hex 32
```
**Save the output** - you'll paste this as JWT_SECRET value

### Generate DB_PASSWORD
```bash
openssl rand -hex 16
```
**Save the output** - you'll paste this as DB_PASSWORD value

---

## ✅ Verify All Secrets Are Added

In GitHub, under production environment, you should see:
```
✓ DEPLOY_HOST
✓ DEPLOY_USER
✓ DEPLOY_KEY
✓ JWT_SECRET
✓ DB_PASSWORD
✓ CLIENT_URL
✓ API_URL
✓ SOCKET_URL
✓ GOOGLE_CLIENT_ID (optional)
```

All will show as hidden (dots).

---

## 🚀 Ready to Deploy!

Once all secrets are added:

1. Go to **Actions** tab
2. Select **"Deploy to Production"**
3. Click **"Run workflow"**
4. Set Version: `main` and Environment: `production`
5. Click **"Run workflow"**

**Done!** Your CI/CD pipeline is now fully configured! ✅

---

## ❓ Quick Answers

**Q: Can I see my secrets after adding them?**
A: No, GitHub hides them for security. That's normal.

**Q: What if I make a mistake?**
A: Click the pencil icon next to the secret and update it.

**Q: Do I need GOOGLE_CLIENT_ID?**
A: Only if you use Google OAuth. Can leave blank for now.

**Q: When do I use these secrets?**
A: Automatically when you run the Deploy workflow in GitHub Actions.

**Q: How often should I rotate secrets?**
A: Every 90 days recommended, or whenever you change passwords.

---

## 📞 Need Help?

- **Can't find Settings?** https://github.com/benardcheruiyot/hospital/settings
- **Confused about DEPLOY_KEY?** It's your SSH private key (start with `-----BEGIN...`)
- **Lost your SSH key?** Generate a new one: `ssh-keygen -t rsa -b 4096 -f ~/.ssh/terralink_deploy -N ""`

---

**Your deployment is now ready to launch! 🎉**
