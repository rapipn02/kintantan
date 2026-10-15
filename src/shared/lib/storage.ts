/** localStorage yang aman: mode privat / storage diblokir tidak membuat aplikasi error. */
export function readFlag(key: string): boolean {
  try {
    return localStorage.getItem(key) === '1'
  } catch {
    return false
  }
}

export function writeFlag(key: string) {
  try {
    localStorage.setItem(key, '1')
  } catch {
    // diabaikan
  }
}
