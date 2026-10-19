/**
 * Unduh + decode gambar lebih awal supaya saat dibutuhkan langsung tampil (tanpa kedip kosong).
 * Elemen <img> disimpan agar hasil decode tetap di memori cache browser.
 */
const images = new Map<string, Promise<void>>()
const keep: HTMLImageElement[] = []

export function preloadImage(url: string): Promise<void> {
  let ready = images.get(url)
  if (!ready) {
    const img = new Image()
    img.decoding = 'async'
    img.src = url
    keep.push(img)
    ready = img.decode().catch(() => undefined)
    images.set(url, ready)
  }
  return ready
}

/** Jalankan saat browser senggang, supaya tidak berebut jaringan/CPU dengan yang sedang tampil. */
export function whenIdle(task: () => void, timeout = 3000) {
  // Safari belum punya requestIdleCallback.
  if (typeof window.requestIdleCallback === 'function')
    window.requestIdleCallback(task, { timeout })
  else setTimeout(task, 300)
}

/** Preload berurutan (satu per satu) saat senggang: yang paling dulu dibutuhkan diunduh duluan. */
export function preloadInOrder(urls: readonly string[]) {
  whenIdle(() => {
    void urls.reduce<Promise<void>>(
      (prev, url) => prev.then(() => preloadImage(url)),
      Promise.resolve(),
    )
  })
}
