#!/bin/bash

set -euo pipefail

SUMMARY_PATH="test-suite/results/one-click-smoke-summary.json"
TMP_STEPS="$(mktemp)"

cleanup() {
  rm -f "$TMP_STEPS"
}
trap cleanup EXIT

record_step() {
  local name="$1"
  local pass="$2"
  local error_message="${3:-}"

  if [[ -n "$error_message" ]]; then
    printf '{"name":"%s","pass":%s,"error":%s}\n' "$name" "$pass" "$(node -e "console.log(JSON.stringify(process.argv[1]))" "$error_message")" >> "$TMP_STEPS"
  else
    printf '{"name":"%s","pass":%s}\n' "$name" "$pass" >> "$TMP_STEPS"
  fi
}

run_step() {
  local label="$1"
  local cmd="$2"

  echo "--> $label"
  if bash -lc "$cmd"; then
    record_step "$label" true
    echo "[pass] $label"
  else
    local exit_code=$?
    record_step "$label" false "exit code $exit_code"
    return $exit_code
  fi
}

write_summary() {
  local pass="$1"
  local started_at="$2"
  local finished_at
  finished_at="$(node -e 'console.log(new Date().toISOString())')"

  node -e '
const fs = require("node:fs")
const path = require("node:path")
const [summaryPath, passArg, startedAt, finishedAt, stepsPath] = process.argv.slice(1)
const lines = fs.readFileSync(stepsPath, "utf8").split("\n").filter(Boolean)
const checks = lines.map((line) => JSON.parse(line))
const payload = {
  suite: "one-click-smoke",
  pass: passArg === "true",
  startedAt,
  finishedAt,
  checks
}
fs.mkdirSync(path.dirname(summaryPath), { recursive: true })
fs.writeFileSync(summaryPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8")
' "$SUMMARY_PATH" "$pass" "$started_at" "$finished_at" "$TMP_STEPS"
}

STARTED_AT="$(node -e 'console.log(new Date().toISOString())')"

echo "==============================================="
echo " Busking Antigravity one-click smoke runner "
echo "==============================================="

if ! curl -sS -o /dev/null -w "%{http_code}" "http://localhost:3000/api/performances" | grep -q '^200$'; then
  record_step "server-reachable" false "GET /api/performances not reachable"
  write_summary false "$STARTED_AT"
  echo "Smoke runner failed: API server is not reachable"
  echo "Summary written: $SUMMARY_PATH"
  exit 1
fi
record_step "server-reachable" true

run_step "api-smoke" "node ./test-suite/api-tester.js"
run_step "chat-smoke" "node ./test-suite/chat-tester.js"

run_step "security-foundation-anon-read" "node ./test-suite/security/foundation.test.js --case anonymous-read-allowed --out ./test-suite/results/security-foundation-anon-read.json"
run_step "security-foundation-anon-write" "node ./test-suite/security/foundation.test.js --case anonymous-write-rejected --out ./test-suite/results/security-foundation-anon-write.json"
run_step "security-foundation-cross-owner" "node ./test-suite/security/foundation.test.js --case cross-owner-write-forbidden --out ./test-suite/results/security-foundation-cross-owner.json"

run_step "mutating-follow" "node ./test-suite/security/mutating-writes.test.js --case follow-route-derives-identity --out ./test-suite/results/mutating-follow.json"
run_step "mutating-owner-performance" "node ./test-suite/security/mutating-writes.test.js --case owner-performance-update-succeeds --out ./test-suite/results/mutating-owner-performance.json"
run_step "mutating-unauthenticated" "node ./test-suite/security/mutating-writes.test.js --case unauthenticated-write-returns-401 --out ./test-suite/results/mutating-unauthenticated.json"
run_step "mutating-cross-owner" "node ./test-suite/security/mutating-writes.test.js --case foreign-performance-update-returns-403 --out ./test-suite/results/mutating-cross-owner.json"

run_step "lifecycle-foundation" "node ./test-suite/lifecycle/foundation.test.js --case no-get-writes-contract --out ./test-suite/results/lifecycle-foundation.json"
run_step "lifecycle-performances-no-write" "node ./test-suite/lifecycle/read-only.test.js --case get-performances-no-db-write --out ./test-suite/results/lifecycle-performances-no-write.json"
run_step "lifecycle-singer-no-write" "node ./test-suite/lifecycle/read-only.test.js --case get-singer-no-db-write --out ./test-suite/results/lifecycle-singer-no-write.json"
run_step "lifecycle-consistency" "node ./test-suite/lifecycle/read-only.test.js --case stale-scheduled-exposed-consistently --out ./test-suite/results/lifecycle-consistency.json"
run_step "lifecycle-canceled-normalized" "node ./test-suite/lifecycle/read-only.test.js --case canceled-status-normalized --out ./test-suite/results/lifecycle-canceled-normalized.json"

run_step "realtime-audience-open-chat" "node ./test-suite/realtime/authority.test.js --case audience-open-chat-denied --out ./test-suite/results/realtime-audience-open-chat.json"
run_step "realtime-audience-end" "node ./test-suite/realtime/authority.test.js --case audience-end-performance-denied --out ./test-suite/results/realtime-audience-end.json"
run_step "realtime-forged-alert" "node ./test-suite/realtime/authority.test.js --case forged-system-alert-rejected --out ./test-suite/results/realtime-forged-alert.json"
run_step "realtime-owner-open-chat" "node ./test-suite/realtime/authority.test.js --case owner-open-chat-allowed --out ./test-suite/results/realtime-owner-open-chat.json"
run_step "realtime-owner-end" "node ./test-suite/realtime/authority.test.js --case owner-end-performance-allowed --out ./test-suite/results/realtime-owner-end.json"

write_summary true "$STARTED_AT"
echo "Summary written: $SUMMARY_PATH"
echo "All smoke checks passed."
