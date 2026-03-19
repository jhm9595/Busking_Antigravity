const fs = require('node:fs')
const path = require('node:path')

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
const API_BASE = `${APP_URL}/api`
const RESULTS_PATH = path.resolve(process.cwd(), 'test-suite/results/demo-api-smoke.json')

function ensure(condition, message, details) {
  if (!condition) {
    const error = new Error(message)
    if (details !== undefined) {
      error.details = details
    }
    throw error
  }
}

async function parseJsonResponse(response, endpointName) {
  const text = await response.text()

  try {
    return text ? JSON.parse(text) : null
  } catch {
    return {
      __nonJson: true,
      endpointName,
      preview: text.slice(0, 200)
    }
  }
}

function writeResult(payload) {
  fs.mkdirSync(path.dirname(RESULTS_PATH), { recursive: true })
  fs.writeFileSync(RESULTS_PATH, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')
}

function isKstTimestamp(value) {
  return typeof value === 'string' && /(?:\+09:00|KST)$/.test(value)
}

async function testCreateDemoSession() {
  // TODO(task-2): Implement POST /api/demo to provision deterministic demo fixtures.
  const response = await fetch(`${API_BASE}/demo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode: 'anonymous-smoke' })
  })
  const body = await parseJsonResponse(response, '/demo')

  ensure(response.status === 200, 'POST /api/demo must return 200', { status: response.status, body })
  ensure(body && typeof body === 'object', 'POST /api/demo must return an object', { body })
  ensure(typeof body.singerId === 'string' && body.singerId.length > 0, 'Demo metadata must include singerId', { body })
  ensure(Array.isArray(body.performanceIds) && body.performanceIds.length === 3, 'Demo metadata must include exactly 3 performanceIds', { body })
  ensure(typeof body.generatedAt === 'string', 'Demo metadata must include generatedAt', { body })
  ensure(isKstTimestamp(body.generatedAt), 'Demo generatedAt must be formatted in KST', { generatedAt: body.generatedAt })

  return body
}

async function testAnonymousDemoPerformances(demoMeta) {
  // TODO(task-2): Anonymous GET /api/performances should include the generated demo set.
  const response = await fetch(`${API_BASE}/performances`)
  const body = await parseJsonResponse(response, '/performances')

  ensure(response.ok, 'GET /api/performances failed after POST /api/demo', { status: response.status, body })
  ensure(Array.isArray(body), 'GET /api/performances must return an array', { bodyType: typeof body })

  const demoRows = body.filter((item) => item && item.singerId === demoMeta.singerId)
  ensure(demoRows.length === 3, 'Anonymous /api/performances must expose exactly 3 demo performances', {
    singerId: demoMeta.singerId,
    count: demoRows.length,
    ids: demoRows.map((item) => item.id)
  })

  const liveCount = demoRows.filter((item) => item.status === 'live').length
  const scheduledCount = demoRows.filter((item) => item.status === 'scheduled').length
  ensure(liveCount === 1, 'Demo performances must contain exactly 1 live row', { liveCount, statuses: demoRows.map((item) => item.status) })
  ensure(scheduledCount === 2, 'Demo performances must contain exactly 2 scheduled rows', { scheduledCount, statuses: demoRows.map((item) => item.status) })

  const missingIds = demoMeta.performanceIds.filter((id) => !demoRows.some((row) => row.id === id))
  ensure(missingIds.length === 0, 'All demo performanceIds must be visible in /api/performances', { missingIds, expected: demoMeta.performanceIds })

  const invalidKstTime = demoRows.find((item) => !isKstTimestamp(item.startTime))
  ensure(!invalidKstTime, 'Demo performances must expose startTime in KST format', { invalidKstTime })

  return {
    count: demoRows.length,
    liveCount,
    scheduledCount
  }
}

async function testDemoSingerContract(demoMeta) {
  // TODO(task-2): Create deterministic demo singer profile fields used by Explore cards.
  const endpoint = `/singers/${encodeURIComponent(demoMeta.singerId)}`
  const response = await fetch(`${API_BASE}${endpoint}`)
  const body = await parseJsonResponse(response, endpoint)

  ensure(response.ok, 'GET /api/singers/:id failed for demo singer', { status: response.status, body })
  ensure(body && body.id === demoMeta.singerId, 'Demo singer response ID mismatch', { expected: demoMeta.singerId, body })
  ensure(typeof body.stageName === 'string' && body.stageName.length > 0, 'Demo singer must expose stageName', { body })
  // Singer API may or may not include profile - check for essential fields
  ensure(typeof body.bio === 'string' || typeof body.isVerified === 'boolean', 'Demo singer must expose singer metadata', { body })
  ensure(Array.isArray(body.performances) && body.performances.length === 3, 'Demo singer must expose exactly 3 performances', { body })

  return {
    singerId: body.id,
    stageName: body.stageName,
    performanceCount: body.performances.length
  }
}

async function runTests() {
  const startedAt = new Date().toISOString()
  const suite = {
    suite: 'demo-api-smoke',
    pass: false,
    startedAt,
    finishedAt: null,
    checks: {}
  }

  try {
    console.log('--- Demo API smoke start ---')

    const demoMeta = await testCreateDemoSession()
    suite.checks.demoSession = {
      singerId: demoMeta.singerId,
      performanceIds: demoMeta.performanceIds,
      generatedAt: demoMeta.generatedAt
    }
    console.log('[pass] POST /api/demo returns demo metadata')

    suite.checks.demoPerformances = await testAnonymousDemoPerformances(demoMeta)
    console.log('[pass] Anonymous /api/performances returns 1 live + 2 scheduled demo rows')

    suite.checks.demoSinger = await testDemoSingerContract(demoMeta)
    console.log('[pass] GET /api/singers/:id returns demo singer contract')

    suite.pass = true
    suite.finishedAt = new Date().toISOString()
    writeResult(suite)
    console.log(`Demo API smoke result written to ${path.relative(process.cwd(), RESULTS_PATH)}`)
    console.log('--- Demo API smoke completed ---')
  } catch (error) {
    suite.pass = false
    suite.finishedAt = new Date().toISOString()
    suite.error = {
      message: error.message,
      details: error.details || null
    }
    writeResult(suite)
    console.error('--- Demo API smoke failed ---')
    console.error(error.message)
    if (error.details) {
      console.error(JSON.stringify(error.details, null, 2))
    }
    process.exit(1)
  }
}

runTests()
