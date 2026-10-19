import sambutan from '../../assets/desain/tur-1-sambutan.webp'
import skor from '../../assets/desain/tur-2-skor.webp'
import scan from '../../assets/desain/tur-3-scan.webp'
import peta from '../../assets/desain/tur-4-peta.webp'
import panduan from '../../assets/desain/tur-5-panduan.webp'
import selesai from '../../assets/desain/tur-6-selesai.webp'
import type { DesignBox, DesignImage } from '../../shared/ui/designImage.ts'

export interface TourStep {
  image: DesignImage
  /** Letak tombol kuning yang tergambar di desain (px gambar asli). */
  button: DesignBox
  label: string
  /** Isi teks gambar, untuk pembaca layar. */
  text: string
  /** Gelap latar di luar gambar, disamakan dengan lapisan gelap di tepi gambar (alpha 0–255). */
  backdrop: number
}

/**
 * Gambar tur dipakai PERSIS seperti dari desainer (tidak diedit); yang diatur hanya letak dan
 * ukuran tampilnya. Tombol "Lanjut"/"Siap" adalah area tekan transparan di atas tombol tergambar.
 */
export const TOUR_STEPS: readonly TourStep[] = [
  {
    image: { src: sambutan, width: 1937, height: 1080 },
    button: { x0: 368, y0: 783, x1: 653, y1: 870 },
    label: 'Lanjut',
    text: 'Halo Sobat! Mau tahu apa saja hal seru yang bisa kita lakuin di sini? Yuk, intip panduannya!',
    backdrop: 138,
  },
  {
    image: { src: skor, width: 1920, height: 1080 },
    button: { x0: 1067, y0: 526, x1: 1352, y1: 613 },
    label: 'Lanjut',
    text: 'Disini tertera jumlah kandang yang sudah kamu kunjungi.',
    backdrop: 41,
  },
  {
    image: { src: scan, width: 1920, height: 1080 },
    button: { x0: 1067, y0: 541, x1: 1352, y1: 628 },
    label: 'Lanjut',
    text: 'Klik tombol ini untuk memindai kode QR di depanmu ya!',
    backdrop: 41,
  },
  {
    image: { src: peta, width: 1920, height: 1080 },
    button: { x0: 1172, y0: 488, x1: 1457, y1: 575 },
    label: 'Lanjut',
    text: 'Klik tombol ini untuk melihat keseluruhan peta ya!',
    backdrop: 41,
  },
  {
    image: { src: panduan, width: 1920, height: 1080 },
    button: { x0: 1156, y0: 496, x1: 1441, y1: 583 },
    label: 'Lanjut',
    text: 'Bingung? Klik tombol ini untuk panduan tambahan ya!',
    backdrop: 41,
  },
  {
    image: { src: selesai, width: 1920, height: 1080 },
    button: { x0: 1149, y0: 659, x1: 1434, y1: 746 },
    label: 'Siap',
    text: 'Selesai! Apakah kamu siap berpetualang sobat?',
    backdrop: 41,
  },
]
