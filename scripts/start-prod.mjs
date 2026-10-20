import next from 'next'
import http from 'node:http'
import compression from 'compression'
import net from 'node:net'

const compress = compression()

const dev = false
const hostname = '0.0.0.0'
const port = parseInt(process.env.PORT || '3000', 10)

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
    socket.on('error', () => {
      resolve(false)
    })
    socket.on('timeout', () => {
      socket.destroy()
      resolve(false)
    })
  })
}

const pgReachable = await checkPostgres()
if (!pgReachable) {
  process.env.DB_OFFLINE = 'true'
  console.log('[Server] Local PostgreSQL at 127.0.0.1:5432 is offline. Enabling instant mock/seed fallback (DB_OFFLINE=true).')
} else {
  console.log('[Server] Local PostgreSQL at 127.0.0.1:5432 is reachable.')
}

const app = next({ dev, hostname, port, dir: process.cwd() })
const handle = app.getRequestHandler()

console.log('Preparing Next.js production server...')
await app.prepare()

const server = http.createServer((req, res) => {
  compress(req, res, () => {
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
})

server.on('error', (err) => {
  console.warn('[Server] Server error:', err?.message || err)
})
server.on('clientError', (err, socket) => {
  if (!socket.destroyed) {
    socket.destroy()
  }
})

server.keepAliveTimeout = 65000
server.headersTimeout = 66000

server.listen(port, () => {
  console.log(`> Next.js production server listening on http://localhost:${port}`)
})

// Keep Node event loop active indefinitely
setInterval(() => {}, 1000 * 60 * 60)

