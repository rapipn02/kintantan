import { useEffect, useRef, useState } from 'react'
import { useGameStore } from '../../app/gameStore.ts'
import { preloadImage } from '../../shared/lib/preload.ts'
import { boxStyle, containWidth } from '../../shared/ui/designImage.ts'
import { TOUR_STEPS as STEPS } from './tourSteps.ts'

/** Tur pengenalan dengan macan pemandu: tampil otomatis sekali saat pertama main. */
export function IntroTour() {
  const open = useGameStore((state) => state.tourOpen)
  const close = useGameStore((state) => state.closeTour)
  if (!open) return null
  return <Tour onDone={close} />
}

function Tour({ onDone }: { onDone: () => void }) {
  const [index, setIndex] = useState(0)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const step = STEPS[index]
  const next = () => (index + 1 >= STEPS.length ? onDone() : setIndex(index + 1))

  useEffect(() => {
    // Fokus untuk keyboard/pembaca layar, tanpa cincin fokus saat dipakai dengan sentuhan.
    buttonRef.current?.focus({ focusVisible: false })
    // Siapkan gambar langkah berikutnya supaya ganti langkah tanpa kedip.
    const following = STEPS[index + 1]
    if (following) void preloadImage(following.image.src)
  }, [index])

  useEffect(() => {
    // Escape = lewati tur.
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onDone()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onDone])

  if (!step) return null
  return (
    <div
      className="fixed inset-0 z-40 grid animate-fade-in place-items-center"
      style={{ backgroundColor: `rgb(0 0 0 / ${step.backdrop / 255})` }}
      role="dialog"
      aria-modal="true"
      aria-label={`Panduan ${index + 1} dari ${STEPS.length}`}
      aria-describedby="tour-text"
    >
      <div
        key={index}
        className="relative animate-fade-in"
        style={{
          width: containWidth(step.image),
          aspectRatio: `${step.image.width} / ${step.image.height}`,
        }}
      >
        <img src={step.image.src} alt="" className="size-full select-none" draggable={false} />
        <p id="tour-text" className="sr-only">
          {step.text}
        </p>
        <button
          ref={buttonRef}
          type="button"
          className="design-hotspot rounded-[18%/40%]"
          style={boxStyle(step.button, step.image)}
          onClick={next}
        >
          <span className="sr-only">{step.label}</span>
        </button>
      </div>
    </div>
  )
}
