import { whenIdle } from '../../shared/lib/preload.ts'

export interface QrDetector {
  detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue: string }>>
}

interface NativeBarcodeDetector {
  new (options: { formats: string[] }): QrDetector
  getSupportedFormats: () => Promise<string[]>
}

let pending: Promise<QrDetector> | null = null

/**
 * Detektor QR: pakai BarcodeDetector bawaan browser bila mendukung QR (Android Chrome),
 * kalau tidak (iOS Safari) pakai ZXing WebAssembly yang di-host sendiri, bukan dari CDN,
 * supaya tetap jalan offline dan ikut cache Cloudflare.
 */
export function getQrDetector(): Promise<QrDetector> {
  pending ??= loadDetector().catch((error: unknown) => {
    pending = null
    throw error
  })
  return pending
}

async function loadDetector(): Promise<QrDetector> {
  const native = (globalThis as { BarcodeDetector?: NativeBarcodeDetector }).BarcodeDetector
  if (native) {
    try {
      const formats = await native.getSupportedFormats()
      if (formats.includes('qr_code')) return new native({ formats: ['qr_code'] })
    } catch {
      // lanjut ke ZXing
    }
  }

  const [{ BarcodeDetector, prepareZXingModule }, { default: wasmUrl }] = await Promise.all([
    import('barcode-detector/ponyfill'),
    import('zxing-wasm/reader/zxing_reader.wasm?url'),
  ])
  await prepareZXingModule({
    overrides: {
      locateFile: (path: string, prefix: string) =>
        path.endsWith('.wasm') ? wasmUrl : prefix + path,
    },
    fireImmediately: true,
  })
  return new BarcodeDetector({ formats: ['qr_code'] })
}

/** Siapkan detektor di waktu senggang supaya kamera langsung siap (dan wasm ter-cache untuk offline). */
export function warmUpQrDetector() {
  whenIdle(() => void getQrDetector().catch(() => undefined), 5000)
}
