# Busking Antigravity one-click smoke runner (PowerShell)

$ErrorActionPreference = 'Stop'
$summaryPath = Join-Path $PSScriptRoot 'results/one-click-smoke-summary.json'

$summary = [ordered]@{
    suite = 'one-click-smoke'
    pass = $false
    startedAt = (Get-Date).ToString('o')
    finishedAt = $null
    checks = @()
}

function Write-Summary {
    param([bool]$Pass)
    $summary.pass = $Pass
    $summary.finishedAt = (Get-Date).ToString('o')

    $summaryDir = Split-Path -Parent $summaryPath
    if (-not (Test-Path $summaryDir)) {
        New-Item -ItemType Directory -Path $summaryDir | Out-Null
    }

    $summary | ConvertTo-Json -Depth 8 | Set-Content -Path $summaryPath -Encoding UTF8
}

function Invoke-Step {
    param(
        [string]$Name,
        [string]$Command
    )

    Write-Output "--> $Name"
    try {
        $global:LASTEXITCODE = 0
        Invoke-Expression $Command
        if ($LASTEXITCODE -ne 0) {
            throw "Command exited with code ${LASTEXITCODE}: $Command"
        }
        $summary.checks += [ordered]@{ name = $Name; pass = $true }
        Write-Output "[pass] $Name"
    } catch {
        $summary.checks += [ordered]@{ name = $Name; pass = $false; error = $_.Exception.Message }
        throw
    }
}

Write-Output "==============================================="
Write-Output " Busking Antigravity one-click smoke runner "
Write-Output "==============================================="

try {
    Write-Output "[1/17] Checking API server reachability..."
    $health = Invoke-WebRequest -Uri 'http://localhost:3000/api/performances' -Method Get
    if ($health.StatusCode -ne 200) {
        throw "Unexpected API status code: $($health.StatusCode)"
    }
    $summary.checks += [ordered]@{ name = 'server-reachable'; pass = $true; statusCode = $health.StatusCode }

    Write-Output "[2/17] Running API smoke..."
    Invoke-Step -Name 'api-smoke' -Command 'node ./test-suite/api-tester.js'

    Write-Output "[3/17] Running realtime chat smoke..."
    Invoke-Step -Name 'chat-smoke' -Command 'node ./test-suite/chat-tester.js'

    Write-Output "[4/17] Security foundation: anonymous read allowed"
    Invoke-Step -Name 'security-foundation-anon-read' -Command 'node ./test-suite/security/foundation.test.js --case anonymous-read-allowed --out ./test-suite/results/security-foundation-anon-read.json'

    Write-Output "[5/17] Security foundation: anonymous write rejected"
    Invoke-Step -Name 'security-foundation-anon-write' -Command 'node ./test-suite/security/foundation.test.js --case anonymous-write-rejected --out ./test-suite/results/security-foundation-anon-write.json'

    Write-Output "[6/17] Security foundation: cross-owner write forbidden"
    Invoke-Step -Name 'security-foundation-cross-owner' -Command 'node ./test-suite/security/foundation.test.js --case cross-owner-write-forbidden --out ./test-suite/results/security-foundation-cross-owner.json'

    Write-Output "[7/17] Security mutating: follow derives identity"
    Invoke-Step -Name 'mutating-follow' -Command 'node ./test-suite/security/mutating-writes.test.js --case follow-route-derives-identity --out ./test-suite/results/mutating-follow.json'

    Write-Output "[8/17] Security mutating: owner performance update"
    Invoke-Step -Name 'mutating-owner-performance' -Command 'node ./test-suite/security/mutating-writes.test.js --case owner-performance-update-succeeds --out ./test-suite/results/mutating-owner-performance.json'

    Write-Output "[9/17] Security mutating: unauthenticated writes"
    Invoke-Step -Name 'mutating-unauthenticated' -Command 'node ./test-suite/security/mutating-writes.test.js --case unauthenticated-write-returns-401 --out ./test-suite/results/mutating-unauthenticated.json'

    Write-Output "[10/17] Security mutating: cross-owner writes"
    Invoke-Step -Name 'mutating-cross-owner' -Command 'node ./test-suite/security/mutating-writes.test.js --case foreign-performance-update-returns-403 --out ./test-suite/results/mutating-cross-owner.json'

    Write-Output "[11/17] Lifecycle foundation checks"
    Invoke-Step -Name 'lifecycle-foundation' -Command 'node ./test-suite/lifecycle/foundation.test.js --case no-get-writes-contract --out ./test-suite/results/lifecycle-foundation.json'

    Write-Output "[12/17] Lifecycle read-only: performances route"
    Invoke-Step -Name 'lifecycle-performances-no-write' -Command 'node ./test-suite/lifecycle/read-only.test.js --case get-performances-no-db-write --out ./test-suite/results/lifecycle-performances-no-write.json'

    Write-Output "[13/17] Lifecycle read-only: singer route"
    Invoke-Step -Name 'lifecycle-singer-no-write' -Command 'node ./test-suite/lifecycle/read-only.test.js --case get-singer-no-db-write --out ./test-suite/results/lifecycle-singer-no-write.json'

    Write-Output "[14/17] Lifecycle consistency checks"
    Invoke-Step -Name 'lifecycle-consistency' -Command 'node ./test-suite/lifecycle/read-only.test.js --case stale-scheduled-exposed-consistently --out ./test-suite/results/lifecycle-consistency.json'

    Write-Output "[15/17] Lifecycle canceled normalization"
    Invoke-Step -Name 'lifecycle-canceled-normalized' -Command 'node ./test-suite/lifecycle/read-only.test.js --case canceled-status-normalized --out ./test-suite/results/lifecycle-canceled-normalized.json'

    Write-Output "[16/17] Realtime authority regression checks"
    Invoke-Step -Name 'realtime-audience-open-chat' -Command 'node ./test-suite/realtime/authority.test.js --case audience-open-chat-denied --out ./test-suite/results/realtime-audience-open-chat.json'
    Invoke-Step -Name 'realtime-audience-end' -Command 'node ./test-suite/realtime/authority.test.js --case audience-end-performance-denied --out ./test-suite/results/realtime-audience-end.json'
    Invoke-Step -Name 'realtime-forged-alert' -Command 'node ./test-suite/realtime/authority.test.js --case forged-system-alert-rejected --out ./test-suite/results/realtime-forged-alert.json'
    Invoke-Step -Name 'realtime-owner-open-chat' -Command 'node ./test-suite/realtime/authority.test.js --case owner-open-chat-allowed --out ./test-suite/results/realtime-owner-open-chat.json'
    Invoke-Step -Name 'realtime-owner-end' -Command 'node ./test-suite/realtime/authority.test.js --case owner-end-performance-allowed --out ./test-suite/results/realtime-owner-end.json'

    Write-Summary -Pass $true
    Write-Output "[17/17] Summary written: $summaryPath"
    Write-Output "All smoke checks passed."
} catch {
    Write-Summary -Pass $false
    Write-Output "Smoke runner failed: $($_.Exception.Message)"
    Write-Output "Summary written: $summaryPath"
    exit 1
}
