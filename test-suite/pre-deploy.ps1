# Pre-Deploy Verification Pipeline (PowerShell)
# Usage: .\test-suite\pre-deploy.ps1 [-Deploy]
# Exit 0 = all pass (deploy allowed), Exit 1 = failure (deploy blocked)

param(
    [switch]$Deploy
)

$ErrorActionPreference = 'Continue'
$ProgressPreference = 'SilentlyContinue'

$resultsDir = Join-Path $PSScriptRoot 'results'
$summaryPath = Join-Path $resultsDir 'pre-deploy-summary.json'

# Initialize summary
$summary = [ordered]@{
    suite       = 'pre-deploy'
    pass        = $false
    startedAt   = (Get-Date).ToString('o')
    finishedAt  = $null
    allPassed   = $false
    results     = @()
    deployIntended = [bool]$Deploy
    deployExecuted = $false
}

# Ensure results directory
if (-not (Test-Path $resultsDir)) {
    New-Item -ItemType Directory -Path $resultsDir -Force | Out-Null
}

function Add-Result {
    param([string]$Name, [bool]$Pass, [string]$Message = '', [hashtable]$Extra = @{})
    $entry = [ordered]@{
        name    = $Name
        pass    = $Pass
        message = $Message
    }
    foreach ($k in $Extra.Keys) { $entry[$k] = $Extra[$k] }
    $summary.results += $entry
    if ($Pass) {
        Write-Output "[PASS] $Name"
    } else {
        Write-Output "[FAIL] $Name - $Message"
    }
}

function Write-Summary {
    $summary.finishedAt = (Get-Date).ToString('o')
    $summary.allPassed = ($summary.results | Where-Object { $_.pass -eq $false }).Count -eq 0
    $summary.pass = $summary.allPassed
    $summary | ConvertTo-Json -Depth 8 | Set-Content -Path $summaryPath -Encoding UTF8
}

function Invoke-NodeTest {
    param([string]$Name, [string]$Command, [string]$OutPath = $null)

    $fullOutPath = if ($OutPath) { Join-Path $resultsDir $OutPath } else { $null }
    $actualCommand = if ($fullOutPath) { "$Command --out $fullOutPath" } else { $Command }

    Write-Output "--> Running: $Name"
    try {
        $global:LASTEXITCODE = 0
        Invoke-Expression $actualCommand 2>&1 | Tee-Object -Variable output
        if ($LASTEXITCODE -ne 0) {
            throw "Exited with code $LASTEXITCODE"
        }
        Add-Result -Name $Name -Pass $true
        return $true
    } catch {
        $errorMsg = if ($output) { ($output | Out-String).Trim() } else { $_.Exception.Message }
        Add-Result -Name $Name -Pass $false -Message $errorMsg
        return $false
    }
}

Write-Output "==============================================="
Write-Output "  Pre-Deploy Verification Pipeline"
Write-Output "==============================================="
Write-Output ""

# Step 1: Lint
Write-Output "[1/7] Lint..."
try {
    npm run lint 2>&1 | Tee-Object -Variable lintOut
    if ($LASTEXITCODE -ne 0) { throw "Lint failed" }
    Add-Result -Name 'lint' -Pass $true
} catch {
    Add-Result -Name 'lint' -Pass $false -Message ($lintOut | Out-String)
}

# Step 2: Build
Write-Output "[2/7] Build..."
try {
    npm run build 2>&1 | Tee-Object -Variable buildOut
    if ($LASTEXITCODE -ne 0) { throw "Build failed" }
    Add-Result -Name 'build' -Pass $true
} catch {
    Add-Result -Name 'build' -Pass $false -Message ($buildOut | Out-String)
}

# Step 3: Security Foundation
Write-Output "[3/7] Security foundation checks..."
Invoke-NodeTest -Name 'security-foundation-anon-read' `
    -Command 'node ./test-suite/security/foundation.test.js --case anonymous-read-allowed' `
    -OutPath 'security-foundation-anon-read.json'
