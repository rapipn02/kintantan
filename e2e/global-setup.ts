import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import QRCode from 'qrcode'
import sharp from 'sharp'
import { EXHIBITS } from '../src/features/exhibits/catalog.ts'

const WIDTH = 640
const HEIGHT = 480
const FRAMES = 15

/**
 * Buat video palsu (Y4M) berisi QR kandang singa untuk kamera palsu Chromium,
 * supaya alur scan diuji dari kamera sampai kartu muncul.
 */
export default async function globalSetup() {
  const lion = EXHIBITS.find((e) => e.id === 'singa')
  if (!lion) throw new Error('exhibit singa tidak ada')

  const qr = await QRCode.toBuffer(`https://kintantan.example.com/s/${lion.token}`, {
    margin: 4,
    width: 360,
  })
  const data = await sharp({
    create: { width: WIDTH, height: HEIGHT, channels: 3, background: '#ffffff' },
  })
    .composite([{ input: qr, gravity: 'center' }])
    .removeAlpha()
    .raw()
    .toBuffer()

  const frame = rgbToI420(data, WIDTH, HEIGHT)
  const header = Buffer.from(`YUV4MPEG2 W${WIDTH} H${HEIGHT} F15:1 Ip A1:1 C420jpeg\n`)
  const frameHeader = Buffer.from('FRAME\n')
  const video = Buffer.concat([
    header,
    ...Array.from({ length: FRAMES }, () => [frameHeader, frame]).flat(),
  ])

  const dir = path.join(import.meta.dirname, '.fixtures')
  await mkdir(dir, { recursive: true })
  await writeFile(path.join(dir, 'qr-singa.y4m'), video)
}

function rgbToI420(rgb: Buffer, width: number, height: number): Buffer {
  const ySize = width * height
  const out = Buffer.alloc(ySize * 1.5)
  const uOffset = ySize
  const vOffset = ySize + ySize / 4
  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const i = (row * width + col) * 3
      const r = rgb[i]!
      const g = rgb[i + 1]!
      const b = rgb[i + 2]!
      out[row * width + col] = Math.round(0.299 * r + 0.587 * g + 0.114 * b)
      if (row % 2 === 0 && col % 2 === 0) {
        const c = (row / 2) * (width / 2) + col / 2
        out[uOffset + c] = Math.round(128 - 0.168736 * r - 0.331264 * g + 0.5 * b)
        out[vOffset + c] = Math.round(128 + 0.5 * r - 0.418688 * g - 0.081312 * b)
      }
    }
  }
  return out
}
