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

function runGetRouteNoWriteCase(routePath, routeSource, evaluateGetHandlerNoWriteContract) {
    const noWriteContract = evaluateGetHandlerNoWriteContract(routePath, routeSource)
    const usesSharedResolverImport = /from ['"]@\/lib\/performance-lifecycle['"]/.test(routeSource)
    const usesSharedResolverCall = /resolvePerformanceStatus\(/.test(routeSource)

    return {
        pass:
            noWriteContract.passesNoWriteContract === true &&
            usesSharedResolverImport &&
            usesSharedResolverCall,
        expected: 'GET route is read-only and uses shared lifecycle resolver',
        details: {
            noWriteContract,
            usesSharedResolverImport,
            usesSharedResolverCall
        }
    }
}

function runStaleLifecycleConsistencyCase(sourceMap) {
    const lifecycleSource = sourceMap['src/lib/performance-lifecycle.ts']
    const utilsSource = sourceMap['src/utils/performance.ts']
    const performancesRouteSource = sourceMap['src/app/api/performances/route.ts']
    const singerRouteSource = sourceMap['src/app/api/singers/[id]/route.ts']

    const hasFallbackWindow = /DEFAULT_DURATION_MS\s*=\s*3\s*\*\s*60\s*\*\s*60\s*\*\s*1000/.test(lifecycleSource)
    const hasAutoCompleteTransition = /now\s*>=\s*end[\s\S]*return\s*'completed'/.test(lifecycleSource)
    const hasAutoLiveTransition = /now\s*>=\s*start[\s\S]*return\s*'live'/.test(lifecycleSource)
    const uiDelegatesToSharedResolver = /getEffectiveStatus\(/.test(utilsSource)
    const performancesRouteUsesSharedResolver = /resolvePerformanceStatus\(/.test(performancesRouteSource)
    const singerRouteUsesSharedResolver = /resolvePerformanceStatus\(/.test(singerRouteSource)

    return {
        pass:
            hasFallbackWindow &&
            hasAutoCompleteTransition &&
            hasAutoLiveTransition &&
            uiDelegatesToSharedResolver &&
            performancesRouteUsesSharedResolver &&
            singerRouteUsesSharedResolver,
        expected: 'stale scheduled/live records resolve consistently from one shared read resolver',
        details: {
            hasFallbackWindow,
            hasAutoCompleteTransition,
            hasAutoLiveTransition,
            uiDelegatesToSharedResolver,
            performancesRouteUsesSharedResolver,
            singerRouteUsesSharedResolver
        }
    }
}

function runCanceledNormalizationCase(sourceMap) {
  const lifecycleSource = sourceMap['src/lib/performance-lifecycle.ts']
  const utilsSource = sourceMap['src/utils/performance.ts']
  const performancesRouteSource = sourceMap['src/app/api/performances/route.ts']
  const singerRouteSource = sourceMap['src/app/api/singers/[id]/route.ts']

  const mapsCancelledToCanceled =
    /normalized\s*===\s*'cancelled'[\s\S]*return\s*'canceled'/.test(lifecycleSource)
  const utilsStatusTypeIsCanonical =
    /export type PerformanceStatus = 'planned' \| 'scheduled' \| 'live' \| 'completed' \| 'canceled'/.test(utilsSource)
  const apiRoutesAvoidCancelledLiteral =
    !/cancelled/.test(performancesRouteSource) &&
    !/cancelled/.test(singerRouteSource)

  return {
    pass: mapsCancelledToCanceled && utilsStatusTypeIsCanonical && apiRoutesAvoidCancelledLiteral,
    expected: 'canceled/cancelled values normalize to a single boundary status',
    details: {
      mapsCancelledToCanceled,
      utilsStatusTypeIsCanonical,
      apiRoutesAvoidCancelledLiteral
    }
  }
}

function runCase(caseName, sourceMap, evaluateGetHandlerNoWriteContract) {
  if (caseName === 'get-performances-no-db-write') {
    return runGetRouteNoWriteCase(
      'src/app/api/performances/route.ts',
      sourceMap['src/app/api/performances/route.ts'],
      evaluateGetHandlerNoWriteContract
    )
  }

  if (caseName === 'get-singer-no-db-write') {
    return runGetRouteNoWriteCase(
      'src/app/api/singers/[id]/route.ts',
      sourceMap['src/app/api/singers/[id]/route.ts'],
      evaluateGetHandlerNoWriteContract
    )
  }

  if (caseName === 'stale-scheduled-exposed-consistently') {
    return runStaleLifecycleConsistencyCase(sourceMap)
  }

  if (caseName === 'canceled-status-normalized') {
    return runCanceledNormalizationCase(sourceMap)
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
  const lifecycleContractModule = await import('../../src/lib/lifecycle-contract.js')
  const lifecycleContract = lifecycleContractModule.default || lifecycleContractModule
  const evaluateGetHandlerNoWriteContract = lifecycleContract.evaluateGetHandlerNoWriteContract

  const caseName = getArgument('--case')
  const outPath = getArgument('--out')

  if (!caseName || !outPath) {
    console.error('Usage: node test-suite/lifecycle/read-only.test.js --case <name> --out <path>')
    process.exit(1)
  }

  const filesToRead = [
    'src/app/api/performances/route.ts',
    'src/app/api/singers/[id]/route.ts',
    'src/lib/performance-lifecycle.ts',
    'src/utils/performance.ts'
  ]

  const sourceMap = filesToRead.reduce((acc, relativePath) => {
    acc[relativePath] = readSource(fs, path, relativePath)
    return acc
  }, {})

  const execution = runCase(caseName, sourceMap, evaluateGetHandlerNoWriteContract)

  const artifact = {
    suite: 'lifecycle-read-only',
    case: caseName,
    pass: execution.pass,
    generatedAt: new Date().toISOString(),
    details: execution
  }

  writeArtifact(fs, path, outPath, artifact)

  if (!execution.pass) {
    console.error(`[lifecycle-read-only] ${caseName}: FAIL`)
    process.exit(1)
  }

  console.log(`[lifecycle-read-only] ${caseName}: PASS`)
}

main()
