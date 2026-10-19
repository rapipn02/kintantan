import type { SpeciesInfo } from '../types.ts'

/**
 * Isi kartu hewan per spesies (kunci = `Species.id`). Spesies yang belum ada di sini tetap
 * punya kartu, dengan keterangan bahwa info lengkapnya segera hadir.
 */
export const SPECIES_INFO: Readonly<Record<string, SpeciesInfo>> = {
  'beruang-madu': {
    scientificName: 'Helarctos malayanus',
    origin: 'Asia Tenggara',
    diet: 'Unggas, mamalia, serangga, buah-buahan',
    temperament: 'Pemalu, suka sendiri, marah jika diganggu',
    funFact:
      'Beruang madu punya lidah sepanjang 20–25 cm yang membantunya menjilat madu dan mengambil serangga dari dalam lubang pohon!',
    taxonomy: {
      kingdom: 'Animalia',
      phylum: 'Chordata',
      class: 'Mamalia',
      order: 'Karnivora',
      family: 'Ursidae',
      genus: 'Helarctos',
      species: 'Helarctos malayanus',
    },
  },
}
