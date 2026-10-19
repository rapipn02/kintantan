import { useEffect } from 'react'
import { useGameStore } from '../../app/gameStore.ts'
import singaBerhasil from '../../assets/decor/singa-berhasil.webp'

/** Lama popup tampil sebelum otomatis lanjut ke kartu hewan. */
const DURATION_MS = 1600

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
      <div className="success-frame w-[min(560px,92vw)] animate-tour-pop">
        <div className="success-card flex items-center justify-between gap-2 py-[clamp(10px,2vh,20px)] pr-[clamp(10px,2vw,24px)] pl-[clamp(24px,5vw,64px)]">
          <p className="text-[clamp(32px,5.2vw,58px)] leading-[1.1] font-medium text-white">
            Pindai <br />
            berhasil
          </p>
          <img
            src={singaBerhasil}
            alt=""
            className="h-[min(30vh,190px)] w-auto shrink-0 animate-twinkle"
          />
        </div>
      </div>
    </div>
  )
}
