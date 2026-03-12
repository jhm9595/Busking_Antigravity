'use strict'

const PRISMA_WRITE_OPERATIONS = [
  'create',
  'createMany',
  'update',
  'updateMany',
  'upsert',
  'delete',
  'deleteMany',
  '$executeRaw',
  '$queryRaw',
  '$transaction'
]

function extractGetHandlerSource(routeSource) {
  const getDeclaration = /export\s+async\s+function\s+GET\s*\(/m
  const startMatch = getDeclaration.exec(routeSource)

  if (!startMatch) {
    return ''
  }

  return routeSource.slice(startMatch.index)
}

function findPrismaWriteCalls(sourceText) {
  const matches = []
  const writePattern = /prisma\.(?:\w+)\.(createMany|create|updateMany|update|upsert|deleteMany|delete)\s*\(|prisma\.(\$executeRaw|\$queryRaw|\$transaction)\s*\(/g
  let match = writePattern.exec(sourceText)

  while (match) {
    const operation = match[1] || match[2]
    if (operation && PRISMA_WRITE_OPERATIONS.includes(operation)) {
      matches.push({
        operation,
        index: match.index
      })
    }

    match = writePattern.exec(sourceText)
  }

  return matches
}

function evaluateGetHandlerNoWriteContract(routePath, routeSource) {
  const getHandlerSource = extractGetHandlerSource(routeSource)
  const writeCalls = findPrismaWriteCalls(getHandlerSource)

  return {
    routePath,
    hasGetHandler: Boolean(getHandlerSource),
    writeCallCount: writeCalls.length,
    writeCalls,
    passesNoWriteContract: writeCalls.length === 0
  }
}

module.exports = {
  PRISMA_WRITE_OPERATIONS,
  extractGetHandlerSource,
  findPrismaWriteCalls,
  evaluateGetHandlerNoWriteContract
}
