/**
 * Cegah zoom bawaan browser (iOS mengabaikan `user-scalable=no`) dan ctrl+scroll di desktop,
 * supaya hanya peta yang di-zoom, bukan halamannya.
 */
export function installViewportGuards() {
  const prevent = (event: Event) => event.preventDefault()
  document.addEventListener('gesturestart', prevent, { passive: false })
  document.addEventListener('gesturechange', prevent, { passive: false })
  document.addEventListener(
    'wheel',
    (event) => {
      if (event.ctrlKey) event.preventDefault()
    },
    { passive: false },
  )
  document.addEventListener('contextmenu', (event) => {
    if (!(event.target instanceof HTMLInputElement)) event.preventDefault()
  })
}
