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

function readRouteFile(fsModule, pathModule, relativePath) {
  const fs = fsModule
  const path = pathModule
  const absolutePath = path.resolve(process.cwd(), relativePath)
  return fs.readFileSync(absolutePath, 'utf8')
}

function runNoGetWritesContractCase(fsModule, pathModule, evaluateGetHandlerNoWriteContract) {
  const compliantFixture = `
    export async function GET() {
      const performances = await prisma.performance.findMany({})
      return performances
    }
  `
  const violatingFixture = `
    export async function GET() {
      await prisma.performance.update({ where: { id: 'x' }, data: { status: 'live' } })
      return []
    }
  `

  const fixtureCompliantCheck = evaluateGetHandlerNoWriteContract(
    'fixture/compliant.ts',
    compliantFixture
  )
  const fixtureViolationCheck = evaluateGetHandlerNoWriteContract(
    'fixture/violation.ts',
    violatingFixture
  )

  const routePaths = [
    'src/app/api/performances/route.ts',
    'src/app/api/singers/[id]/route.ts'
  ]

  const routeChecks = routePaths.map((routePath) => {
    const source = readRouteFile(fsModule, pathModule, routePath)
    return evaluateGetHandlerNoWriteContract(routePath, source)
  })

  const contractVerificationPass =
    fixtureCompliantCheck.passesNoWriteContract === true &&
    fixtureViolationCheck.passesNoWriteContract === false &&
    fixtureViolationCheck.writeCallCount > 0

  const routeContractPass = routeChecks.every(
    (entry) => entry.hasGetHandler === true && entry.passesNoWriteContract === true
  )

  return {
    pass: contractVerificationPass && routeContractPass,
    expected: 'GET lifecycle contract identifies writes and allows read-only handlers',
    fixtureChecks: {
      compliant: fixtureCompliantCheck,
      violation: fixtureViolationCheck
    },
    routeChecks,
    routeViolationsDetected: routeChecks.filter((entry) => !entry.passesNoWriteContract).length
  }
}

function runCase(caseName, fsModule, pathModule, evaluateGetHandlerNoWriteContract) {
  if (caseName === 'no-get-writes-contract') {
    return runNoGetWritesContractCase(fsModule, pathModule, evaluateGetHandlerNoWriteContract)
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
  const lifecycleContractModule = await import('../../src/lib/lifecycle-contract.js')
  const lifecycleContract = lifecycleContractModule.default || lifecycleContractModule
  const evaluateGetHandlerNoWriteContract = lifecycleContract.evaluateGetHandlerNoWriteContract

  const caseName = getArgument('--case')
  const outPath = getArgument('--out')

  if (!caseName || !outPath) {
    console.error('Usage: node test-suite/lifecycle/foundation.test.js --case <name> --out <path>')
    process.exit(1)
  }

  const execution = runCase(caseName, fs, path, evaluateGetHandlerNoWriteContract)

  const artifact = {
    suite: 'lifecycle-foundation',
    case: caseName,
    pass: execution.pass,
    generatedAt: new Date().toISOString(),
    details: execution
  }

  writeArtifact(fs, path, outPath, artifact)

  if (!execution.pass) {
    console.error(`[lifecycle-foundation] ${caseName}: FAIL`)
    process.exit(1)
  }

  console.log(`[lifecycle-foundation] ${caseName}: PASS`)
}

main()
