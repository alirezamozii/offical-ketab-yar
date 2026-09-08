import { performance } from 'perf_hooks'

const BASE_URL = 'http://localhost:3000'

interface DeviceProfile {
  name: string
  simulatedLatencyMs: number
  simulatedBandwidthBps: number // Bytes per sec
  cpuThrottleMultiplier: number
}

const DEVICE_PROFILES: DeviceProfile[] = [
  {
    name: 'High-End Desktop (Fiber 1Gbps, 0ms Extra Latency)',
    simulatedLatencyMs: 0,
    simulatedBandwidthBps: 125_000_000, // 1 Gbps
    cpuThrottleMultiplier: 1.0
  },
  {
    name: 'Mid-Tier Smartphone (4G LTE, 40ms Latency, 20Mbps)',
    simulatedLatencyMs: 40,
    simulatedBandwidthBps: 2_500_000, // 20 Mbps
    cpuThrottleMultiplier: 2.0
  },
  {
    name: 'Low-End Device (Slow 3G, 200ms Latency, 768Kbps)',
    simulatedLatencyMs: 200,
    simulatedBandwidthBps: 96_000, // 768 Kbps
    cpuThrottleMultiplier: 4.0
  }
]

const KEY_ROUTES = [
  '/',
  '/library',
  '/books/call-of-the-wild',
  '/books/read/call-of-the-wild',
  '/vocabulary'
]

async function measureDeviceSimulation(route: string, profile: DeviceProfile) {
  const url = `${BASE_URL}${route}`
  const startTime = performance.now()

  // Simulate network round-trip latency
  if (profile.simulatedLatencyMs > 0) {
    await new Promise(r => setTimeout(r, profile.simulatedLatencyMs))
  }

  const res = await fetch(url)
  const ttfb = performance.now() - startTime
  const text = await res.text()
  const contentSizeBytes = Buffer.byteLength(text, 'utf8')

  // Simulate network transfer time based on bandwidth
  const transferTimeMs = (contentSizeBytes / profile.simulatedBandwidthBps) * 1000
  
  // Simulate client JS parsing & execution CPU cost
  const parseCpuMs = (contentSizeBytes / 10000) * profile.cpuThrottleMultiplier

  const totalSimulatedTimeMs = Math.round(ttfb + transferTimeMs + parseCpuMs)

  return {
    route,
    status: res.status,
    rawTtfbMs: Math.round(ttfb),
    totalSimulatedTimeMs,
    contentSizeBytes
  }
}

async function runDeviceBenchmark() {
  console.log('📱 Starting Multi-Device & Network Speed Simulation Benchmark...\n')

  for (const profile of DEVICE_PROFILES) {
    console.log(`======================================================`)
    console.log(`PROFILE: ${profile.name}`)
    console.log(`======================================================`)

    for (const route of KEY_ROUTES) {
      const res = await measureDeviceSimulation(route, profile)
      console.log(
        `  - ${res.route.padEnd(30)} TTFB: ${res.rawTtfbMs}ms | Est Load: ${res.totalSimulatedTimeMs}ms | Payload: ${(res.contentSizeBytes / 1024).toFixed(1)}KB`
      )
    }
    console.log('\n')
  }

  process.exit(0)
}

runDeviceBenchmark()
