import kartuBeruangMadu from '../../assets/desain/kartu-beruang-madu.png'
import taksonomiBeruangMadu from '../../assets/desain/taksonomi-beruang-madu.png'
import type { DesignBox, DesignImage } from '../../shared/ui/designImage.ts'

/** Kartu hewan dari desainer, dipakai apa adanya (tidak diedit). */
export interface CardDesign {
  card: DesignImage
  /** Panel taksonomi yang muncul di samping kartu. */
  taxonomy: DesignImage
  /** Letak tombol speaker & bar "Taksonomi" yang tergambar di kartu (px gambar asli). */
  speaker: DesignBox
  taxonomyButton: DesignBox
}

/**
 * Desain kartu per spesies (kunci = `Species.id`). Taruh PNG-nya di `assets-src/desain/`,
 * jalankan `npm run assets`, lalu daftarkan di sini. Spesies tanpa desain memakai kartu bawaan.
 */
export const CARD_DESIGNS: Readonly<Record<string, CardDesign>> = {
  'beruang-madu': {
    card: { src: kartuBeruangMadu, width: 582, height: 985 },
    taxonomy: { src: taksonomiBeruangMadu, width: 298, height: 915 },
    speaker: { x0: 474, y0: 20, x1: 529, y1: 79 },
    taxonomyButton: { x0: 57, y0: 820, x1: 523, y1: 856 },
  },
}
