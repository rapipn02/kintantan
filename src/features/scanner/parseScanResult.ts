/** Huruf token: huruf kecil + angka tanpa karakter yang mudah tertukar (0/o, 1/l/i). */
const TOKEN_PATTERN = /^[a-hjkmnp-z2-9]{8}$/
const LINK_PATH = /^\/s\/([^/]+)\/?$/

/**
 * Ambil token kandang dari hasil scan QR / ketikan pengunjung.
 * Menerima URL `https://<domain mana pun>/s/<token>` atau token mentah.
 */
export function extractToken(raw: string): string | null {
  const text = raw.trim()
  if (!text) return null

  const candidate = TOKEN_PATTERN.test(text.toLowerCase()) ? text : tokenFromUrl(text)
  if (!candidate) return null
  const token = candidate.toLowerCase()
  return TOKEN_PATTERN.test(token) ? token : null
}

function tokenFromUrl(text: string): string | null {
  let url: URL
  try {
    url = new URL(text)
  } catch {
    return null
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null
  return url.pathname.match(LINK_PATH)?.[1] ?? null
}

/** Path deep link `/s/<token>` (dibuka dari kamera bawaan HP atau NFC). */
export function tokenFromPath(pathname: string): string | null {
  const match = pathname.match(LINK_PATH)?.[1]
  return match ? extractToken(match) : null
}
