/** Kotak dalam koordinat ternormalisasi (0–1) relatif terhadap ukuran peta, tidak tergantung resolusi export. */
export interface NormalizedBox {
  x: number
  y: number
  w: number
  h: number
}

export type SpeciesGroup = 'mamalia' | 'burung' | 'reptil' | 'ikan'

/** Jenis hewan. Isi kartu hewan ada terpisah di `data/speciesInfo.ts`. */
export interface Species {
  id: string
  name: string
  group: SpeciesGroup
}

export interface Taxonomy {
  kingdom: string
  phylum: string
  class: string
  order: string
  family: string
  genus: string
  species: string
}

/** Isi kartu hewan (sesuai desain kartu Beruang Madu). */
export interface SpeciesInfo {
  scientificName: string
  /** Asal / persebaran alami. */
  origin: string
  diet: string
  /** Sifat / perilaku. */
  temperament: string
  funFact: string
  taxonomy: Taxonomy
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
