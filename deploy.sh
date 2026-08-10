#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

VPS_IP="187.77.79.247"
VPS_USER="root"
APP_DIR="/var/www/ETHIONIKAH-"

echo "========================================"
echo "Deploying to VPS: $VPS_IP"
echo "========================================"
echo

# Function to run SSH command
run_ssh() {
    ssh $VPS_USER@$VPS_IP "$1"
    return $?
}

# Step 1: Pull latest code
echo -e "${YELLOW}Step 1: Pulling latest code from GitHub...${NC}"
if run_ssh "cd $APP_DIR && git pull origin main"; then
    echo -e "${GREEN}✓ Code pulled successfully${NC}"
else
    echo -e "${RED}✗ Failed to pull code${NC}"
    exit 1
fi
echo

# Step 2: Restart backend
echo -e "${YELLOW}Step 2: Restarting backend service...${NC}"
if run_ssh "pm2 restart ethionikah-backend"; then
    echo -e "${GREEN}✓ Backend restarted${NC}"
else
    echo -e "${RED}✗ Failed to restart backend${NC}"
    exit 1
fi
echo

# Step 3: Clear frontend cache and rebuild
echo -e "${YELLOW}Step 3: Clearing frontend cache...${NC}"
run_ssh "cd $APP_DIR/frontend && rm -rf .next"
echo -e "${GREEN}✓ Cache cleared${NC}"
echo

echo -e "${YELLOW}Step 4: Rebuilding frontend...${NC}"
if run_ssh "cd $APP_DIR/frontend && npm run build"; then
    echo -e "${GREEN}✓ Frontend built successfully${NC}"
else
    echo -e "${RED}✗ Failed to build frontend${NC}"
    exit 1
fi
echo

# Step 4: Restart frontend
echo -e "${YELLOW}Step 5: Restarting frontend service...${NC}"
if run_ssh "pm2 restart ethionikah-frontend"; then
    echo -e "${GREEN}✓ Frontend restarted${NC}"
else
    echo -e "${RED}✗ Failed to restart frontend${NC}"
    exit 1
fi
echo

# Step 5: Check status
echo -e "${YELLOW}Step 6: Checking service status...${NC}"
run_ssh "pm2 status"
echo

echo "========================================"
echo -e "${GREEN}Deployment completed successfully!${NC}"
echo "========================================"
echo
echo "Changes deployed:"
echo "  ✓ Fixed 2FA admin logout issue"
echo "  ✓ Admin settings support tab navigation"
echo "  ✓ Added user cleanup scripts"
echo
echo "Next steps:"
echo "  1. Visit https://www.ethionikah.com"
echo "  2. Login as super admin"
echo "  3. Test 2FA 'Enable Now' button"
echo "  4. Verify no logout occurs"
echo
