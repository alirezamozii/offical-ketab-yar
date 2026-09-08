const BASE_URL = 'http://localhost:3000'

interface ApiTest {
  name: string
  url: string
  method: string
  expectedStatus: number
  validateBody?: (json: any) => boolean
}

const API_TESTS: ApiTest[] = [
  {
    name: 'Health Check /api/health/ready',
    url: `${BASE_URL}/api/health/ready`,
    method: 'GET',
    expectedStatus: 200,
    validateBody: (json) => json.status === 'ok' || json.ready === true || json.db === 'ok'
  },
  {
    name: 'Search API Endpoint /api/search?q=wild',
    url: `${BASE_URL}/api/search?q=wild`,
    method: 'GET',
    expectedStatus: 200
  },
  {
    name: 'Book API Endpoint /api/books',
    url: `${BASE_URL}/api/books`,
    method: 'GET',
    expectedStatus: 200
  },
  {
    name: 'Support API POST /api/support validation',
    url: `${BASE_URL}/api/support`,
    method: 'POST',
    expectedStatus: 400 // Invalid payload should return 400 validation error
  }
]

async function runApiContractAudit() {
  console.log('🔌 Starting E2E Route & API Contract Audit...\n')
  let passed = 0
  let failed = 0

  for (const test of API_TESTS) {
    try {
      const options: RequestInit = {
        method: test.method,
        headers: test.method === 'POST' ? { 'Content-Type': 'application/json' } : {}
      }
      if (test.method === 'POST') {
        options.body = JSON.stringify({}) // Empty body to trigger validation error
      }

      const res = await fetch(test.url, options)
      const isStatusValid = res.status === test.expectedStatus

      let isBodyValid = true
      if (isStatusValid && test.validateBody) {
        try {
          const json = await res.json()
          isBodyValid = test.validateBody(json)
        } catch {
          isBodyValid = false
        }
      }

      if (isStatusValid && isBodyValid) {
        console.log(`✅ [PASS] ${test.name.padEnd(45)} Status: ${res.status}`)
        passed++
      } else {
        console.log(`❌ [FAIL] ${test.name.padEnd(45)} Status: ${res.status} (Expected: ${test.expectedStatus})`)
        failed++
      }
    } catch (err: any) {
      console.log(`❌ [ERROR] ${test.name.padEnd(45)} Error: ${err.message}`)
      failed++
    }
  }

  console.log(`\nResults: ${passed} Passed | ${failed} Failed`)
  process.exit(failed > 0 ? 1 : 0)
}

runApiContractAudit()
