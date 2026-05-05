/**
 * Lifecycle contract for GET handler read-only verification.
 * Used by test-suite/lifecycle/read-only.test.js
 */

/**
 * Analyzes a GET route source to verify it does NOT write to the database.
 * @param {string} routePath - The route file path (for error messages)
 * @param {string} source - The source code of the GET handler
 * @returns {{ passesNoWriteContract: boolean, reasons: string[] }}
 */
function evaluateGetHandlerNoWriteContract(routePath, source) {
    const reasons = []

    // Check for Prisma write operations
    const writePatterns = [
        { pattern: /prisma\.\w+\.update\s*\(/, name: 'prisma.update()' },
        { pattern: /prisma\.\w+\.create\s*\(/, name: 'prisma.create()' },
        { pattern: /prisma\.\w+\.delete\s*\(/, name: 'prisma.delete()' },
        { pattern: /prisma\.\w+\.upsert\s*\(/, name: 'prisma.upsert()' },
        { pattern: /prisma\.\$transaction\s*\(/, name: 'prisma.$transaction()' },
        { pattern: /prisma\.\w+\.updateMany\s*\(/, name: 'prisma.updateMany()' },
        { pattern: /prisma\.\w+\.deleteMany\s*\(/, name: 'prisma.deleteMany()' },
    ]

    const foundWrites = writePatterns
        .filter(({ pattern }) => pattern.test(source))
        .map(({ name }) => name)

    if (foundWrites.length > 0) {
        reasons.push(`Found DB write operations: ${foundWrites.join(', ')}`)
    }

    // Check for shared resolver usage (preferred pattern)
    const usesSharedResolver = /resolvePerformanceStatus\s*\(/.test(source)
    if (!usesSharedResolver) {
        reasons.push('Does not use shared resolvePerformanceStatus() from @/lib/performance-lifecycle')
    }

    // GET handler should not have WRITE or MUTATE in comments
    const hasWriteComment = /(?:WRITE|MUTATE|UPDATE|CREATE|DELETE)\s*:/i.test(source)
    if (hasWriteComment) {
        reasons.push('Source contains WRITE/MUTATE comments suggesting mutation intent')
    }

    return {
        passesNoWriteContract: foundWrites.length === 0,
        reasons,
        foundWrites,
        usesSharedResolver
    }
}

module.exports = { evaluateGetHandlerNoWriteContract }
