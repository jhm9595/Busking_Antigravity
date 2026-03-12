'use strict'

const realtimeControlToken = require('./realtime-control-token.js')

const { verifyRealtimeControlToken } = realtimeControlToken

function normalizePerformanceId(value) {
  if (typeof value !== 'string') {
    return null
  }

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function resolveJoinAuthority(payload) {
  const performanceId = normalizePerformanceId(payload && payload.performanceId)
  if (!performanceId) {
    return {
      performanceId: null,
      isOwner: false,
      actorUserId: null,
      tokenPayload: null,
      reason: 'MISSING_PERFORMANCE_ID'
    }
  }

  const verification = verifyRealtimeControlToken(payload && payload.controlToken, performanceId)
  if (!verification.valid) {
    return {
      performanceId,
      isOwner: false,
      actorUserId: null,
      tokenPayload: null,
      reason: verification.reason
    }
  }

  return {
    performanceId,
    isOwner: true,
    actorUserId: verification.payload.sub,
    tokenPayload: verification.payload,
    reason: verification.reason
  }
}

function authorizeOwnerControl(socketData, payload) {
  const performanceId = normalizePerformanceId(payload && payload.performanceId)
  if (!performanceId) {
    return {
      allowed: false,
      performanceId: null,
      actorUserId: null,
      tokenPayload: null,
      reason: 'MISSING_PERFORMANCE_ID'
    }
  }

  const trustedSocketData = socketData && typeof socketData === 'object' ? socketData : {}
  if (trustedSocketData.role === 'owner' && trustedSocketData.performanceId === performanceId) {
    return {
      allowed: true,
      performanceId,
      actorUserId: trustedSocketData.actorUserId || null,
      tokenPayload: null,
      reason: 'SOCKET_OWNER'
    }
  }

  const verification = verifyRealtimeControlToken(payload && payload.controlToken, performanceId)
  if (!verification.valid) {
    return {
      allowed: false,
      performanceId,
      actorUserId: null,
      tokenPayload: null,
      reason: verification.reason
    }
  }

  return {
    allowed: true,
    performanceId,
    actorUserId: verification.payload.sub,
    tokenPayload: verification.payload,
    reason: verification.reason
  }
}

module.exports = {
  resolveJoinAuthority,
  authorizeOwnerControl,
  normalizePerformanceId
}
