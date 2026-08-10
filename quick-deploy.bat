@echo off
echo Quick Deploy to VPS
echo ====================
echo.
echo This will:
echo 1. Pull latest code
echo 2. Restart backend
echo 3. Rebuild and restart frontend
echo.

ssh root@187.77.79.247 "cd /var/www/ETHIONIKAH- && git pull origin main && pm2 restart ethionikah-backend && cd frontend && npm run build && pm2 restart ethionikah-frontend && pm2 status"

echo.
echo Done! Check the output above for any errors.
pause
