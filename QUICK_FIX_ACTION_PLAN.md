# 🚀 Quick Action Plan - Fix Deployment Error NOW

## Your Issue
```
mkdir: cannot create directory '/home/runner': Permission denied
```

## ⚡ Fastest Solution (5 Minutes)

### Step 1: SSH to Your Server (as root)
```bash
ssh root@YOUR_VPS_IP
```

### Step 2: Run the Fix Script
```bash
curl -fsSL https://raw.githubusercontent.com/benardcheruiyot/hospital/main/scripts/fix-permissions.sh | bash
```

### Step 3: Verify SSH Works
```bash
exit  # logout from root
ssh -i ~/.ssh/deploy_key deploy@YOUR_VPS_IP "whoami"
```

Should output: `deploy`

### Step 4: Retry Deployment
Go back to GitHub Actions and click "Re-run jobs" on the failed workflow.

**Expected result:** ✅ Deployment succeeds

---

## 🔧 If That Doesn't Work

### Alternative: Full Re-setup

```bash
# SSH as root
ssh root@YOUR_VPS_IP

# Run full setup
curl -fsSL https://raw.githubusercontent.com/benardcheruiyot/hospital/main/scripts/setup-server.sh | bash -s production

# Logout
exit
```

Then retry the GitHub Actions deployment.

---

## ✅ What Was Fixed

1. **Updated GitHub Actions workflow** - Better error handling for directory creation
2. **Added home directory verification** - Checks permissions before deployment
3. **Improved setup script** - Ensures deploy user home directory is always writable
4. **Created emergency fix script** - One-command permission repair
5. **Added troubleshooting guide** - Detailed solutions for permission issues

---

## 📋 Pre-Deployment Checklist

Before retrying deployment, verify:

```bash
# Can you SSH to your server?
ssh -i ~/.ssh/deploy_key deploy@YOUR_VPS_IP "echo 'SSH works!'"

# Does the deploy user exist?
ssh -i ~/.ssh/deploy_key deploy@YOUR_VPS_IP "id"

# Can the deploy user create directories?
ssh -i ~/.ssh/deploy_key deploy@YOUR_VPS_IP "mkdir -p ~/test && rmdir ~/test && echo 'Can create dirs!'"
```

All three should work without errors.

---

## 📚 Full Documentation

For detailed information, see:
- `PERMISSION_FIX_SUMMARY.md` - Comprehensive explanation of fixes
- `DEPLOYMENT_TROUBLESHOOTING.md` - Detailed troubleshooting guide
- `INTERSERVER_DEPLOYMENT.md` - Full deployment setup

---

## 🆘 Still Having Issues?

Check the GitHub Actions logs for the full error:
1. Go to your GitHub repository
2. Click "Actions"
3. Click the failed "Deploy to Production" workflow
4. Click the job and scroll to see the error
5. Look for the step that failed and the error message

Common issues:
- `DEPLOY_KEY` not set correctly in GitHub Secrets → Paste the full private key with newlines
- `DEPLOY_HOST` not set → Should be your VPS IP or domain
- `DEPLOY_USER` not set → Should be `deploy`
- SSH key not in `authorized_keys` → Run setup script again or check permissions manually

**Run the fix script (Step 2 above) and try again!**

---

Done! Your deployment should now work. 🎉
