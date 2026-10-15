/**
 * Mode "game": layar penuh + kunci landscape. Hanya berhasil di browser yang mendukung
 * (Android Chrome); iPhone mengabaikannya, jadi overlay "putar HP" tetap jadi pengaman.
 * Harus dipanggil dari gesture pengguna (tap tombol).
 */
export async function enterImmersiveMode() {
  const isTouch = window.matchMedia('(pointer: coarse)').matches
  if (!isTouch) return

  const root = document.documentElement
  try {
    if (document.fullscreenEnabled && !document.fullscreenElement) {
      await root.requestFullscreen({ navigationUI: 'hide' })
    }
  } catch {
    // ditolak / tidak didukung
  }
  try {
    // Belum semua browser punya `lock` (Safari iOS), jadi dicek dulu.
    const orientation = screen.orientation as Partial<ScreenOrientation> | undefined
    await orientation?.lock?.('landscape')
  } catch {
    // tidak didukung (mis. iOS) atau tidak sedang fullscreen
  }
}
