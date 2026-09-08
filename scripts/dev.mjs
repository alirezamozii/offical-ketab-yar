import { spawn, execSync } from 'node:child_process'
import os from 'node:os'

import path from 'node:path'
import fs from 'node:fs'

// Ensure Docker binary path is included on Windows
if (os.platform() === 'win32') {
  const localAppData = process.env.LOCALAPPDATA || (process.env.USERPROFILE ? path.join(process.env.USERPROFILE, 'AppData', 'Local') : '')
  const candidatePaths = [
    'C:\\Program Files\\Docker\\Docker\\resources\\bin',
    path.join(localAppData, 'Programs', 'DockerDesktop', 'resources', 'bin'),
    path.join(localAppData, 'Programs', 'Docker', 'resources', 'bin'),
    'C:\\Program Files\\Docker\\resources\\bin',
  ]

  for (const p of candidatePaths) {
    if (p && fs.existsSync(p) && !process.env.PATH?.includes(p)) {
      process.env.PATH = `${p};${process.env.PATH || ''}`
    }
  }

  // If docker is installed but not running, try launching Docker Desktop
  const dockerDesktopCandidates = [
    path.join(localAppData, 'Programs', 'DockerDesktop', 'Docker Desktop.exe'),
    path.join(localAppData, 'Programs', 'Docker', 'Docker Desktop.exe'),
    'C:\\Program Files\\Docker\\Docker\\Docker Desktop.exe',
  ]

  const dockerExeExists = candidatePaths.some((p) => fs.existsSync(path.join(p, 'docker.exe')))
  if (dockerExeExists) {
    try {
      execSync('docker info', { stdio: 'ignore' })
    } catch {
      for (const exe of dockerDesktopCandidates) {
        if (fs.existsSync(exe)) {
          console.log('⏳ Starting Docker Desktop...')
          spawn(exe, [], { detached: true, stdio: 'ignore' }).unref()
          // Wait briefly for daemon startup
          for (let i = 0; i < 20; i++) {
            try {
              execSync('docker info', { stdio: 'ignore' })
              console.log('✅ Docker Desktop is now running.\n')
              break
            } catch {
              execSync('ping -n 2 127.0.0.1 >nul', { stdio: 'ignore' })
            }
          }
          break
        }
      }
    }
  }
}

console.log('🚀 Starting Bookzi (بوکزی) development environment...\n')

// 1. Ensure Docker Postgres container is up and healthy
try {
  console.log('📦 Ensuring PostgreSQL Docker container is running...')
  execSync('docker compose up -d db', { stdio: 'inherit' })

  // Wait for Postgres to be ready (healthcheck)
  console.log('⏳ Waiting for Postgres to accept connections...')
  let ready = false
  for (let i = 0; i < 30; i++) {
    try {
      execSync('docker compose exec -T db pg_isready -U ky', {
        stdio: 'ignore',
      })
      ready = true
      break
    } catch {
      // Sleep 1 second and retry
      execSync(
        os.platform() === 'win32'
          ? 'ping -n 2 127.0.0.1 >nul'
          : 'sleep 1',
        { stdio: 'ignore' }
      )
    }
  }
  if (ready) {
    console.log('✅ Postgres container is ready.\n')
    // Ensure payload schema exists for Payload CMS isolation
    try {
      const dbName = process.env.POSTGRES_DB || 'bookzi'
      execSync(`docker compose exec -T db psql -U ky -d ${dbName} -c "CREATE SCHEMA IF NOT EXISTS payload;"`, {
        stdio: 'ignore',
      })
      console.log('✅ Payload PostgreSQL schema verified.\n')
    } catch {
      // Ignored
    }
  } else {
    console.warn('⚠️ Postgres may not be fully ready yet, continuing...\n')
  }
} catch (err) {
  console.warn('⚠️ Docker compose skipped or Docker Desktop is not running.\n')
}

import net from 'node:net'

async function checkPostgresPort() {
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

const isPostgresUp = await checkPostgresPort()
if (!isPostgresUp) {
  process.env.DB_OFFLINE = 'true'
  console.log('ℹ️ PostgreSQL is offline. Instant mock/seed fallback enabled (DB_OFFLINE=true).\n')
}

// 2. Ensure Prisma schema & client are in sync (only if Postgres is online)
if (isPostgresUp) {
  try {
    console.log('🔄 Syncing Prisma database schema...')
    execSync('npx prisma db push --skip-generate --accept-data-loss', {
      stdio: 'inherit',
    })
    execSync('npx prisma generate', { stdio: 'inherit' })
    console.log('✅ Database schema and client in sync.\n')
  } catch (err) {
    console.warn('⚠️ Prisma sync skipped.\n')
  }
}

// 3. Launch Next.js dev server
// Set PAYLOAD_CI=true so Drizzle's push auto-accepts new table prompts
console.log('⚡ Starting Next.js dev server on port 3000...\n')
const nodeOptions = [
  process.env.NODE_OPTIONS || '',
  '--unhandled-rejections=warn',
]
  .filter(Boolean)
  .join(' ')

const devProcess = spawn('npx', ['next', 'dev', '-p', process.env.PORT || '3000'], {
  stdio: ['ignore', 'inherit', 'inherit'],
  shell: true,
  env: {
    ...process.env,
    // Tell Drizzle to auto-accept schema changes without interactive prompts
    PAYLOAD_CI: 'true',
    NODE_OPTIONS: nodeOptions,
  },
})

// Forward termination signals to child
for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, () => {
    devProcess.kill(sig)
  })
}

devProcess.on('exit', (code, signal) => {
  console.log(`\n🛑 Next.js dev server exited (code: ${code}, signal: ${signal})\n`)
  process.exit(code ?? 0)
})
