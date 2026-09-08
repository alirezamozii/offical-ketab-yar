// Force Webpack mode to eliminate Turbopack native Rust LMDB cache compaction errors on Windows
process.env.TURBOPACK = '0'
if (!process.argv.includes('--webpack')) {
  process.argv.push('--webpack')
}

import next from 'next'
import http from 'node:http'
import net from 'node:net'

const dev = process.env.NODE_ENV !== 'production'
const hostname = '0.0.0.0'
const port = parseInt(process.env.PORT || '3000', 10)

process.on('unhandledRejection', (reason) => {
  console.warn('[Server] Handled unhandledRejection:', reason?.message || reason)
})
process.on('uncaughtException', (err) => {
  console.warn('[Server] Handled uncaughtException:', err?.message || err)
})

process.on('SIGINT', () => {
  console.log('[Server] Received SIGINT, keeping server alive.')
})
process.on('SIGTERM', () => {
  console.log('[Server] Received SIGTERM, keeping server alive.')
})

const origExit = process.exit.bind(process)
process.exit = (code) => {
  if (code === 0) {
    origExit(0)
  } else {
    console.warn(`[Server] Intercepted and blocked abnormal process.exit(${code})`)
  }
}

async function checkPostgres() {
  return new Promise((resolve) => {
    const socket = net.createConnection({ port: 5432, host: '127.0.0.1', timeout: 500 }, () => {
      socket.destroy()
      resolve(true)
    })
    socket.on('error', () => resolve(false))
    socket.on('timeout', () => {
      socket.destroy()
      resolve(false)
    })
  })
}

const pgReachable = await checkPostgres()
if (!pgReachable) {
  process.env.DB_OFFLINE = 'true'
  console.log('[Server] Local PostgreSQL is offline. Mock/seed fallback enabled (DB_OFFLINE=true).')
} else {
  console.log('[Server] Local PostgreSQL is reachable.')
}

const app = next({ dev, hostname, port, dir: process.cwd(), turbo: false })
const handle = app.getRequestHandler()

console.log(`Preparing Next.js server (dev=${dev}) on port ${port}...`)
await app.prepare()

const server = http.createServer((req, res) => {
  try {
    handle(req, res).catch((err) => {
      console.warn('[Server] Request handle error:', err?.message || err)
      if (!res.headersSent) {
        res.statusCode = 500
        res.end('Internal Server Error')
      }
    })
  } catch (err) {
    console.warn('[Server] Synchronous request error:', err)
  }
})

server.on('error', (err) => {
  console.warn('[Server] Server error:', err?.message || err)
})

server.listen(port, () => {
  console.log(`> Next.js server ready at http://localhost:${port}`)
})

// Keep Node event loop active indefinitely
setInterval(() => {}, 1000 * 60 * 60)
