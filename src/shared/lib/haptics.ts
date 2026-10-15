/** Getar singkat (Android). iOS Safari tidak mendukung, jadi diam-diam diabaikan. */
export function vibrate(pattern: number | number[]) {
  // Browser memblokir getar sebelum pengguna berinteraksi (mis. saat dibuka dari link QR).
  if (!navigator.userActivation?.hasBeenActive) return
  try {
    navigator.vibrate?.(pattern)
  } catch {
    // tidak didukung
  }
}
