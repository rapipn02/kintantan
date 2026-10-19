/**
 * Pipeline aset: mengubah file mentah dari Figma (folder `assets-src/`) menjadi file siap pakai.
 *
 *   assets-src/map.png                   -> src/assets/map/base.webp (WebP lossless, piksel identik)
 *                                           + base.meta.json (ukuran + LQIP)
 *   assets-src/sprites/<exhibit-id>.png  -> src/assets/sprites/<exhibit-id>.webp
 *   assets-src/desain/*.png              -> src/assets/desain/*.webp (WebP lossless, piksel identik:
 *                                           tur, scanner, popup berhasil, kartu hewan)
 *   assets-src/suara/<species-id>.mp3    -> src/assets/suara/<species-id>.mp3 (suara hewan, apa adanya)
 *   assets-src/photos/<species-id>.jpg   -> src/assets/photos/<species-id>.webp (foto di kartu hewan)
 *   assets-src/icon.svg                  -> public/icons/* (PWA, favicon, apple-touch-icon)
 *
 * Jalankan: npm run assets
 */
import { copyFile, mkdir, readdir, rm, stat, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'

const ROOT = path.resolve(import.meta.dirname, '..')
const SRC = path.join(ROOT, 'assets-src')
const OUT_MAP = path.join(ROOT, 'src/assets/map')
const OUT_SPRITES = path.join(ROOT, 'src/assets/sprites')
const OUT_ICONS = path.join(ROOT, 'public/icons')

/** Di bawah lebar ini peta mulai terlihat buram saat di-zoom di layar Retina. */
const MIN_MAP_WIDTH = 3000
const MAX_SPRITE_SIZE = 512
const MAX_PHOTO_SIZE = 900
const IMAGE_EXT = /\.(webp|png|jpe?g|avif)$/i

/**
 * Peta dipakai PERSIS seperti PNG asli dari desainer: disalin byte-per-byte, tanpa kompres,
 * resize, atau konversi. Yang dibuat hanya meta (ukuran) dan LQIP mini terpisah.
 */
/**
 * Simpan gambar sebagai WebP lossless yang PIKSEL-IDENTIK dengan aslinya (termasuk warna di area
 * transparan, lewat `exact`), lalu buktikan: dekode ulang dan bandingkan seluruh piksel. Kalau ada
 * satu piksel pun yang beda, pipeline berhenti. Hanya format file yang berubah, bukan gambarnya.
 */
async function toLosslessWebp(source: string, target: string) {
  const webp = await sharp(source).webp({ lossless: true, exact: true, effort: 6 }).toBuffer()
  const [original, decoded] = await Promise.all([
    sharp(source).ensureAlpha().raw().toBuffer(),
    sharp(webp).ensureAlpha().raw().toBuffer(),
  ])
  if (Buffer.compare(original, decoded) !== 0) {
    throw new Error(`${path.basename(source)}: hasil WebP tidak piksel-identik, dibatalkan`)
  }
  await writeFile(target, webp)
  return { before: (await stat(source)).size, after: webp.length }
}

const mib = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(2)} MiB`

/** Peta: PNG asli dari desainer -> WebP lossless piksel-identik + meta (ukuran & LQIP). */
async function buildMap() {
  const source = path.join(SRC, 'map.png')
  if (!existsSync(source)) throw new Error('assets-src/map.png tidak ditemukan')

  await mkdir(OUT_MAP, { recursive: true })
  for (const f of await readdir(OUT_MAP)) {
    if (/^base\.(webp|png|jpe?g|avif)$/i.test(f)) await rm(path.join(OUT_MAP, f))
  }
  const size = await toLosslessWebp(source, path.join(OUT_MAP, 'base.webp'))

  const { width = 0, height = 0 } = await sharp(source).metadata()
  if (width < MIN_MAP_WIDTH) {
    console.warn(
      `PERINGATAN: lebar peta hanya ${width} px (< ${MIN_MAP_WIDTH} px), peta akan terlihat ` +
        'buram saat di-zoom. Export ulang dari Figma dengan resolusi lebih besar.',
    )
  }

  // LQIP: versi mini yang di-inline sebagai data URI, tampil instan sebelum peta penuh selesai.
  const lqip = await sharp(source).resize({ width: 48 }).webp({ quality: 40 }).toBuffer()

  const meta = { width, height, lqip: `data:image/webp;base64,${lqip.toString('base64')}` }
  await writeFile(path.join(OUT_MAP, 'base.meta.json'), JSON.stringify(meta, null, 2) + '\n')
  console.log(
    `map: ${width}x${height}, ${mib(size.before)} -> ${mib(size.after)} (WebP lossless, piksel identik)`,
  )
}

/** Gambar desain (tur, scanner, kartu): WebP lossless piksel-identik, tidak diedit sama sekali. */
async function buildDesigns() {
  const dir = path.join(SRC, 'desain')
  if (!existsSync(dir)) return
  const out = path.join(ROOT, 'src/assets/desain')
  await rm(out, { recursive: true, force: true })
  await mkdir(out, { recursive: true })
  let before = 0
  let after = 0
  const files = (await readdir(dir)).filter((f) => IMAGE_EXT.test(f))
  for (const file of files) {
    const size = await toLosslessWebp(
      path.join(dir, file),
      path.join(out, file.replace(IMAGE_EXT, '.webp')),
    )
    before += size.before
    after += size.after
  }
  console.log(
    `desain: ${files.length}, ${mib(before)} -> ${mib(after)} (WebP lossless, piksel identik)`,
  )
}

async function buildSprites() {
  const dir = path.join(SRC, 'sprites')
  if (!existsSync(dir)) return
  await mkdir(OUT_SPRITES, { recursive: true })

  // Hapus sprite lama agar sprite yang dihapus dari assets-src tidak tertinggal.
  for (const f of await readdir(OUT_SPRITES)) {
    if (f.endsWith('.webp')) await rm(path.join(OUT_SPRITES, f))
  }

  const sprites = (await readdir(dir)).filter((f) => IMAGE_EXT.test(f))
  for (const file of sprites) {
    const id = file.replace(IMAGE_EXT, '')
    await sharp(path.join(dir, file))
      .resize({
        width: MAX_SPRITE_SIZE,
        height: MAX_SPRITE_SIZE,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: 90, alphaQuality: 90, effort: 6 })
      .toFile(path.join(OUT_SPRITES, `${id}.webp`))
  }
  console.log(`sprites: ${sprites.length}`)
}

/** Konversi satu folder gambar ke WebP (folder output dibersihkan dulu). */
async function buildFolder(name: string, maxSize: { width?: number; height?: number }) {
  const dir = path.join(SRC, name)
  if (!existsSync(dir)) return
  const out = path.join(ROOT, 'src/assets', name)
  await mkdir(out, { recursive: true })
  for (const f of await readdir(out)) {
    if (f.endsWith('.webp')) await rm(path.join(out, f))
  }

  const files = (await readdir(dir)).filter((f) => IMAGE_EXT.test(f))
  for (const file of files) {
    await sharp(path.join(dir, file))
      .resize({ ...maxSize, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 90, alphaQuality: 95, effort: 6 })
      .toFile(path.join(out, file.replace(IMAGE_EXT, '.webp')))
  }
  console.log(`${name}: ${files.length}`)
}

/**
 * Salin satu folder apa adanya (tanpa diubah sedikit pun), mis. gambar desain dan suara hewan.
 * Folder output dibersihkan dulu supaya file yang dihapus tidak tertinggal.
 */
async function copyAsIs(name: string, ext: RegExp) {
  const dir = path.join(SRC, name)
  if (!existsSync(dir)) return
  const out = path.join(ROOT, 'src/assets', name)
  await rm(out, { recursive: true, force: true })
  await mkdir(out, { recursive: true })
  const files = (await readdir(dir)).filter((f) => ext.test(f))
  for (const file of files) await copyFile(path.join(dir, file), path.join(out, file))
  console.log(`${name}: ${files.length} (apa adanya)`)
}

async function buildIcons() {
  const svg = path.join(SRC, 'icon.svg')
  await mkdir(OUT_ICONS, { recursive: true })
  const render = (size: number, file: string, padding = 0) =>
    sharp(svg)
      .resize(size - padding * 2, size - padding * 2)
      .extend({
        top: padding,
        bottom: padding,
        left: padding,
        right: padding,
        background: '#8cc063',
      })
      .png({ compressionLevel: 9 })
      .toFile(path.join(OUT_ICONS, file))

  await render(192, 'icon-192.png')
  await render(512, 'icon-512.png')
  await render(512, 'maskable-512.png', 56)
  await render(180, 'apple-touch-icon.png')
  await copyFile(svg, path.join(OUT_ICONS, 'favicon.svg'))
  console.log('icons: ok')
}

await buildMap()
await buildSprites()
await buildDesigns()
await copyAsIs('suara', /\.(mp3|m4a|ogg|wav)$/i)
await buildFolder('photos', { width: MAX_PHOTO_SIZE, height: MAX_PHOTO_SIZE })
await buildIcons()
