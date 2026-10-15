/** Kotak dalam koordinat ternormalisasi (0–1) relatif terhadap ukuran peta, tidak tergantung resolusi export. */
export interface NormalizedBox {
  x: number
  y: number
  w: number
  h: number
}

export type SpeciesGroup = 'mamalia' | 'burung' | 'reptil' | 'ikan'

/** Jenis hewan. Informasi lengkap (habitat, makanan, fakta) akan ditambahkan di fitur berikutnya. */
export interface Species {
  id: string
  name: string
  group: SpeciesGroup
}

/**
 * Satu ikon hewan di peta = satu kandang = satu QR unik.
 * Beberapa exhibit boleh menunjuk spesies yang sama (mis. 3 rusa totol).
 */
export interface Exhibit {
  id: string
  speciesId: string
  /** Kode acak di QR/NFC kandang: https://<domain>/s/<token>. Huruf kecil, tanpa karakter ambigu. */
  token: string
  box: NormalizedBox
}
