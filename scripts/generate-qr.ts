/**
 * Buat QR untuk tiap kandang, siap cetak.
 *
 *   QR_BASE_URL=https://domain-kamu.com npm run qr
 *
 * Hasil: print/qr/<exhibit-id>.svg + print/qr/index.html (lembar cetak A4 berisi semua QR).
 * Isi QR = https://<domain>/s/<token>, jadi bisa discan dari web maupun kamera bawaan HP.
 * URL yang sama bisa ditulis ke tag NFC (format NDEF URI).
 */
import { mkdir, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import QRCode from 'qrcode'
import { EXHIBITS, getSpecies } from '../src/features/exhibits/catalog.ts'

const ROOT = path.resolve(import.meta.dirname, '..')
const OUT = path.join(ROOT, 'print/qr')

const base = (process.argv[2] ?? process.env.QR_BASE_URL ?? '').replace(/\/+$/, '')
if (!/^https?:\/\/[^/]+$/.test(base)) {
  console.error('Isi domain web dulu, contoh: QR_BASE_URL=https://kintantan.example.com npm run qr')
  process.exit(1)
}

const escapeHtml = (text: string) =>
  text.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)

await rm(OUT, { recursive: true, force: true })
await mkdir(OUT, { recursive: true })

const cards: string[] = []
for (const exhibit of EXHIBITS) {
  const name = getSpecies(exhibit).name
  const url = `${base}/s/${exhibit.token}`
  const svg = await QRCode.toString(url, { type: 'svg', errorCorrectionLevel: 'M', margin: 2 })
  await writeFile(path.join(OUT, `${exhibit.id}.svg`), svg)
  cards.push(`
    <figure class="card">
      ${svg}
      <figcaption>
        <strong>${escapeHtml(name)}</strong>
        <span>Kode: <code>${exhibit.token.toUpperCase()}</code></span>
        <small>${escapeHtml(exhibit.id)}</small>
      </figcaption>
    </figure>`)
}

await writeFile(
  path.join(OUT, 'index.html'),
  `<!doctype html>
<html lang="id">
<meta charset="utf-8" />
<title>QR Kandang — Kintantan</title>
<style>
  @page { size: A4; margin: 12mm; }
  body { font-family: system-ui, sans-serif; margin: 0; color: #3b2a1a; }
  h1 { font-size: 16px; margin: 0 0 8px; }
  .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8mm; }
  .card { margin: 0; padding: 4mm; border: 1px dashed #bbb; border-radius: 4mm; text-align: center; break-inside: avoid; }
  .card svg { width: 100%; height: auto; }
  figcaption { display: grid; gap: 1mm; }
  strong { font-size: 15px; }
  code { font-size: 15px; letter-spacing: 2px; }
  small { color: #999; }
</style>
<h1>QR Kandang — ${escapeHtml(base)} (${EXHIBITS.length} kandang)</h1>
<div class="grid">${cards.join('')}</div>
</html>
`,
)

console.log(`${EXHIBITS.length} QR dibuat di ${path.relative(ROOT, OUT)}/ untuk ${base}`)
