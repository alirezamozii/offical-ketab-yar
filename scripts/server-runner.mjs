import { spawn } from 'node:child_process'

let restarting = false
let currentChild = null

function start() {
  console.log('🚀 [Supervisor] Spawning Next.js server with Webpack...')
  const child = spawn('node', ['scripts/start-server.mjs', '--webpack'], {
    stdio: ['ignore', 'inherit', 'inherit'],
    env: {
      ...process.env,
      DB_OFFLINE: 'true',
      TURBOPACK: '0',
      NODE_ENV: 'development',
    },
  })

  currentChild = child

  child.on('exit', (code, signal) => {
    console.warn(`⚠️ [Supervisor] Server exited (code: ${code}, signal: ${signal}). Auto-restarting in 1s...`)
    currentChild = null
    if (!restarting) {
      restarting = true
      setTimeout(() => {
        restarting = false
        start()
      }, 1000)
    }
  })

  child.on('error', (err) => {
    console.error('❌ [Supervisor] Failed to spawn child process:', err)
  })
}

// Keep supervisor alive indefinitely
if (process.stdin.resume) {
  process.stdin.resume()
}

setInterval(() => {
  // Heartbeat to keep event loop occupied
}, 30000)

process.on('SIGINT', () => {
  console.log('[Supervisor] SIGINT received, keeping process alive.')
})
process.on('SIGTERM', () => {
  console.log('[Supervisor] SIGTERM received, keeping process alive.')
})
process.on('uncaughtException', (err) => {
  console.warn('[Supervisor] Caught uncaughtException:', err)
})
process.on('unhandledRejection', (reason) => {
  console.warn('[Supervisor] Caught unhandledRejection:', reason)
})

start()
