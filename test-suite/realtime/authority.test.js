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

function readSource(fsModule, pathModule, relativePath) {
  const fs = fsModule
  const path = pathModule
  const absolutePath = path.resolve(process.cwd(), relativePath)
  return fs.readFileSync(absolutePath, 'utf8')
}

function extractJoinEmitBlock(source) {
  const match = source.match(/socket\.emit\('join_room',\s*\{([\s\S]*?)\}\)/)
  return match ? match[1] : ''
}

function buildSourceChecks(sourceMap) {
  const serverSource = sourceMap['realtime-server/server.js']
  const singerLiveSource = sourceMap['src/app/singer/live/page.tsx']
  const chatBoxSource = sourceMap['src/components/chat/ChatBox.tsx']

  const chatJoinEmitBlock = extractJoinEmitBlock(chatBoxSource)

  return {
    serverOpenChatGuarded: /socket\.on\('open_chat',[\s\S]*?authorizeOwnerControl\(/.test(serverSource),
    serverSystemAlertGuarded: /socket\.on\('system_alert',[\s\S]*?authorizeOwnerControl\(/.test(serverSource),
    serverPerformanceEndedGuarded: /socket\.on\('performance_ended',[\s\S]*?authorizeOwnerControl\(/.test(serverSource),
    serverJoinNoClaimedCapacity: !/const \{ performanceId, username, userType, capacity/.test(serverSource),
    serverNoClaimedSingerBypass:
      !/status !== 'open' && userType !== 'singer'/.test(serverSource) &&
      !/status === 'open' \|\| userType === 'singer'/.test(serverSource),
    serverHistoryRequiresTrustedOwner: /if \(status === 'open' \|\| isOwner\)/.test(serverSource),
    singerUsesTokenAction: /createRealtimeOwnerControlToken/.test(singerLiveSource),
    singerPrivilegedFlowUsesControlToken:
      /emitOwnerControlEvent\(/.test(singerLiveSource) &&
      /controlToken: token/.test(singerLiveSource),
    chatJoinSendsControlToken: /controlToken:\s*controlToken\s*\|\|\s*undefined/.test(chatJoinEmitBlock),
    chatJoinDoesNotSendUserTypeOrCapacity:
      !/userType/.test(chatJoinEmitBlock) &&
      !/capacity/.test(chatJoinEmitBlock)
  }
}

function runCase(caseName, authorityApi, tokenApi, sourceChecks) {
  const { resolveJoinAuthority, authorizeOwnerControl } = authorityApi
  const { createRealtimeControlToken } = tokenApi

  const performanceId = 'perf-authority-1'
  const ownerId = 'owner-user-1'

  if (caseName === 'audience-open-chat-denied') {
    const decision = authorizeOwnerControl(
      { role: 'audience', performanceId, actorUserId: null },
      { performanceId }
    )

    const pass =
      decision.allowed === false &&
      sourceChecks.serverOpenChatGuarded &&
      sourceChecks.serverNoClaimedSingerBypass &&
      sourceChecks.serverJoinNoClaimedCapacity

    return {
      pass,
      expected: 'audience clients cannot open chat without trusted owner authorization',
      details: {
        decision,
        sourceChecks
      }
    }
  }

  if (caseName === 'audience-end-performance-denied') {
    const decision = authorizeOwnerControl(
      { role: 'audience', performanceId, actorUserId: null },
      { performanceId }
    )

    const pass =
      decision.allowed === false &&
      sourceChecks.serverPerformanceEndedGuarded &&
      sourceChecks.serverNoClaimedSingerBypass

    return {
      pass,
      expected: 'audience clients cannot end performance without trusted owner authorization',
      details: {
        decision,
        sourceChecks
      }
    }
  }

  if (caseName === 'forged-system-alert-rejected') {
    const ownerTokenForOtherPerformance = createRealtimeControlToken({
      userId: ownerId,
      performanceId: 'different-performance-id',
      role: 'owner',
      capacity: 90
    }, {
      ttlSeconds: 300
    })

    const decision = authorizeOwnerControl(
      { role: 'audience', performanceId, actorUserId: null },
      {
        performanceId,
        controlToken: ownerTokenForOtherPerformance
      }
    )

    const pass =
      ownerTokenForOtherPerformance !== null &&
      decision.allowed === false &&
      decision.reason === 'PERFORMANCE_MISMATCH' &&
      sourceChecks.serverSystemAlertGuarded

    return {
      pass,
      expected: 'forged or replayed owner token for another performance is rejected',
      details: {
        decision,
        sourceChecks
      }
    }
  }

  if (caseName === 'owner-open-chat-allowed') {
    const ownerToken = createRealtimeControlToken({
      userId: ownerId,
      performanceId,
      role: 'owner',
      capacity: 120
    }, {
      ttlSeconds: 300
    })

    const joinDecision = resolveJoinAuthority({
      performanceId,
      controlToken: ownerToken
    })

    const decision = authorizeOwnerControl(null, {
      performanceId,
      controlToken: ownerToken
    })

    const pass =
      ownerToken !== null &&
      joinDecision.isOwner === true &&
      joinDecision.actorUserId === ownerId &&
      decision.allowed === true &&
      sourceChecks.serverOpenChatGuarded &&
      sourceChecks.singerUsesTokenAction &&
      sourceChecks.singerPrivilegedFlowUsesControlToken &&
      sourceChecks.chatJoinSendsControlToken &&
      sourceChecks.chatJoinDoesNotSendUserTypeOrCapacity &&
      sourceChecks.serverHistoryRequiresTrustedOwner

    return {
      pass,
      expected: 'authenticated owner token can open chat and trusted owner join can load closed-room history',
      details: {
        joinDecision,
        decision,
        sourceChecks
      }
    }
  }

  if (caseName === 'owner-end-performance-allowed') {
    const decision = authorizeOwnerControl(
      { role: 'owner', performanceId, actorUserId: ownerId },
      { performanceId }
    )

    const pass =
      decision.allowed === true &&
      decision.reason === 'SOCKET_OWNER' &&
      sourceChecks.serverPerformanceEndedGuarded

    return {
      pass,
      expected: 'trusted owner socket can end performance',
      details: {
        decision,
        sourceChecks
      }
    }
  }

  return {
    pass: false,
    expected: 'known --case value',
    details: {
      error: `Unsupported case: ${caseName}`
    }
  }
}

async function main() {
  const fs = await import('node:fs')
  const path = await import('node:path')

  const authorityModuleImport = await import('../../src/lib/realtime-authority.js')
  const authorityModule = authorityModuleImport.default || authorityModuleImport

  const tokenModuleImport = await import('../../src/lib/realtime-control-token.js')
  const tokenModule = tokenModuleImport.default || tokenModuleImport

  const caseName = getArgument('--case')
  const outPath = getArgument('--out')

  if (!caseName || !outPath) {
    console.error('Usage: node test-suite/realtime/authority.test.js --case <name> --out <path>')
    process.exit(1)
  }

  const filesToRead = [
    'realtime-server/server.js',
    'src/app/singer/live/page.tsx',
    'src/components/chat/ChatBox.tsx'
  ]

  const sourceMap = filesToRead.reduce((acc, relativePath) => {
    acc[relativePath] = readSource(fs, path, relativePath)
    return acc
  }, {})

  const sourceChecks = buildSourceChecks(sourceMap)
  const execution = runCase(caseName, authorityModule, tokenModule, sourceChecks)

  const artifact = {
    suite: 'realtime-authority',
    case: caseName,
    pass: execution.pass,
    generatedAt: new Date().toISOString(),
    details: execution
  }

  writeArtifact(fs, path, outPath, artifact)

  if (!execution.pass) {
    console.error(`[realtime-authority] ${caseName}: FAIL`)
    process.exit(1)
  }

  console.log(`[realtime-authority] ${caseName}: PASS`)
}

main()
