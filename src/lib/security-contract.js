'use strict'

const ACCESS_REASON = Object.freeze({
  ALLOWED_PUBLIC_READ: 'ALLOWED_PUBLIC_READ',
  ALLOWED_OWNER: 'ALLOWED_OWNER',
  REJECT_UNAUTHENTICATED: 'REJECT_UNAUTHENTICATED',
  REJECT_FORBIDDEN_OWNER_MISMATCH: 'REJECT_FORBIDDEN_OWNER_MISMATCH'
})

function getActorFromClerkAuth(authState) {
  const userId = authState && typeof authState.userId === 'string' ? authState.userId : null

  return {
    userId,
    isAuthenticated: Boolean(userId)
  }
}

function evaluateTrustBoundary(options) {
  const {
    action,
    authState,
    ownerId = null,
    allowAnonymousRead = true,
    ownerRequired = true
  } = options

  const actor = getActorFromClerkAuth(authState)

  if (action === 'read') {
    if (allowAnonymousRead || actor.isAuthenticated) {
      return {
        allowed: true,
        statusCode: 200,
        reason: ACCESS_REASON.ALLOWED_PUBLIC_READ,
        actorUserId: actor.userId
      }
    }

    return {
      allowed: false,
      statusCode: 401,
      reason: ACCESS_REASON.REJECT_UNAUTHENTICATED,
      actorUserId: actor.userId
    }
  }

  if (!actor.isAuthenticated) {
    return {
      allowed: false,
      statusCode: 401,
      reason: ACCESS_REASON.REJECT_UNAUTHENTICATED,
      actorUserId: actor.userId
    }
  }

  if (ownerRequired && ownerId && actor.userId !== ownerId) {
    return {
      allowed: false,
      statusCode: 403,
      reason: ACCESS_REASON.REJECT_FORBIDDEN_OWNER_MISMATCH,
      actorUserId: actor.userId
    }
  }

  return {
    allowed: true,
    statusCode: 200,
    reason: ACCESS_REASON.ALLOWED_OWNER,
    actorUserId: actor.userId
  }
}

module.exports = {
  ACCESS_REASON,
  getActorFromClerkAuth,
  evaluateTrustBoundary
}