Invoke-NodeTest -Name 'security-foundation-anon-write' `
    -Command 'node ./test-suite/security/foundation.test.js --case anonymous-write-rejected' `
    -OutPath 'security-foundation-anon-write.json'
Invoke-NodeTest -Name 'security-foundation-cross-owner' `
    -Command 'node ./test-suite/security/foundation.test.js --case cross-owner-write-forbidden' `
    -OutPath 'security-foundation-cross-owner.json'

# Step 4: Security Mutating Writes
Write-Output "[4/7] Security mutating writes checks..."
Invoke-NodeTest -Name 'mutating-unauthenticated' `
    -Command 'node ./test-suite/security/mutating-writes.test.js --case unauthenticated-write-returns-401' `
    -OutPath 'mutating-unauthenticated.json'
Invoke-NodeTest -Name 'mutating-cross-owner' `
    -Command 'node ./test-suite/security/mutating-writes.test.js --case foreign-performance-update-returns-403' `
    -OutPath 'mutating-cross-owner.json'

# Step 5: Lifecycle Read-Only
Write-Output "[5/7] Lifecycle read-only checks..."
Invoke-NodeTest -Name 'lifecycle-performances-no-write' `
    -Command 'node ./test-suite/lifecycle/read-only.test.js --case get-performances-no-db-write' `
    -OutPath 'lifecycle-performances-no-write.json'
Invoke-NodeTest -Name 'lifecycle-singer-no-write' `
    -Command 'node ./test-suite/lifecycle/read-only.test.js --case get-singer-no-db-write' `
    -OutPath 'lifecycle-singer-no-write.json'

# Step 6: API Smoke (requires running server)
Write-Output "[6/7] API smoke tests..."
Invoke-NodeTest -Name 'api-smoke' -Command 'node ./test-suite/api-tester.js'
Invoke-NodeTest -Name 'chat-smoke' -Command 'node ./test-suite/chat-tester.js'

# Step 7: Playwright E2E (optional, if installed)
Write-Output "[7/7] Playwright E2E tests..."
try {
    $null = Get-Command npx -ErrorAction Stop
    npx playwright test 2>&1 | Tee-Object -Variable pwOut
    if ($LASTEXITCODE -ne 0) { throw "Playwright tests failed" }
    Add-Result -Name 'playwright-e2e' -Pass $true
} catch {
    Add-Result -Name 'playwright-e2e' -Pass $false -Message ($pwOut | Out-String)
}

# Summary
Write-Summary
Write-Output ""
Write-Output "==============================================="
Write-Output "  Summary"
Write-Output "==============================================="

$passed = ($summary.results | Where-Object { $_.pass -eq $true }).Count
$failed = ($summary.results | Where-Object { $_.pass -eq $false }).Count
$total = $summary.results.Count

Write-Output "Passed: $passed / $total"
Write-Output "Failed: $failed"

if ($failed -gt 0) {
    Write-Output ""
    Write-Output "Failed checks:"
    $summary.results | Where-Object { $_.pass -eq $false } | ForEach-Object {
        Write-Output "  - $($_.name): $($_.message)"
    }
}

Write-Output ""
Write-Output "Summary written: $summaryPath"

if ($summary.allPassed) {
    Write-Output "✅ ALL CHECKS PASSED. Safe to deploy."
    if ($Deploy) {
        Write-Output ""
        Write-Output "Deploying..."
        npm run deploy 2>&1 | Tee-Object -Variable deployOut
        if ($LASTEXITCODE -ne 0) {
            Write-Output "❌ Deploy failed!"
            exit 1
        }
        $summary.deployExecuted = $true
        Write-Summary
        Write-Output "✅ Deploy completed."
    }
    exit 0
} else {
    Write-Output "❌ SOME CHECKS FAILED. Deploy blocked."
    exit 1
}
