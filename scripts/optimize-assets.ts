/**
 * Pipeline aset: mengubah file mentah dari Figma (folder `assets-src/`) menjadi file siap pakai.
 *
 *   assets-src/map.(webp|png|jpg)        -> src/assets/map/base.webp + base.meta.json (ukuran + LQIP)
 *   assets-src/sprites/<exhibit-id>.png  -> src/assets/sprites/<exhibit-id>.webp
 *   assets-src/icon.svg                  -> public/icons/* (PWA, favicon, apple-touch-icon)
 *
 * Jalankan: npm run assets
 */
import { copyFile, mkdir, readdir, rm, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'

const ROOT = path.resolve(import.meta.dirname, '..')
const SRC = path.join(ROOT, 'assets-src')
const OUT_MAP = path.join(ROOT, 'src/assets/map')
const OUT_SPRITES = path.join(ROOT, 'src/assets/sprites')
const OUT_ICONS = path.join(ROOT, 'public/icons')

/** Batas aman tekstur di iOS Safari; gambar lebih besar berisiko membuat tab crash. */
const MAX_MAP_WIDTH = 4096
const MAX_SPRITE_SIZE = 512
const IMAGE_EXT = /\.(webp|png|jpe?g|avif)$/i

async function buildMap() {
  const files = await readdir(SRC)
  const source = files.find((f) => /^map\./i.test(f) && IMAGE_EXT.test(f))
  if (!source) throw new Error('assets-src/map.(webp|png|jpg) tidak ditemukan')

  await mkdir(OUT_MAP, { recursive: true })
  const input = sharp(path.join(SRC, source))
  const { width = 0 } = await input.metadata()
  const pipeline = width > MAX_MAP_WIDTH ? input.resize({ width: MAX_MAP_WIDTH }) : input

  const info = await pipeline
    .clone()
    .webp({ quality: 88, effort: 6, smartSubsample: true })
    .toFile(path.join(OUT_MAP, 'base.webp'))

  // LQIP: versi mini yang di-inline sebagai data URI, tampil instan sebelum peta penuh selesai.
  const lqip = await pipeline.clone().resize({ width: 48 }).webp({ quality: 40 }).toBuffer()

  const meta = {
    width: info.width,
    height: info.height,
    lqip: `data:image/webp;base64,${lqip.toString('base64')}`,
  }
  await writeFile(path.join(OUT_MAP, 'base.meta.json'), JSON.stringify(meta, null, 2) + '\n')
  console.log(`map: ${info.width}x${info.height}, ${(info.size / 1024).toFixed(0)} KB`)
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
await buildIcons()
