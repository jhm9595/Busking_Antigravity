const fs = require('node:fs')
const path = require('node:path')

const API_BASE = 'http://localhost:3000/api'
const RESULTS_PATH = path.resolve(process.cwd(), 'test-suite/results/api-smoke.json')

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
  } catch (error) {
    throw new Error(`Invalid JSON from ${endpointName}: ${error.message}`)
  }
}

function writeResult(payload) {
  fs.mkdirSync(path.dirname(RESULTS_PATH), { recursive: true })
  fs.writeFileSync(RESULTS_PATH, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')
}

async function fetchPerformances(filter, fanId) {
  const params = new URLSearchParams()
  if (filter) params.set('filter', filter)
  if (fanId) params.set('fanId', fanId)
  const suffix = params.toString() ? `?${params.toString()}` : ''
  const response = await fetch(`${API_BASE}/performances${suffix}`)
  const body = await parseJsonResponse(response, `/performances${suffix}`)
  return { response, body }
}

async function testPublicPerformances() {
  const { response, body } = await fetchPerformances()
  ensure(response.ok, 'GET /api/performances failed', { status: response.status, body })
  ensure(Array.isArray(body), 'GET /api/performances must return an array payload', { bodyType: typeof body })
  
  if (body.length > 0) {
    const sample = body[0]
    ensure(sample && typeof sample === 'object', 'GET /api/performances returned invalid item', { sample })
    ensure(typeof sample.id === 'string', 'Performance must have string id', { sample })
    ensure(['live', 'scheduled'].includes(sample.status), 'Only live/scheduled should appear', { status: sample.status })
  }
  
  return {
    count: body.length,
    samplePerformanceId: body[0]?.id || null,
    sampleSingerId: body[0]?.singerId || null
  }
}

async function testPerformanceFilters() {
  const checks = []
  
  for (const filter of ['live', 'scheduled', 'followed']) {
    const { response, body } = await fetchPerformances(filter)
    ensure(response.ok, `GET /api/performances?filter=${filter} failed`, { status: response.status, body })
    ensure(Array.isArray(body), `Filter '${filter}' must return an array`, { bodyType: typeof body })
    checks.push({ filter, count: body.length })
  }
  
  return checks
}

async function testSingerProfile() {
  const { body: performances } = await fetchPerformances()
  ensure(Array.isArray(performances), 'GET /api/performances must return an array for singer profile lookup')
  
  if (!performances.length) {
    return {
      skipped: true,
      reason: 'no visible performances'
    }
  }
  
  const singerId = performances[0].singerId
  const response = await fetch(`${API_BASE}/singers/${encodeURIComponent(singerId)}`)
  const body = await parseJsonResponse(response, `/singers/${singerId}`)
  
  ensure(response.ok, `GET /api/singers/${singerId} failed`, { status: response.status, body })
  ensure(body && body.id === singerId, 'Singer response ID mismatch', { expected: singerId, received: body && body.id })
  ensure(body.stageName !== undefined, 'Singer must have stageName', { body })
  
  return {
    singerId,
    stageName: body.stageName || null,
    hasPerformances: body.performances !== undefined
  }
}

async function testAnonymousSongRequestIsRejected() {
  const { body: performances } = await fetchPerformances()
  ensure(Array.isArray(performances), 'GET /api/performances must return an array before POST /song-requests test')
  
  if (!performances.length) {
    return {
      skipped: true,
      reason: 'no visible performances'
    }
  }
  
  const performanceId = performances[0].id
  const response = await fetch(`${API_BASE}/song-requests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      performanceId,
      title: `api-smoke-${Date.now()}`,
      artist: 'Smoke Artist'
    })
  })
  
  const body = await parseJsonResponse(response, '/song-requests')
  ensure(response.status === 401, 'Anonymous POST /api/song-requests must return 401', { status: response.status, body })
  
  return {
    performanceId,
    status: response.status,
    error: body && body.error ? body.error : null
  }
}

async function testAnonymousBookingIsRejected() {
  const { body: performances } = await fetchPerformances()
  
  if (!performances.length) {
    return {
      skipped: true,
      reason: 'no visible performances'
    }
  }
  
  const performanceId = performances[0].id
  const response = await fetch(`${API_BASE}/booking`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      performanceId,
      message: 'Test booking request'
    })
  })
  
  const body = await parseJsonResponse(response, '/booking')
  ensure(response.status === 401, 'Anonymous POST /api/booking must return 401', { status: response.status, body })
  
  return {
    performanceId,
    status: response.status
  }
}

async function runTests() {
  const startedAt = new Date().toISOString()
  const suite = {
    suite: 'api-smoke',
    pass: false,
    startedAt,
    finishedAt: null,
    checks: {}
  }
  
  try {
    console.log('--- Busking Antigravity API smoke start ---')
    
    suite.checks.publicPerformances = await testPublicPerformances()
    console.log(`[pass] GET /api/performances returns array contract (${suite.checks.publicPerformances.count} rows)`)
    
    suite.checks.performanceFilters = await testPerformanceFilters()
    console.log('[pass] GET /api/performances filter contract is valid')
    
    suite.checks.singerProfile = await testSingerProfile()
    console.log('[pass] GET /api/singers/:id returns current response shape')
    
    suite.checks.anonymousSongRequest = await testAnonymousSongRequestIsRejected()
    console.log('[pass] Anonymous POST /api/song-requests is blocked with 401')
    
    suite.checks.anonymousBooking = await testAnonymousBookingIsRejected()
    console.log('[pass] Anonymous POST /api/booking is blocked with 401')
    
    suite.pass = true
    suite.finishedAt = new Date().toISOString()
    writeResult(suite)
    console.log(`API smoke result written to ${path.relative(process.cwd(), RESULTS_PATH)}`)
    console.log('--- API smoke completed ---')
  } catch (error) {
    suite.pass = false
    suite.finishedAt = new Date().toISOString()
    suite.error = {
      message: error.message,
      details: error.details || null
    }
    writeResult(suite)
    console.error('--- API smoke failed ---')
    console.error(error.message)
    process.exit(1)
  }
}

runTests()
