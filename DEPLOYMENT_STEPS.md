# Deployment Steps for VPS

## Changes Made
- Fixed admin route guard bug that was logging out super admins when accessing settings page for 2FA setup
- Commit: `89943a9` - "Fix: Allow admins to access settings page for 2FA setup"

## Already Completed
✅ Changes pushed to GitHub: https://github.com/abel852/ETHIONIKAH-.git

## VPS Deployment Steps

### 1. SSH into your VPS
```bash
ssh root@YOUR_VPS_IP
# OR
ssh your_username@YOUR_VPS_IP
```

### 2. Navigate to the project directory
```bash
cd /path/to/Islamic-Marriage-Platform
# Common paths might be:
# cd /var/www/ethionikah
# cd /home/user/Islamic-Marriage-Platform
# cd ~/Islamic-Marriage-Platform
```

### 3. Pull the latest changes from GitHub
```bash
git pull origin main
```

### 4. Install dependencies (if needed)
```bash
# Backend dependencies
cd backend
npm install
cd ..

# Frontend dependencies
cd frontend
npm install
cd ..
```

### 5. Build the frontend
```bash
cd frontend
npm run build
cd ..
```

### 6. Restart PM2 services
```bash
pm2 restart ethionikah-backend ethionikah-frontend
```

### 7. Verify deployment
```bash
# Check PM2 status
pm2 status

# Check backend logs
pm2 logs ethionikah-backend --lines 50

# Check frontend logs
pm2 logs ethionikah-frontend --lines 50
```

### 8. Test the fix
1. Login as super admin
2. You should see the 2FA notification banner
3. Click "Enable Now"
4. You should be redirected to Settings > Security > Two-Factor Auth
5. **You should NOT be logged out** (this was the bug that's now fixed)

## Troubleshooting

### If PM2 is not installed
```bash
npm install -g pm2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### If services don't start
```bash
# Check PM2 logs for errors
pm2 logs

# Restart individual services
pm2 restart ethionikah-backend
pm2 restart ethionikah-frontend

# Or restart all services
pm2 restart all
```

### If changes aren't reflected
```bash
# Hard reset to remote branch (WARNING: loses local changes)
git fetch origin
git reset --hard origin/main

# Then rebuild and restart
cd frontend
npm run build
cd ..
pm2 restart all
```

### Check Nginx configuration
```bash
# Test Nginx config
sudo nginx -t

# Reload Nginx if needed
sudo systemctl reload nginx
```

## Quick Deploy Script
You can also create a deploy script for future updates:

```bash
# Create deploy.sh in project root
cat > deploy.sh << 'EOF'
#!/bin/bash
echo "🚀 Deploying ETHIONIKAH updates..."

# Pull latest changes
echo "📥 Pulling from GitHub..."
git pull origin main

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install --production
cd ..

# Build frontend
echo "🏗️  Building frontend..."
cd frontend
npm install --production
npm run build
cd ..

# Restart services
echo "🔄 Restarting services..."
pm2 restart ethionikah-backend ethionikah-frontend

# Show status
echo "✅ Deployment complete!"
pm2 status
EOF

chmod +x deploy.sh
```

Then for future deployments, just run:
```bash
./deploy.sh
```

## Verification Checklist
- [ ] Git pull completed successfully
- [ ] Frontend build completed without errors
- [ ] PM2 services restarted successfully
- [ ] Backend logs show no errors
- [ ] Frontend logs show no errors
- [ ] Website accessible at https://ethionikah.com
- [ ] API responding at https://api.ethionikah.com
- [ ] Super admin can access settings page
- [ ] Super admin can enable 2FA without being logged out

## Notes
- The fix only modified one file: `frontend/src/components/auth/RouteGuard.tsx`
- No database migrations required
- No environment variable changes required
- Zero downtime deployment
