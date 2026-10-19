/**
 * Foto asli hewan untuk kartu (opsional). Taruh foto di `assets-src/photos/<species-id>.jpg`,
 * jalankan `npm run assets`, dan kartu otomatis memakainya. Tanpa foto, kartu memotong gambar
 * hewan dari peta.
 */
const files = import.meta.glob<string>('../../assets/photos/*.webp', {
  eager: true,
  query: '?url',
  import: 'default',
})

const photosBySpecies = new Map(
  Object.entries(files).map(([path, url]) => [
    path.slice(path.lastIndexOf('/') + 1, -'.webp'.length),
    url,
  ]),
)

export function getPhoto(speciesId: string): string | undefined {
  return photosBySpecies.get(speciesId)
}
