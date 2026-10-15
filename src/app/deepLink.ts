import { tokenFromPath } from '../features/scanner/parseScanResult.ts'

/**
 * Baca deep link `/s/<token>` (QR discan pakai kamera bawaan HP, atau tag NFC),
 * lalu bersihkan URL ke `/` supaya refresh tidak memproses ulang.
 * Mengembalikan `undefined` bila bukan deep link, `null` bila path-nya deep link tapi token tidak sah.
 */
export function consumeDeepLink(): string | null | undefined {
  const { pathname } = window.location
  if (!pathname.startsWith('/s/')) return undefined
  window.history.replaceState(null, '', '/')
  return tokenFromPath(pathname)
}
