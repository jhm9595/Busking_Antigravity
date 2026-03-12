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

function checkFollowRouteUsesServerIdentity(source) {
  const hasAuthCall = source.includes('const authState = await auth()')
  const hasActorDerivedFanId = source.includes('const fanId = access.actorUserId')
  const doesNotTrustBodyFanId = !source.includes('const { fanId } = body')

  return {
    pass: hasAuthCall && hasActorDerivedFanId && doesNotTrustBodyFanId,
    hasAuthCall,
    hasActorDerivedFanId,
    doesNotTrustBodyFanId
  }
}

function checkPerformanceOwnerGuard(source) {
  const hasOwnerLookup = source.includes("select: { singerId: true }")
  const hasOwnerCheck = source.includes('const access = await requireOwnerWrite(performance.singerId)')

  return {
    pass: hasOwnerLookup && hasOwnerCheck,
    hasOwnerLookup,
    hasOwnerCheck
  }
}

function checkSongRequestUsesServerIdentity(source) {
  const startMarker = 'export async function createSongRequest'
  const endMarker = 'export async function acceptSongRequest'
  const start = source.indexOf(startMarker)
  const end = source.indexOf(endMarker, start)
  const createSongRequestSource = start === -1 ? '' : source.slice(start, end === -1 ? source.length : end)

  const hasFunction = createSongRequestSource.includes(startMarker)
  const hasAuthGuard = createSongRequestSource.includes('const access = await requireAuthenticatedWrite()')
  const hasActorGuard = createSongRequestSource.includes('!access.allowed || !access.actorUserId')
  const looksUpRequesterProfile = createSongRequestSource.includes('const requesterProfile = await prisma.profile.findUnique({')
  const derivesRequesterNameFromProfile = createSongRequestSource.includes('requesterName: requesterProfile?.nickname || access.actorUserId')
  const doesNotTrustBodyRequesterName = !createSongRequestSource.includes('requesterName: data.requesterName')
  const doesNotAcceptRequesterNameInput = !createSongRequestSource.includes('requesterName: string')

  return {
    pass:
      hasFunction &&
      hasAuthGuard &&
      hasActorGuard &&
      looksUpRequesterProfile &&
      derivesRequesterNameFromProfile &&
      doesNotTrustBodyRequesterName &&
      doesNotAcceptRequesterNameInput,
    hasFunction,
    hasAuthGuard,
    hasActorGuard,
    looksUpRequesterProfile,
    derivesRequesterNameFromProfile,
    doesNotTrustBodyRequesterName,
    doesNotAcceptRequesterNameInput
  }
}

function runCase(caseName, evaluateTrustBoundary, accessReason, fileChecks) {
  if (caseName === 'follow-route-derives-identity') {
    const followRoute = fileChecks.followRoute
    const pass = followRoute.pass

    return {
      pass,
      expected: 'follow POST derives identity from Clerk auth() instead of request body',
      result: followRoute
    }
  }

  if (caseName === 'owner-performance-update-succeeds') {
    const decision = evaluateTrustBoundary({
      action: 'write',
      authState: { userId: 'singer-1' },
      ownerId: 'singer-1',
      ownerRequired: true
    })

    const performanceGuard = fileChecks.performanceOwnerGuard

    const pass =
      decision.allowed === true &&
      decision.statusCode === 200 &&
      decision.reason === accessReason.ALLOWED_OWNER &&
      performanceGuard.pass

    return {
      pass,
      expected: 'owner write path remains allowed and performance owner guard exists',
      result: {
        decision,
        performanceGuard
      }
    }
  }

  if (caseName === 'unauthenticated-write-returns-401') {
    const decision = evaluateTrustBoundary({
      action: 'write',
      authState: { userId: null },
      ownerRequired: false
    })

    const songRequestRouteHas401 = fileChecks.songRequestRoute.includes("status: access.statusCode")
    const bookingRouteHas401 = fileChecks.bookingRoute.includes("status: access.statusCode")

    const pass =
      decision.allowed === false &&
      decision.statusCode === 401 &&
      decision.reason === accessReason.REJECT_UNAUTHENTICATED &&
      songRequestRouteHas401 &&
      bookingRouteHas401

    return {
      pass,
      expected: 'unauthenticated writes are rejected with 401',
      result: {
        decision,
        songRequestRouteHas401,
        bookingRouteHas401
      }
    }
  }

  if (caseName === 'foreign-performance-update-returns-403') {
    const decision = evaluateTrustBoundary({
      action: 'write',
      authState: { userId: 'singer-2' },
      ownerId: 'singer-1',
      ownerRequired: true
    })

    const singerServiceHasForbiddenResult = fileChecks.singerService.includes("error: statusCode === 401 ? 'UNAUTHORIZED' : 'FORBIDDEN'")

    const pass =
      decision.allowed === false &&
      decision.statusCode === 403 &&
      decision.reason === accessReason.REJECT_FORBIDDEN_OWNER_MISMATCH &&
      singerServiceHasForbiddenResult

    return {
      pass,
      expected: 'cross-owner writes are rejected with 403',
      result: {
        decision,
        singerServiceHasForbiddenResult
      }
    }
  }

  if (caseName === 'song-request-derives-identity') {
    const songRequestIdentity = fileChecks.songRequestIdentity

    return {
      pass: songRequestIdentity.pass,
      expected: 'createSongRequest derives requester identity from Clerk-authenticated actor',
      result: songRequestIdentity
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
    console.error('Usage: node test-suite/security/mutating-writes.test.js --case <name> --out <path>')
    process.exit(1)
  }

  const followRouteSource = fs.readFileSync(path.resolve(process.cwd(), 'src/app/api/singers/[id]/follow/route.ts'), 'utf8')
  const singerServiceSource = fs.readFileSync(path.resolve(process.cwd(), 'src/services/singer.ts'), 'utf8')
  const songRequestRouteSource = fs.readFileSync(path.resolve(process.cwd(), 'src/app/api/song-requests/route.ts'), 'utf8')
  const bookingRouteSource = fs.readFileSync(path.resolve(process.cwd(), 'src/app/api/booking/route.ts'), 'utf8')

  const fileChecks = {
    followRoute: checkFollowRouteUsesServerIdentity(followRouteSource),
    performanceOwnerGuard: checkPerformanceOwnerGuard(singerServiceSource),
    songRequestIdentity: checkSongRequestUsesServerIdentity(singerServiceSource),
    singerService: singerServiceSource,
    songRequestRoute: songRequestRouteSource,
    bookingRoute: bookingRouteSource
  }

  const execution = runCase(caseName, evaluateTrustBoundary, accessReason, fileChecks)

  const artifact = {
    suite: 'security-mutating-writes',
    case: caseName,
    pass: execution.pass,
    generatedAt: new Date().toISOString(),
    details: execution
  }

  writeArtifact(fs, path, outPath, artifact)

  if (!execution.pass) {
    console.error(`[security-mutating-writes] ${caseName}: FAIL`)
    process.exit(1)
  }

  console.log(`[security-mutating-writes] ${caseName}: PASS`)
}

main()
