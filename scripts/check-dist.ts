/**
 * Pemeriksaan hasil build sebelum deploy:
 *  - dist/ hanya berisi file yang memang dipakai aplikasi (mis. PNG desain asli yang tertinggal di
 *    public/ ikut tersalin ke dist dan ikut di-precache -> pengunjung mengunduh belasan MB sia-sia);
 *  - ringkasan ukuran unduhan pertama & precache offline.
 *
 * Jalankan: npm run check:dist (otomatis dijalankan oleh npm run deploy).
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'

const DIST = path.resolve(process.argv[2] ?? path.join(import.meta.dirname, '../dist'))

/** File/folder yang boleh ada di dist/. */
const ALLOWED = [
  /^index\.html$/,
  /^sw\.js$/,
  /^registerSW\.js$/,
  /^workbox-[\w-]+\.js$/,
  /^manifest\.webmanifest$/,
  /^_headers$/,
  /^icons\/[\w.-]+$/,
  /^assets\/[\w.-]+$/,
]

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    return entry.isDirectory() ? walk(full) : [path.relative(DIST, full)]
  })
}

const files = walk(DIST)
const unexpected = files.filter((file) => !ALLOWED.some((re) => re.test(file)))
const size = (file: string) => statSync(path.join(DIST, file)).size
const mib = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(2)} MiB`

if (unexpected.length) {
  console.error(
    '\nBUILD DITOLAK: ada file yang tidak dipakai aplikasi di dist/ (tersalin dari public/):',
  )
  for (const file of unexpected) console.error(`  - ${file} (${mib(size(file))})`)
  console.error(
    '\nPindahkan file-file itu keluar dari public/ (mis. ke folder desain-asli/), lalu build ulang.\n' +
      'Gambar desain yang dipakai aplikasi ada di assets-src/ dan sudah diproses otomatis.\n',
  )
  process.exit(1)
}

// Unduhan pertama: index.html + semua yang dirujuk langsung (JS/CSS/preload peta).
const html = readFileSync(path.join(DIST, 'index.html'), 'utf8')
const firstLoad = [
  'index.html',
  ...[...html.matchAll(/(?:src|href)="\/([^"]+)"/g)].map((m) => m[1]!),
].filter((file, i, all) => all.indexOf(file) === i && files.includes(file))
const firstLoadBytes = firstLoad.reduce((sum, file) => sum + size(file), 0)

const total = files.reduce((sum, file) => sum + size(file), 0)
const largest = [...files].sort((a, b) => size(b) - size(a)).slice(0, 5)

console.log(`dist/ OK: ${files.length} file, total ${mib(total)}`)
console.log(`Unduhan pertama (sebelum gzip): ${mib(firstLoadBytes)} -> ${firstLoad.join(', ')}`)
// Precache service worker: semua yang disimpan untuk offline (diunduh di latar belakang).
const sw = files.includes('sw.js') ? readFileSync(path.join(DIST, 'sw.js'), 'utf8') : ''
const precached = [...sw.matchAll(/url:"([^"]+)"/g)]
  .map((m) => m[1]!)
  .filter((file, i, all) => all.indexOf(file) === i && files.includes(file))
console.log(
  `Precache offline: ${precached.length} file, ${mib(precached.reduce((sum, f) => sum + size(f), 0))}`,
)
console.log('File terbesar:')
for (const file of largest) console.log(`  ${mib(size(file)).padStart(10)}  ${file}`)
