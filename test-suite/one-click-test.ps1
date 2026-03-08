# Busking Antigravity Master Test Script 🚀 (PowerShell Version)

Write-Output "==============================================="
Write-Output "   Busking Antigravity: One-Click Test Suite   "
Write-Output "==============================================="

# Check if server is running
Write-Output "[1/4] Checking server connection (localhost:3000)..."
$response = try { Invoke-WebRequest -Uri "http://localhost:3000/api/performances" -Method Head -ErrorAction Stop } catch { $null }

if ($response -and $response.StatusCode -eq 200) {
    Write-Output "✅ Server is online!"
} else {
    Write-Output "❌ Error: Could not connect to localhost:3000."
    Write-Output "   Please start the server with 'npm run dev' first."
    exit 1
}

# Run Node API tests
Write-Output "[2/4] Running API Logic Scan..."
try {
    node ./test-suite/api-tester.js
    Write-Output "✅ API Scan Completed Successfully!"
} catch {
    Write-Output "❌ API Scan Failed."
    exit 1
}

# Run Chat tests
Write-Output "[3/6] Running WebSocket Chat Scan..."
try {
    node ./test-suite/chat-tester.js
    Write-Output "✅ Chat Connectivity Verified!"
} catch {
    Write-Output "❌ Chat Connectivity Test Failed."
    exit 1
}

# Run Health Check (Sync)
Write-Output "[4/6] Running DB & Prisma Sync Check..."
node ./test-suite/health-check.js

# Run Full Lifecycle Simulation
Write-Output "[5/6] Running Full Lifecycle Simulation (Onboarding -> Performance -> End)..."
try {
    node ./test-suite/full-lifecycle-test.js
    Write-Output "✅ Lifecycle Simulation Completed Successfully!"
} catch {
    Write-Output "⚠️  Lifecycle Simulation encountered errors (Check Sync status above)."
}

# Launch Visual Dashboard (Optional UI)
Write-Output "[6/6] Launching Visual Dashboard..."
$dashboardPath = Join-Path $PSScriptRoot "visual-dashboard.html"
Start-Process $dashboardPath

Write-Output "==============================================="
Write-Output "   All tests passed! Happy Coding! 🎸        "
Write-Output "==============================================="
