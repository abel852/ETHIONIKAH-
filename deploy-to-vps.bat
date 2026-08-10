@echo off
echo ========================================
echo Deploying to VPS: 187.77.79.247
echo ========================================
echo.

echo Step 1: Pulling latest code from GitHub...
ssh root@187.77.79.247 "cd /var/www/ETHIONIKAH- && git pull origin main"
if %errorlevel% neq 0 (
    echo ERROR: Failed to pull code from GitHub
    pause
    exit /b 1
)
echo.

echo Step 2: Installing/updating backend dependencies...
ssh root@187.77.79.247 "cd /var/www/ETHIONIKAH-/backend && npm install --production"
if %errorlevel% neq 0 (
    echo WARNING: Failed to install backend dependencies
)
echo.

echo Step 3: Restarting backend service...
ssh root@187.77.79.247 "pm2 restart ethionikah-backend"
if %errorlevel% neq 0 (
    echo ERROR: Failed to restart backend
    pause
    exit /b 1
)
echo.

echo Step 4: Installing/updating frontend dependencies...
ssh root@187.77.79.247 "cd /var/www/ETHIONIKAH-/frontend && npm install --production"
if %errorlevel% neq 0 (
    echo WARNING: Failed to install frontend dependencies
)
echo.

echo Step 5: Building frontend...
ssh root@187.77.79.247 "cd /var/www/ETHIONIKAH-/frontend && npm run build"
if %errorlevel% neq 0 (
    echo ERROR: Failed to build frontend
    pause
    exit /b 1
)
echo.

echo Step 6: Restarting frontend service...
ssh root@187.77.79.247 "pm2 restart ethionikah-frontend"
if %errorlevel% neq 0 (
    echo ERROR: Failed to restart frontend
    pause
    exit /b 1
)
echo.

echo Step 7: Checking service status...
ssh root@187.77.79.247 "pm2 status"
echo.

echo ========================================
echo Deployment completed successfully!
echo ========================================
echo.
echo Changes deployed:
echo - Fixed 2FA admin logout issue
echo - Admin settings now support direct tab navigation
echo - Added user cleanup scripts
echo.
pause
