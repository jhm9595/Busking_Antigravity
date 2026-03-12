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
    openChatGuarded: /socket\.on\('open_chat',[\s\S]*?authorizeOwnerControl\(/.test(source),
    toggleGuarded: /socket\.on\('chat_status_toggled',[\s\S]*?authorizeOwnerControl\(/.test(source)
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
      unauthorizedToggleRejected: false,
      audienceWriteBlockedWhenClosed: false,
      sourceGuards: {
        openChatGuarded: false,
        toggleGuarded: false
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
    ensure(sourceChecks.openChatGuarded && sourceChecks.toggleGuarded, 'realtime server source must guard privileged events with authorizeOwnerControl', { sourceChecks })

    await onceEvent(socket, 'connect', 5000)
    result.checks.connected = true
    console.log('[pass] socket connected')

    const chatStatusPromise = onceEvent(socket, 'chat_status', 5000)
    const historyPromise = onceEvent(socket, 'load_history', 5000)

    socket.emit('join_room', {
      performanceId: testPerformanceId,
      username: 'AutomatedAudience'
    })

    const chatStatus = await chatStatusPromise
    const history = await historyPromise

    ensure(chatStatus && typeof chatStatus.status === 'string', 'join_room must emit chat_status with { status }', { chatStatus })
    ensure(Array.isArray(history), 'join_room must emit load_history array', { history })
    ensure(chatStatus.status === 'closed', 'newly joined anonymous room must start with closed chat status', { chatStatus })
    result.checks.joined = true
    console.log('[pass] join_room receives chat_status and load_history')

    const controlEvents = {
      authErrors: [],
      chatStatusOpenSignals: 0,
      chatStatusToggleSignals: 0,
      chatStatusEvents: [],
      chatStatusToggledEvents: []
    }

    const onAuthorizationError = (payload) => {
      controlEvents.authErrors.push(payload)
    }
    const onChatStatus = (payload) => {
      controlEvents.chatStatusEvents.push(payload)
      if (payload && payload.status === 'open') {
        controlEvents.chatStatusOpenSignals += 1
      }
    }
    const onChatStatusToggled = (payload) => {
      controlEvents.chatStatusToggledEvents.push(payload)
      if (payload && payload.enabled === true) {
        controlEvents.chatStatusToggleSignals += 1
      }
    }

    socket.on('authorization_error', onAuthorizationError)
    socket.on('chat_status', onChatStatus)
    socket.on('chat_status_toggled', onChatStatusToggled)

    socket.emit('open_chat', { performanceId: testPerformanceId })
    await sleep(750)

    const openChatAuthError = controlEvents.authErrors.some((entry) => entry && entry.event === 'open_chat')
    const openChatNoPrivilegeSignals = controlEvents.chatStatusOpenSignals === 0 && controlEvents.chatStatusToggleSignals === 0
    ensure(openChatAuthError || openChatNoPrivilegeSignals, 'open_chat must be runtime-denied for anonymous audience', {
      controlEvents
    })
    ensure(openChatNoPrivilegeSignals, 'open_chat denial must not emit privileged open signals for anonymous audience', { controlEvents })
    result.checks.unauthorizedOpenChatRejected = true
    console.log('[pass] open_chat rejects anonymous audience control')

    socket.emit('chat_status_toggled', { performanceId: testPerformanceId, enabled: true })
    await sleep(750)

    const beforeProbeCount = receivedMessages.length
    socket.emit('send_message', {
      performanceId: testPerformanceId,
      message: 'anonymous-control-denial-probe',
      timestamp: new Date().toISOString()
    })
    await sleep(750)
    const afterProbeCount = receivedMessages.length
    const controlProbeWriteBlocked = beforeProbeCount === afterProbeCount

    const toggleAuthError = controlEvents.authErrors.some((entry) => entry && entry.event === 'chat_status_toggled')
    const toggleNoPrivilegeSignals = controlEvents.chatStatusToggleSignals === 0 && controlEvents.chatStatusOpenSignals === 0
    ensure(toggleAuthError || toggleNoPrivilegeSignals, 'chat_status_toggled must be runtime-denied for anonymous audience', {
      controlEvents
    })
    ensure(toggleNoPrivilegeSignals, 'chat_status_toggled denial must not emit enabled=true for anonymous audience', { controlEvents })
    ensure(controlProbeWriteBlocked, 'anonymous control attempts must not open chat for audience writes', {
      beforeProbeCount,
      afterProbeCount,
      controlEvents
    })
    result.checks.unauthorizedToggleRejected = true
    console.log('[pass] chat_status_toggled rejects anonymous audience control')

    socket.off('authorization_error', onAuthorizationError)
    socket.off('chat_status', onChatStatus)
    socket.off('chat_status_toggled', onChatStatusToggled)

    const closedRoomId = `smoke-closed-${Date.now()}`
    const closedStatusPromise = onceEvent(socket, 'chat_status', 5000)
    const closedHistoryPromise = onceEvent(socket, 'load_history', 5000)
    socket.emit('join_room', {
      performanceId: closedRoomId,
      username: 'AutomatedAudience'
    })
    await closedStatusPromise
    await closedHistoryPromise

    const beforeCount = receivedMessages.length
    socket.emit('send_message', {
      performanceId: closedRoomId,
      message: 'should-not-broadcast-when-closed',
      timestamp: new Date().toISOString()
    })

    await sleep(750)
    const afterCount = receivedMessages.length

    ensure(beforeCount === afterCount, 'Audience message must be blocked while chat is closed', {
      beforeCount,
      afterCount
    })

    result.checks.audienceWriteBlockedWhenClosed = true
    result.pass = true
    result.finishedAt = new Date().toISOString()
    writeResult(result)

    console.log('[pass] audience send_message blocked when chat is closed')
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
