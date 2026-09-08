import { build } from 'esbuild'
import { createHash } from 'node:crypto'
import { readFileSync, existsSync } from 'node:fs'

// Rebuild after Next so navigation caches follow the deployed HTML/assets.
const hash = createHash('sha256')
for (const path of ['src/app/sw.ts', 'public/offline.html', 'public/manifest.json', '.next/BUILD_ID']) {
  if (existsSync(path)) hash.update(readFileSync(path))
}
await build({
  entryPoints: ['src/app/sw.ts'],
  outfile: 'public/sw.js',
  bundle: true,
  platform: 'browser',
  target: 'es2020',
  minify: true,
  define: {
    __BUILD_REVISION__: JSON.stringify(hash.digest('hex').slice(0, 16)),
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
})
