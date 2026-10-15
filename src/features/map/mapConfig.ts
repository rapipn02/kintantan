import mapUrl from '../../assets/map/base.png'
import mapMeta from '../../assets/map/base.meta.json'

/** Peta dasar (PNG asli apa adanya). Ganti lewat `assets-src/map.png` lalu `npm run assets`. */
export const MAP = {
  src: mapUrl,
  width: mapMeta.width,
  height: mapMeta.height,
  placeholder: mapMeta.lqip,
} as const

export const CAMERA = {
  /** Zoom maksimum relatif terhadap tampilan "seluruh peta". */
  maxZoom: 4,
  /**
   * Batas ketajaman: zoom berhenti saat 1 piksel gambar peta ≈ 2.5 piksel fisik layar,
   * jadi zoom maksimum otomatis mengikuti resolusi gambar dan DPR layar.
   */
  maxPhysicalPixelsPerImagePixel: 2.5,
  /** Zoom saat kamera terbang ke Titik Awal sesudah layar pembuka. */
  startZoom: 1.8,
  /** Zoom saat terbang ke hewan (mis. dari link QR). */
  focusZoom: 2.4,
  /** Faktor zoom double-tap. */
  doubleTapFactor: 2,
  /** Titik Awal (pintu masuk) dalam koordinat ternormalisasi peta. */
  startPoint: { x: 0.06, y: 0.93 },
} as const

/** Lebar panel info hewan di sisi kanan (harus sama dengan CSS `--panel-width`). */
export function panelWidth(viewportWidth: number): number {
  return Math.min(340, Math.round(viewportWidth * 0.42))
}
