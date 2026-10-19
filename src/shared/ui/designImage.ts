import type { CSSProperties } from 'react'

/** Gambar desain yang dipakai apa adanya, beserta ukuran aslinya (px). */
export interface DesignImage {
  src: string
  width: number
  height: number
}

/** Kotak dalam piksel gambar desain asli (x0,y0 = kiri atas; x1,y1 = kanan bawah). */
export interface DesignBox {
  x0: number
  y0: number
  x1: number
  y1: number
}

/**
 * Posisi absolut (dalam persen) untuk elemen yang ditempel di atas gambar desain, mis. area tekan
 * transparan di atas tombol "Lanjut" yang tergambar. Ikut pas berapa pun ukuran tampil gambarnya.
 */
export function boxStyle(box: DesignBox, image: DesignImage): CSSProperties {
  return {
    position: 'absolute',
    left: `${(box.x0 / image.width) * 100}%`,
    top: `${(box.y0 / image.height) * 100}%`,
    width: `${((box.x1 - box.x0) / image.width) * 100}%`,
    height: `${((box.y1 - box.y0) / image.height) * 100}%`,
  }
}

/** Lebar tampil gambar agar utuh di layar (contain), dengan batas tambahan opsional. */
export function containWidth(image: DesignImage, maxWidth = '100vw', maxHeight = '100dvh') {
  return `min(${maxWidth}, calc(${maxHeight} * ${image.width / image.height}))`
}
