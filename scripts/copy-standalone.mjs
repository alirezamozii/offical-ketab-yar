import { cpSync, existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const cwd = process.cwd()
const nextDir = join(cwd, '.next')
const staticSrc = join(nextDir, 'static')
const buildIdFile = join(nextDir, 'BUILD_ID')

// Ensure .next/BUILD_ID exists (sometimes Turbopack on Windows omits the root file)
if (!existsSync(buildIdFile) && existsSync(staticSrc)) {
  const dirs = readdirSync(staticSrc, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name !== 'chunks' && d.name !== 'media' && d.name !== 'css')
    .map((d) => d.name)
  for (const dir of dirs) {
    if (existsSync(join(staticSrc, dir, '_buildManifest.js'))) {
      writeFileSync(buildIdFile, dir.trim())
      console.log(`[copy-standalone] Generated .next/BUILD_ID: ${dir}`)
      break
    }
  }
}

const staticDest = join(cwd, '.next', 'standalone', '.next', 'static')
const publicSrc = join(cwd, 'public')
const publicDest = join(cwd, '.next', 'standalone', 'public')
const standaloneRoot = join(cwd, '.next', 'standalone')

if (process.env.NEXT_STANDALONE !== 'true') {
  console.log('[copy-standalone] Skipped because NEXT_STANDALONE is not true.')
  process.exit(0)
}

try {
  if (!existsSync(standaloneRoot)) {
    throw new Error('Next.js did not create .next/standalone')
  }
  if (existsSync(staticSrc)) {
    mkdirSync(join(cwd, '.next', 'standalone', '.next'), { recursive: true })
    cpSync(staticSrc, staticDest, { recursive: true, force: true })
  }
  if (existsSync(publicSrc)) {
    cpSync(publicSrc, publicDest, { recursive: true, force: true })
  }
  console.log('[copy-standalone] Successfully copied .next/static and public to .next/standalone/')
} catch (err) {
  console.error('[copy-standalone] Copy error:', err)
  process.exitCode = 1
}
