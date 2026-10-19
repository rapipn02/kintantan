/**
 * Suara asli hewan untuk tombol speaker di kartu (opsional). Taruh file di
 * `assets-src/suara/<species-id>.mp3`, jalankan `npm run assets`, dan kartu otomatis memakainya.
 * Tanpa file suara, tombol speaker membacakan isi kartu.
 */
const files = import.meta.glob<string>('../../assets/suara/*.mp3', {
  eager: true,
  query: '?url',
  import: 'default',
})

const soundsBySpecies = new Map(
  Object.entries(files).map(([path, url]) => [
    path.slice(path.lastIndexOf('/') + 1, -'.mp3'.length),
    url,
  ]),
)

export function getSound(speciesId: string): string | undefined {
  return soundsBySpecies.get(speciesId)
}
