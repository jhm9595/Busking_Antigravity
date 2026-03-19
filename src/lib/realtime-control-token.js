const crypto = require('node:crypto')

const DEFAULT_SECRET = process.env.REALTIME_CONTROL_TOKEN_SECRET || 'dev-realtime-control-token-secret'
const DEFAULT_TTL_SECONDS = 60 * 10

function base64UrlEncode(value) {
  return Buffer.from(value).toString('base64url')
}

function base64UrlDecode(value) {
  return Buffer.from(value, 'base64url').toString('utf8')
}

function sign(unsignedToken, secret) {
  return crypto.createHmac('sha256', secret).update(unsignedToken).digest('base64url')
}

function createRealtimeControlToken(payload, options = {}) {
  if (!payload || !payload.userId || !payload.performanceId) {
    return null
  }

  const issuedAt = Math.floor(Date.now() / 1000)
  const ttlSeconds = Number.isFinite(options.ttlSeconds) ? options.ttlSeconds : DEFAULT_TTL_SECONDS
  const expiresAt = issuedAt + ttlSeconds

  const normalizedPayload = {
    sub: payload.userId,
    performanceId: payload.performanceId,
    role: payload.role || 'owner',
    capacity: payload.capacity || 50,
    iat: issuedAt,
    exp: expiresAt
  }

  const encodedPayload = base64UrlEncode(JSON.stringify(normalizedPayload))
  const signature = sign(encodedPayload, DEFAULT_SECRET)
  return `${encodedPayload}.${signature}`
}

function verifyRealtimeControlToken(token, expectedPerformanceId) {
  if (!token || typeof token !== 'string' || !token.includes('.')) {
    return { valid: false, payload: null }
  }

  const [encodedPayload, providedSignature] = token.split('.')
  const expectedSignature = sign(encodedPayload, DEFAULT_SECRET)

  if (providedSignature !== expectedSignature) {
    return { valid: false, payload: null }
  }

  try {
    const decoded = JSON.parse(base64UrlDecode(encodedPayload))
    const now = Math.floor(Date.now() / 1000)

    if (!decoded || decoded.role !== 'owner' || !decoded.sub || !decoded.performanceId) {
      return { valid: false, payload: null }
    }

    if (typeof decoded.exp === 'number' && decoded.exp < now) {
      return { valid: false, payload: null }
    }

    if (expectedPerformanceId && decoded.performanceId !== expectedPerformanceId) {
      return { valid: false, payload: null }
    }

    return {
      valid: true,
      payload: {
        sub: decoded.sub,
        performanceId: decoded.performanceId,
        role: decoded.role
      }
    }
  } catch {
    return { valid: false, payload: null }
  }
}

module.exports = {
  createRealtimeControlToken,
  verifyRealtimeControlToken
}
