const fs = require('node:fs')
const path = require('node:path')
const { io } = require('socket.io-client')

const CHAT_URL = 'http://localhost:4000'
const RESULTS_PATH = path.resolve(process.cwd(), 'test-suite/results/chat-smoke.json')

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function ensure(condition, message, details) {
  if (!condition) {
    const error = new Error(message)
    if (details !== undefined) {
      error.details = details
    }
    throw error
  }
}

function writeResult(payload) {
  fs.mkdirSync(path.dirname(RESULTS_PATH), { recursive: true })
  fs.writeFileSync(RESULTS_PATH, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')
}

function readServerSourceChecks() {
  const sourcePath = path.resolve(process.cwd(), 'realtime-server/server.js')
  const source = fs.readFileSync(sourcePath, 'utf8')
  
  return {
    openChatGuarded: /socket\.on\('open_chat'[\s\S]*?authorizeSingerControl\(/.test(source),
    systemAlertGuarded: /socket\.on\('system_alert'[\s\S]*?authorizeSingerControl\(/.test(source),
    performanceEndGuarded: /socket\.on\('performance_ended'[\s\S]*?authorizeSingerControl\(/.test(source),
    chatToggleGuarded: /socket\.on\('chat_status_toggled'[\s\S]*?authorizeSingerControl\(/.test(source)
  }
}

function onceEvent(socket, eventName, timeoutMs) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      socket.off(eventName, onEvent)
      reject(new Error(`Timed out waiting for '${eventName}'`))
    }, timeoutMs)
    
    function onEvent(payload) {
      clearTimeout(timeout)
      resolve(payload)
    }
    
    socket.once(eventName, onEvent)
  })
}

async function startChatTest() {
  const testPerformanceId = `smoke-${Date.now()}`
  const result = {
    suite: 'chat-smoke',
    pass: false,
    startedAt: new Date().toISOString(),
    finishedAt: null,
    checks: {
      connected: false,
      joined: false,
      unauthorizedOpenChatRejected: false,
      unauthorizedSystemAlertRejected: false,
      unauthorizedPerformanceEndRejected: false,
      unauthorizedToggleRejected: false,
      audienceWriteBlockedWhenClosed: false,
      sourceGuards: {
        openChatGuarded: false,
        systemAlertGuarded: false,
        performanceEndGuarded: false,
        chatToggleGuarded: false
      }
    }
  }
  
  const socket = io(CHAT_URL, {
    transports: ['websocket', 'polling'],
    reconnection: false,
    timeout: 5000
  })
  
  const receivedMessages = []
  socket.on('receive_message', (payload) => {
    receivedMessages.push(payload)
  })
  
  try {
    console.log('--- Busking Antigravity chat smoke start ---')
    
    const sourceChecks = readServerSourceChecks()
    result.checks.sourceGuards = sourceChecks
    ensure(
      sourceChecks.openChatGuarded && sourceChecks.systemAlertGuarded && 
      sourceChecks.performanceEndGuarded && sourceChecks.chatToggleGuarded,
      'realtime server source must guard all privileged events with authorizeSingerControl',
      { sourceChecks }
    )
    
    await onceEvent(socket, 'connect', 5000)
    result.checks.connected = true
    console.log('[pass] socket connected')
    
    const chatStatusPromise = onceEvent(socket, 'chat_status', 5000)
    const historyPromise = onceEvent(socket, 'load_history', 5000)
    
    socket.emit('join_room', {
      performanceId: testPerformanceId,
      username: 'AutomatedAudience',
      userType: 'audience'
    })
    
    const chatStatus = await chatStatusPromise
    const history = await historyPromise
    
    ensure(chatStatus && typeof chatStatus.status === 'string', 'join_room must emit chat_status with { status }', { chatStatus })
    ensure(Array.isArray(history), 'join_room must emit load_history array', { history })
    ensure(chatStatus.status === 'closed', 'newly joined anonymous room must start with closed chat status', { chatStatus })
    result.checks.joined = true
    console.log('[pass] join_room receives chat_status and load_history')
    
    // Test 1: Unauthorized open_chat must be rejected
    socket.emit('open_chat', { performanceId: testPerformanceId })
    await sleep(750)
    const openChatRejected = !receivedMessages.some(m => m.type === 'system' && m.message?.includes('열렸습니다'))
    result.checks.unauthorizedOpenChatRejected = openChatRejected
    ensure(openChatRejected, 'open_chat must be denied for audience', { receivedMessages })
    console.log('[pass] open_chat rejects audience control')
    
    // Test 2: Unauthorized system_alert must be rejected
    socket.emit('system_alert', { performanceId: testPerformanceId, message: 'Unauthorized alert' })
    await sleep(750)
    const systemAlertRejected = !receivedMessages.some(m => m.isAlert === true && m.message === 'Unauthorized alert')
    result.checks.unauthorizedSystemAlertRejected = systemAlertRejected
    ensure(systemAlertRejected, 'system_alert must be denied for audience', { receivedMessages })
    console.log('[pass] system_alert rejects audience control')
    
    // Test 3: Unauthorized performance_ended must be rejected
    socket.emit('performance_ended', { performanceId: testPerformanceId })
    await sleep(750)
    const performanceEndRejected = !receivedMessages.some(m => m.type === 'system' && m.message?.includes('종료'))
    result.checks.unauthorizedPerformanceEndRejected = performanceEndRejected
    ensure(performanceEndRejected, 'performance_ended must be denied for audience', { receivedMessages })
    console.log('[pass] performance_ended rejects audience control')
    
    // Test 4: Unauthorized chat_status_toggled must be rejected
    socket.emit('chat_status_toggled', { performanceId: testPerformanceId, enabled: true })
    await sleep(750)
    const toggleRejected = !receivedMessages.some(m => m.type === 'system' && m.message?.includes('열었습니다'))
    result.checks.unauthorizedToggleRejected = toggleRejected
    ensure(toggleRejected, 'chat_status_toggled must be denied for audience', { receivedMessages })
    console.log('[pass] chat_status_toggled rejects audience control')
    
    // Test 5: Audience message blocked when chat is closed
    const beforeProbeCount = receivedMessages.length
    socket.emit('send_message', {
      performanceId: testPerformanceId,
      message: 'should-not-broadcast-when-closed',
      timestamp: new Date().toISOString()
    })
    await sleep(750)
    const afterProbeCount = receivedMessages.length
    const audienceWriteBlocked = beforeProbeCount === afterProbeCount
    result.checks.audienceWriteBlockedWhenClosed = audienceWriteBlocked
    ensure(audienceWriteBlocked, 'audience send_message must be blocked when chat is closed', {
      beforeProbeCount,
      afterProbeCount
    })
    console.log('[pass] audience send_message blocked when chat is closed')
    
    result.pass = true
    result.finishedAt = new Date().toISOString()
    writeResult(result)
    console.log(`Chat smoke result written to ${path.relative(process.cwd(), RESULTS_PATH)}`)
    console.log('--- Chat smoke completed ---')
  } catch (error) {
    result.pass = false
    result.finishedAt = new Date().toISOString()
    result.error = {
      message: error.message,
      details: error.details || null
    }
    writeResult(result)
    console.error('--- Chat smoke failed ---')
    console.error(error.message)
    process.exitCode = 1
  } finally {
    socket.disconnect()
  }
  
  if (!result.pass) {
    process.exit(1)
  }
}

startChatTest()
