import { useEffect } from 'react'
import { useGameStore } from '../../app/gameStore.ts'
import berhasil from '../../assets/desain/scan-berhasil.webp'
import { containWidth, type DesignImage } from '../../shared/ui/designImage.ts'

/** Lama popup tampil sebelum otomatis lanjut ke kartu hewan. */
const DURATION_MS = 1600

/** Desain "Pindai berhasil", dipakai apa adanya. */
const DESIGN: DesignImage = { src: berhasil, width: 856, height: 556 }

/** Popup "Pindai berhasil" (singa bersorak) sesaat setelah QR kandang berhasil discan. */
export function ScanSuccess() {
  const celebrating = useGameStore((state) => state.reveal?.celebrate === true)
  const endCelebrate = useGameStore((state) => state.endCelebrate)

  useEffect(() => {
    if (!celebrating) return
    const timer = window.setTimeout(endCelebrate, DURATION_MS)
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === 'Escape' || event.key === ' ') endCelebrate()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('keydown', onKey)
    }
  }, [celebrating, endCelebrate])

  if (!celebrating) return null

  return (
    <div
      className="safe-pad absolute inset-0 z-40 grid animate-fade-in place-items-center bg-black/35"
      role="status"
      onClick={endCelebrate}
    >
      <img
        src={DESIGN.src}
        alt="Pindai berhasil"
        className="animate-tour-pop select-none"
        style={{ width: containWidth(DESIGN, 'min(100%, 640px)', 'calc(100dvh - 20px)') }}
        draggable={false}
      />
    </div>
  )
}
