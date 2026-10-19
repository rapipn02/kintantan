import scanDesign from '../../assets/desain/scan.webp'
import type { DesignBox, DesignImage } from '../../shared/ui/designImage.ts'

/**
 * Desain "Scan Barcode Hewan" (piksel identik dengan PNG desainer). Modul kecil ini ikut bundle
 * utama, jadi bingkainya bisa tampil seketika walau kode kamera (lazy) belum selesai dimuat.
 */
export const SCAN_DESIGN: DesignImage = { src: scanDesign, width: 1120, height: 913 }

/**
 * Letak gambar kamera di dalam bingkai kuning desain (px gambar asli), tanpa menutupi daun di kiri
 * bawah dan hewan-hewan di kanan. Sebelum kamera menyala, "Kode Qr" di desain tetap terlihat.
 */
export const CAMERA_BOX: DesignBox = { x0: 197, y0: 311, x1: 916, y1: 680 }
