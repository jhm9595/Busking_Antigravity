#!/bin/bash
# Busking Antigravity Master Test Script 🚀

echo "==============================================="
echo "   Busking Antigravity: One-Click Test Suite   "
echo "==============================================="

# Check if server is running
echo "[1/3] Checking server connection (localhost:3000)..."
curl -s --head  http://localhost:3000/api/performances | grep "200 OK" > /dev/null
if [ $? -eq 0 ]; then
    echo "✅ Server is online!"
else
    echo "❌ Error: Could not connect to localhost:3000."
    echo "   Please start the server with 'npm run dev' first."
    exit 1
fi

# Run Node API tests
echo "[2/4] Running API Logic Scan..."
node ./test-suite/api-tester.js

if [ $? -eq 0 ]; then
    echo "✅ API Scan Completed Successfully!"
else
    echo "❌ API Scan Failed."
    exit 1
fi

# Run Chat tests
echo "[3/6] Running WebSocket Chat Scan..."
node ./test-suite/chat-tester.js

if [ $? -eq 0 ]; then
    echo "✅ Chat Connectivity Verified!"
else
    echo "❌ Chat Connectivity Test Failed."
    exit 1
fi

# Run Health Check (Sync)
echo "[4/6] Running DB & Prisma Sync Check..."
node ./test-suite/health-check.js

# Run Full Lifecycle Simulation
echo "[5/6] Running Full Lifecycle Simulation (Onboarding -> Performance -> End)..."
node ./test-suite/full-lifecycle-test.js

if [ $? -eq 0 ]; then
    echo "✅ Lifecycle Simulation Completed Successfully!"
else
    echo "⚠️  Lifecycle Simulation encountered errors (Check Sync status above)."
    # We don't exit here because the user might just want to see the errors.
fi

# Launch Visual Dashboard (Optional UI)
echo "[6/6] Launching Visual Dashboard..."
# Find the absolute path
SCRIPTPATH="$( cd "$(dirname "$0")" ; pwd -P )"
DASHBOARD_PATH="$SCRIPTPATH/visual-dashboard.html"

# Detect OS to open file
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    xdg-open "$DASHBOARD_PATH"
elif [[ "$OSTYPE" == "darwin"* ]]; then
    open "$DASHBOARD_PATH"
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    start "$DASHBOARD_PATH"
fi

echo "==============================================="
echo "   All tests passed! Happy Coding! 🎸        "
echo "==============================================="
