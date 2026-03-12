'use strict'

const crypto = require('node:crypto')

const MIN_SECRET_LENGTH = 32
const DEFAULT_TOKEN_TTL_SECONDS = 5 * 60
const MAX_TOKEN_TTL_SECONDS = 30 * 60
const DEV_FALLBACK_SECRET = 'dev-only-realtime-control-secret-change-before-production'

function normalizeString(value) {
  if (typeof value !== 'string') {
    return null
  }

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function normalizeCapacity(value) {
  if (value === null || value === undefined) {
    return null
  }

  const parsed = Number.parseInt(String(value), 10)
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null
  }

  return parsed
}

function normalizeTtlSeconds(value) {
  const parsed = Number.parseInt(String(value), 10)
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return DEFAULT_TOKEN_TTL_SECONDS
  }

  return Math.min(parsed, MAX_TOKEN_TTL_SECONDS)
}

function getRealtimeControlSecret() {
  const configuredSecret = normalizeString(process.env.REALTIME_CONTROL_TOKEN_SECRET)
  if (configuredSecret && configuredSecret.length >= MIN_SECRET_LENGTH) {
    return configuredSecret
  }

  if (process.env.NODE_ENV !== 'production') {
    return DEV_FALLBACK_SECRET
  }

  return null
}

function serializePayload(payload) {
  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url')
}

function signPayload(encodedPayload, secret) {
  return crypto
    .createHmac('sha256', secret)
    .update(encodedPayload)
    .digest('base64url')
}

function createRealtimeControlToken(payload, options = {}) {
  const secret = getRealtimeControlSecret()
  if (!secret) {
    return null
  }

  const performanceId = normalizeString(payload && payload.performanceId)
  const userId = normalizeString(payload && (payload.userId || payload.sub))
  if (!performanceId || !userId) {
    return null
  }

  const issuedAt = Math.floor(Date.now() / 1000)
  const ttlSeconds = normalizeTtlSeconds(options.ttlSeconds)
  const expiresAt = issuedAt + ttlSeconds

  const tokenPayload = {
    sub: userId,
    performanceId,
    role: 'owner',
    iat: issuedAt,
    exp: expiresAt
  }

  const capacity = normalizeCapacity(payload && payload.capacity)
  if (capacity) {
    tokenPayload.capacity = capacity
  }

  const encodedPayload = serializePayload(tokenPayload)
  const signature = signPayload(encodedPayload, secret)

  return `${encodedPayload}.${signature}`
}

function verifyRealtimeControlToken(token, expectedPerformanceId) {
  const providedToken = normalizeString(token)
  if (!providedToken) {
    return {
      valid: false,
      reason: 'MISSING_TOKEN',
      payload: null
    }
  }

  const parts = providedToken.split('.')
  if (parts.length !== 2) {
    return {
      valid: false,
      reason: 'MALFORMED_TOKEN',
      payload: null
    }
  }

  const secret = getRealtimeControlSecret()
  if (!secret) {
    return {
      valid: false,
      reason: 'TOKEN_SECRET_UNAVAILABLE',
      payload: null
    }
  }

  const encodedPayload = parts[0]
  const providedSignature = parts[1]
  const expectedSignature = signPayload(encodedPayload, secret)

  const expectedSignatureBuffer = Buffer.from(expectedSignature)
  const providedSignatureBuffer = Buffer.from(providedSignature)

  if (
    expectedSignatureBuffer.length !== providedSignatureBuffer.length ||
    !crypto.timingSafeEqual(expectedSignatureBuffer, providedSignatureBuffer)
  ) {
    return {
      valid: false,
      reason: 'INVALID_SIGNATURE',
      payload: null
    }
  }

  let decodedPayload = null
  try {
    decodedPayload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'))
  } catch (_error) {
    return {
      valid: false,
      reason: 'INVALID_PAYLOAD',
      payload: null
    }
  }

  const performanceId = normalizeString(decodedPayload && decodedPayload.performanceId)
  const subject = normalizeString(decodedPayload && decodedPayload.sub)
  const role = normalizeString(decodedPayload && decodedPayload.role)
  const expiresAt = Number.parseInt(String(decodedPayload && decodedPayload.exp), 10)
  const issuedAt = Number.parseInt(String(decodedPayload && decodedPayload.iat), 10)
  const now = Math.floor(Date.now() / 1000)

  if (!performanceId || !subject || role !== 'owner') {
    return {
      valid: false,
      reason: 'INVALID_CLAIMS',
      payload: null
    }
  }

  if (!Number.isInteger(issuedAt) || !Number.isInteger(expiresAt) || expiresAt <= issuedAt || expiresAt < now) {
    return {
      valid: false,
      reason: 'TOKEN_EXPIRED',
      payload: null
    }
  }

  const expectedId = normalizeString(expectedPerformanceId)
  if (expectedId && performanceId !== expectedId) {
    return {
      valid: false,
      reason: 'PERFORMANCE_MISMATCH',
      payload: null
    }
  }

  const capacity = normalizeCapacity(decodedPayload && decodedPayload.capacity)

  return {
    valid: true,
    reason: 'OK',
    payload: {
      sub: subject,
      performanceId,
      role,
      iat: issuedAt,
      exp: expiresAt,
      capacity
    }
  }
}

module.exports = {
  createRealtimeControlToken,
  verifyRealtimeControlToken,
  getRealtimeControlSecret
}
