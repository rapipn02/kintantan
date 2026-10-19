import berhasil from '../assets/desain/scan-berhasil.webp'
import { CARD_DESIGNS } from '../features/discovery/cardDesigns.ts'
import { SCAN_DESIGN } from '../features/scanner/scannerDesign.ts'
import { TOUR_STEPS } from '../features/tour/tourSteps.ts'
import { preloadImage, preloadInOrder } from '../shared/lib/preload.ts'

/**
 * Urutan unduh gambar supaya tiap layar tampil seketika, tanpa berebut jaringan dengan peta:
 *  1. layar pembuka  : peta (prioritas tinggi) + gambar tur pertama (bila tur akan tampil)
 *  2. sesudah mulai  : sisa gambar tur -> scanner -> popup berhasil -> kartu hewan
 * Service worker juga menyimpan semuanya untuk offline, tapi baru setelah halaman selesai dimuat.
 */
export function preloadBeforeStart(tourWillShow: boolean) {
  const first = TOUR_STEPS[0]
  if (tourWillShow && first) preloadInOrder([first.image.src])
}

export function preloadAfterStart(tourOpen: boolean) {
  const cards = Object.values(CARD_DESIGNS).flatMap((d) => [d.card.src, d.taxonomy.src])
  preloadInOrder([
    ...(tourOpen ? TOUR_STEPS.slice(1).map((step) => step.image.src) : []),
    SCAN_DESIGN.src,
    berhasil,
    ...cards,
  ])
}

/** Dipanggil saat jari menyentuh tombol scan: pastikan gambar scanner siap sebelum layar dibuka. */
export function prepareScannerImage() {
  void preloadImage(SCAN_DESIGN.src)
}
