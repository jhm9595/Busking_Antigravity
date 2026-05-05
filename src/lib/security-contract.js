/**
 * Security contract for trust boundary verification.
 * Used by test-suite/security/*.test.js
 */

const ACCESS_REASON = Object.freeze({
    ALLOWED_PUBLIC_READ: 'allowed-public-read',
    ALLOWED_OWNER: 'allowed-owner',
    REJECT_UNAUTHENTICATED: 'reject-unauthenticated',
    REJECT_FORBIDDEN_OWNER_MISMATCH: 'reject-forbidden-owner-mismatch',
})

/**
 * Evaluates a trust boundary decision based on auth state and resource ownership.
 * @param {{ action: 'read'|'write', authState: { userId: string|null }, ownerId?: string, ownerRequired?: boolean }}
 * @returns {{ allowed: boolean, statusCode: number, reason: string }}
 */
function evaluateTrustBoundary({ action, authState, ownerId, ownerRequired = false }) {
    const isAuthenticated = authState.userId !== null

    if (action === 'read') {
        return {
            allowed: true,
            statusCode: 200,
            reason: ACCESS_REASON.ALLOWED_PUBLIC_READ
        }
    }

    // Write action
    if (!isAuthenticated) {
        return {
            allowed: false,
            statusCode: 401,
            reason: ACCESS_REASON.REJECT_UNAUTHENTICATED
        }
    }

    if (ownerRequired && ownerId && authState.userId !== ownerId) {
        return {
            allowed: false,
            statusCode: 403,
            reason: ACCESS_REASON.REJECT_FORBIDDEN_OWNER_MISMATCH
        }
    }

    return {
        allowed: true,
        statusCode: 200,
        reason: ACCESS_REASON.ALLOWED_OWNER
    }
}

module.exports = { evaluateTrustBoundary, ACCESS_REASON }
