/**
 * Sprite hewan (opsional). Taruh PNG transparan di `assets-src/sprites/<exhibit-id>.png`,
 * jalankan `npm run assets`, dan sprite otomatis dipakai: hewan yang belum ditemukan tampil
 * sebagai siluet. Tanpa sprite, peta komposit dipakai apa adanya.
 */
const files = import.meta.glob<string>('../../assets/sprites/*.webp', {
  eager: true,
  query: '?url',
  import: 'default',
})

const spritesById = new Map(
  Object.entries(files).map(([path, url]) => [
    path.slice(path.lastIndexOf('/') + 1, -'.webp'.length),
    url,
  ]),
)

export function getSprite(exhibitId: string): string | undefined {
  return spritesById.get(exhibitId)
}
