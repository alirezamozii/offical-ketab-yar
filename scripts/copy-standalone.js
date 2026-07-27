import { cpSync, existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

const cwd = process.cwd()
const staticSrc = join(cwd, '.next', 'static')
const staticDest = join(cwd, '.next', 'standalone', '.next', 'static')
const publicSrc = join(cwd, 'public')
const publicDest = join(cwd, '.next', 'standalone', 'public')

try {
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
}
