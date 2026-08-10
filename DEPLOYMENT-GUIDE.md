# Deployment Guide to VPS

## Changes Ready to Deploy

### 1. 2FA Admin Access Fix ✅
- **Issue**: Super admins were logged out when clicking "Enable Now" for 2FA
- **Solution**: 
  - Removed `/settings` from USER_ONLY_ROUTES
  - Admins can now access settings for 2FA setup
  - TwoFactorPrompt redirects admins to admin settings with security tab

### 2. User Cleanup Scripts ✅
- `backend/scripts/clear-users.js` - Comprehensive cleanup script
- `backend/scripts/cleanup-test-users.js` - Production-ready alternative
- Both preserve super admin accounts and handle all foreign keys

---

## Deployment Methods

### Method 1: Quick Deploy (Recommended)
Run the quick deploy script:
```bash
quick-deploy.bat
```
This will pull code, restart backend, rebuild and restart frontend.

### Method 2: Full Deploy with Checks
Run the comprehensive deployment script:
```bash
deploy-to-vps.bat
```
This includes dependency updates and detailed error checking.

### Method 3: Manual Deployment
Run commands one by one:

```bash
# 1. Connect to VPS
ssh root@187.77.79.247

# 2. Pull latest code
cd /var/www/ETHIONIKAH-
git pull origin main

# 3. Restart backend
pm2 restart ethionikah-backend

# 4. Rebuild frontend
cd frontend
npm run build

# 5. Restart frontend
pm2 restart ethionikah-frontend

# 6. Check status
pm2 status

# 7. Exit SSH
exit
```

---

## After Deployment

### 1. Test the 2FA Fix
1. Login as super admin
2. Wait for 2FA notification banner
3. Click "Enable Now"
4. **Expected**: Redirected to Admin Settings → Security tab
5. **Expected**: NOT logged out
6. Click "Enable 2FA" button
7. **Expected**: Redirected to `/settings?section=two-factor` to set up 2FA

### 2. Optional: Clear Test Users (BE CAREFUL!)
If you want to remove all test users from production:

```bash
# SSH to server
ssh root@187.77.79.247

# Navigate to backend
cd /var/www/ETHIONIKAH-/backend

# Run cleanup script (will preserve super admins)
node scripts/clear-users.js

# OR use the alternative
node scripts/cleanup-test-users.js
```

**⚠️ WARNING**: This will delete ALL users except super admins!
- The script gives you 5 seconds to cancel (Ctrl+C)
- Backs up all super admin accounts before deletion
- Shows detailed progress

---

## Rollback (If Needed)

If something goes wrong:

```bash
ssh root@187.77.79.247
cd /var/www/ETHIONIKAH-

# Go back to previous commit
git reset --hard HEAD~1

# Restart services
pm2 restart ethionikah-backend
cd frontend && npm run build && pm2 restart ethionikah-frontend
```

---

## Verifying Deployment

### Check Backend Logs
```bash
ssh root@187.77.79.247
pm2 logs ethionikah-backend --lines 50
```

### Check Frontend Logs
```bash
ssh root@187.77.79.247
pm2 logs ethionikah-frontend --lines 50
```

### Check Service Status
```bash
ssh root@187.77.79.247
pm2 status
```

### Test the Website
1. Visit: https://www.ethionikah.com
2. Login as super admin
3. Test 2FA notification and "Enable Now" button
4. Verify you're NOT logged out
5. Check admin settings Security tab loads correctly

---

## Troubleshooting

### Frontend Build Fails
```bash
ssh root@187.77.79.247
cd /var/www/ETHIONIKAH-/frontend
rm -rf .next node_modules
npm install
npm run build
pm2 restart ethionikah-frontend
```

### Backend Won't Start
```bash
ssh root@187.77.79.247
cd /var/www/ETHIONIKAH-/backend
pm2 logs ethionikah-backend --lines 100
```

### Database Connection Issues
```bash
ssh root@187.77.79.247
cd /var/www/ETHIONIKAH-/backend
# Check .env file exists and has correct DATABASE_URL
cat .env | grep DATABASE_URL
```

---

## Files Changed in This Deployment

### Frontend
- `frontend/src/components/auth/RouteGuard.tsx` - Removed /settings from USER_ONLY_ROUTES
- `frontend/src/components/auth/TwoFactorPrompt.tsx` - Admin redirect logic
- `frontend/src/app/admin/settings/page.tsx` - Added URL tab parameter support

### Backend
- `backend/scripts/clear-users.js` - New comprehensive cleanup script
- `backend/scripts/cleanup-test-users.js` - New production cleanup script

---

## Post-Deployment Checklist

- [ ] Backend is running (`pm2 status`)
- [ ] Frontend is running (`pm2 status`)
- [ ] Website is accessible
- [ ] Super admin can login
- [ ] 2FA "Enable Now" button works
- [ ] Admin not logged out when clicking "Enable Now"
- [ ] Admin settings Security tab accessible
- [ ] No errors in backend logs
- [ ] No errors in frontend logs

---

## Contact

If you encounter issues:
1. Check logs: `pm2 logs`
2. Check service status: `pm2 status`
3. Review this guide's troubleshooting section
4. Consider rollback if critical
