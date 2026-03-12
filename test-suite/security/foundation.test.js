'use strict'

function getArgument(flag) {
  const index = process.argv.indexOf(flag)
  if (index === -1) {
    return null
  }

  return process.argv[index + 1] || null
}

function writeArtifact(fsModule, pathModule, outputPath, payload) {
  const fs = fsModule
  const path = pathModule
  const absolutePath = path.resolve(process.cwd(), outputPath)
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true })
  fs.writeFileSync(absolutePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')
}

function runCase(caseName, evaluateTrustBoundary, accessReason) {
  if (caseName === 'anonymous-read-allowed') {
    const result = evaluateTrustBoundary({
      action: 'read',
      authState: { userId: null },
      allowAnonymousRead: true
    })

    const pass =
      result.allowed === true &&
      result.statusCode === 200 &&
      result.reason === accessReason.ALLOWED_PUBLIC_READ

    return {
      pass,
      expected: 'anonymous read allowed',
      result
    }
  }

  if (caseName === 'anonymous-write-rejected') {
    const result = evaluateTrustBoundary({
      action: 'write',
      authState: { userId: null },
      ownerId: 'owner-1',
      ownerRequired: true
    })

    const pass =
      result.allowed === false &&
      result.statusCode === 401 &&
      result.reason === accessReason.REJECT_UNAUTHENTICATED

    return {
      pass,
      expected: 'unauthenticated protected write rejected',
      result
    }
  }

  if (caseName === 'cross-owner-write-forbidden') {
    const result = evaluateTrustBoundary({
      action: 'write',
      authState: { userId: 'singer-2' },
      ownerId: 'singer-1',
      ownerRequired: true
    })

    const pass =
      result.allowed === false &&
      result.statusCode === 403 &&
      result.reason === accessReason.REJECT_FORBIDDEN_OWNER_MISMATCH

    return {
      pass,
      expected: 'cross-owner protected write forbidden',
      result
    }
  }

  return {
    pass: false,
    expected: 'known --case value',
    result: {
      error: `Unsupported case: ${caseName}`
    }
  }
}

async function main() {
  const fs = await import('node:fs')
  const path = await import('node:path')
  const securityContractModule = await import('../../src/lib/security-contract.js')
  const securityContract = securityContractModule.default || securityContractModule
  const evaluateTrustBoundary = securityContract.evaluateTrustBoundary
  const accessReason = securityContract.ACCESS_REASON

  const caseName = getArgument('--case')
  const outPath = getArgument('--out')

  if (!caseName || !outPath) {
    console.error('Usage: node test-suite/security/foundation.test.js --case <name> --out <path>')
    process.exit(1)
  }

  const execution = runCase(caseName, evaluateTrustBoundary, accessReason)

  const artifact = {
    suite: 'security-foundation',
    case: caseName,
    pass: execution.pass,
    generatedAt: new Date().toISOString(),
    details: execution
  }

  writeArtifact(fs, path, outPath, artifact)

  if (!execution.pass) {
    console.error(`[security-foundation] ${caseName}: FAIL`)
    process.exit(1)
  }

  console.log(`[security-foundation] ${caseName}: PASS`)
}

main()
