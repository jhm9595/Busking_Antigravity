// @ts-nocheck
import { expect, test } from '@playwright/test'
import { io } from 'socket.io-client'

const realtimeToken = require('../src/lib/realtime-control-token.js') as {
  createRealtimeControlToken: (payload: {
    userId: string
    performanceId: string
    role?: 'owner'
    capacity?: number
  }) => string | null
  verifyRealtimeControlToken: (token: string, expectedPerformanceId?: string) => {
    valid: boolean
    payload: { sub: string; performanceId: string; role: string } | null
  }
}

const { createRealtimeControlToken, verifyRealtimeControlToken } = realtimeToken

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function onceEvent(socket: any, eventName: string, timeoutMs: number) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      socket.off(eventName, onEvent)
      reject(new Error(`Timed out waiting for '${eventName}'`))
    }, timeoutMs)

    function onEvent(payload: unknown) {
      clearTimeout(timeout)
      resolve(payload)
    }

    socket.once(eventName, onEvent)
  })
}

async function connectSocket(realtimeOrigin: string) {
  const socket = io(realtimeOrigin, {
    transports: ['websocket', 'polling'],
    reconnection: false,
    timeout: 5000
  })

  await onceEvent(socket, 'connect', 5000)
  return socket
}

test('smoke: runtime singer controls require owner token and anonymous path stays read-only', async ({ request }) => {
  const appOrigin = process.env.SMOKE_APP_ORIGIN || 'http://localhost:3000'
  const realtimeOrigin = process.env.SMOKE_REALTIME_ORIGIN || 'http://localhost:4000'

  const performancesRes = await request.get(`${appOrigin}/api/performances`)
  expect(performancesRes.ok()).toBeTruthy()
  const performances = await performancesRes.json()
  expect(Array.isArray(performances)).toBeTruthy()

  const performanceId = performances[0]?.id || `playwright-smoke-${Date.now()}`

  const anonymousWriteRes = await request.post(`${appOrigin}/api/song-requests`, {
    data: {
      performanceId,
      title: `playwright-smoke-${Date.now()}`,
      artist: 'Smoke Artist'
    }
  })

  if (performances.length > 0) {
    expect(anonymousWriteRes.status()).toBe(401)
  } else {
    expect([401, 404]).toContain(anonymousWriteRes.status())
  }

  const ownerToken = createRealtimeControlToken({
    userId: 'playwright-owner',
    performanceId,
    role: 'owner'
  })
  expect(ownerToken).not.toBeNull()

  const verified = verifyRealtimeControlToken(ownerToken, performanceId)
  expect(verified.valid).toBeTruthy()
  expect(verified.payload?.role).toBe('owner')
  expect(verified.payload?.performanceId).toBe(performanceId)

  const anonymousSocket = await connectSocket(realtimeOrigin)

  try {
    const joinStatusPromise = onceEvent(anonymousSocket, 'chat_status', 5000)
    const joinHistoryPromise = onceEvent(anonymousSocket, 'load_history', 5000)

    anonymousSocket.emit('join_room', {
      performanceId,
      username: 'PlaywrightAudience'
    })

    const joinStatus = await joinStatusPromise
    const joinHistory = await joinHistoryPromise
    expect(typeof joinStatus?.status).toBe('string')
    expect(Array.isArray(joinHistory)).toBeTruthy()

    const controlEvents = {
      authErrors: [],
      openStatusSignals: 0,
      toggleSignals: 0,
      endedSignals: 0
    }

    const onAuthorizationError = (payload: unknown) => {
      controlEvents.authErrors.push(payload)
    }
    const onChatStatus = (payload: any) => {
      if (payload && payload.status === 'open') {
        controlEvents.openStatusSignals += 1
      }
    }
    const onChatStatusToggled = (payload: any) => {
      if (payload && payload.enabled === true) {
        controlEvents.toggleSignals += 1
      }
    }
    const onPerformanceEnded = () => {
      controlEvents.endedSignals += 1
    }

    anonymousSocket.on('authorization_error', onAuthorizationError)
    anonymousSocket.on('chat_status', onChatStatus)
    anonymousSocket.on('chat_status_toggled', onChatStatusToggled)
    anonymousSocket.on('performance_ended', onPerformanceEnded)

    anonymousSocket.emit('open_chat', { performanceId })
    anonymousSocket.emit('performance_ended', { performanceId })
    await sleep(800)

    expect(controlEvents.authErrors.some((entry: any) => entry && entry.event === 'open_chat')).toBeTruthy()
    expect(controlEvents.authErrors.some((entry: any) => entry && entry.event === 'performance_ended')).toBeTruthy()
    expect(controlEvents.openStatusSignals).toBe(0)
    expect(controlEvents.toggleSignals).toBe(0)
    expect(controlEvents.endedSignals).toBe(0)

    const ownerSocket = await connectSocket(realtimeOrigin)

    try {
      const ownerJoinStatusPromise = onceEvent(ownerSocket, 'chat_status', 5000)
      const ownerJoinHistoryPromise = onceEvent(ownerSocket, 'load_history', 5000)

      ownerSocket.emit('join_room', {
        performanceId,
        username: 'PlaywrightOwner',
        controlToken: ownerToken
      })

      const ownerJoinStatus = await ownerJoinStatusPromise
      const ownerJoinHistory = await ownerJoinHistoryPromise
      expect(typeof ownerJoinStatus?.status).toBe('string')
      expect(Array.isArray(ownerJoinHistory)).toBeTruthy()

      const ownerOpenSignal = onceEvent(ownerSocket, 'chat_status_toggled', 5000)
      ownerSocket.emit('open_chat', {
        performanceId,
        controlToken: ownerToken
      })
      const openSignal = await ownerOpenSignal
      expect(openSignal?.enabled).toBe(true)

      const ownerClosedSignal = onceEvent(ownerSocket, 'chat_status_toggled', 5000)
      ownerSocket.emit('performance_ended', {
        performanceId,
        controlToken: ownerToken
      })
      const closedSignal = await ownerClosedSignal
      expect(closedSignal?.enabled).toBe(false)
    } finally {
      ownerSocket.disconnect()
    }

    anonymousSocket.off('authorization_error', onAuthorizationError)
    anonymousSocket.off('chat_status', onChatStatus)
    anonymousSocket.off('chat_status_toggled', onChatStatusToggled)
    anonymousSocket.off('performance_ended', onPerformanceEnded)
  } finally {
    anonymousSocket.disconnect()
  }
})
