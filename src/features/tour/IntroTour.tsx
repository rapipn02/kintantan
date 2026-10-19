import { type RefObject, useEffect, useRef, useState } from 'react'
import { useGameStore } from '../../app/gameStore.ts'
import macanBingung from '../../assets/mascot/macan-bingung.webp'
import macanSapa from '../../assets/mascot/macan-sapa.webp'
import macanTunjuk from '../../assets/mascot/macan-tunjuk.webp'
import { PawIcon } from '../../shared/ui/icons.tsx'

/** Elemen HUD yang disorot, dicari lewat atribut `data-tour` (lihat Hud.tsx). */
type TourTarget = 'score' | 'scan' | 'overview' | 'help'

interface CoachStep {
  target: TourTarget
  text: string
  mascot: string
  /** Cerminkan macan supaya menunjuk ke kiri (ke arah skor). */
  mirror?: boolean
}

const STEPS: CoachStep[] = [
  {
    target: 'score',
    text: 'Di sini tertera jumlah kandang yang sudah kamu kunjungi.',
    mascot: macanTunjuk,
    mirror: true,
  },
  {
    target: 'scan',
    text: 'Klik tombol ini untuk memindai kode QR di depanmu ya!',
    mascot: macanTunjuk,
  },
  {
    target: 'overview',
    text: 'Klik tombol ini untuk melihat keseluruhan peta ya!',
    mascot: macanTunjuk,
  },
  {
    target: 'help',
    text: 'Bingung? Klik tombol ini untuk panduan tambahan ya!',
    mascot: macanBingung,
  },
]

/** Jumlah layar tur: sambutan + tiap sorotan. */
const TOTAL = STEPS.length + 1

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
  const next = () => (index + 1 >= TOTAL ? onDone() : setIndex(index + 1))

  useEffect(() => {
    // Fokus untuk keyboard/pembaca layar, tanpa cincin fokus saat dipakai dengan sentuhan.
    buttonRef.current?.focus({ focusVisible: false })
  }, [index])

  useEffect(() => {
    // Escape = lewati tur.
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onDone()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onDone])

  const step = STEPS[index - 1]
  if (!step) return <Welcome buttonRef={buttonRef} onNext={next} />
  return <Coach key={index} step={step} index={index} buttonRef={buttonRef} onNext={next} />
}

interface ScreenProps {
  buttonRef: RefObject<HTMLButtonElement | null>
  onNext: () => void
}

function Welcome({ buttonRef, onNext }: ScreenProps) {
  return (
    <div
      className="safe-pad fixed inset-0 z-40 grid animate-fade-in place-items-center bg-black/55"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tour-welcome-title"
      aria-describedby="tour-welcome-text"
    >
      <div className="tour-welcome relative flex max-h-full w-[min(780px,100%)] animate-tour-pop items-end overflow-hidden">
        <Paws className="text-[#e9e7d8]" />
        <div className="relative min-w-0 flex-1 self-center py-[clamp(16px,4vh,40px)] pr-2 pl-[clamp(20px,4vw,48px)]">
          <h2
            id="tour-welcome-title"
            className="text-[clamp(22px,3vw,34px)] leading-tight font-bold text-[#f4a261]"
          >
            Halo Sobat!
          </h2>
          <p
            id="tour-welcome-text"
            className="mt-[clamp(6px,1.5vh,14px)] text-[clamp(17px,2.4vw,28px)] leading-snug font-bold text-[#4a3b32]"
          >
            Mau tahu apa saja hal seru yang bisa kita lakuin di sini? Yuk, intip panduannya!
          </p>
          <button
            ref={buttonRef}
            type="button"
            className="btn-lanjut mt-[clamp(12px,3vh,28px)]"
            onClick={onNext}
          >
            Lanjut
          </button>
        </div>
        <img
          src={macanSapa}
          alt=""
          className="relative mr-[clamp(8px,2vw,28px)] mb-[clamp(8px,2vh,20px)] h-[min(60vh,330px)] w-auto shrink-0 animate-mascot-in"
        />
      </div>
    </div>
  )
}

function Coach({
  step,
  index,
  buttonRef,
  onNext,
}: ScreenProps & { step: CoachStep; index: number }) {
  const rect = useTargetRect(step.target)
  const pad = 6
  return (
    <div
      className="fixed inset-0 z-40"
      role="dialog"
      aria-modal="true"
      aria-label={`Panduan ${index + 1} dari ${TOTAL}`}
      aria-describedby="tour-text"
    >
      {rect ? (
        <div
          className="tour-spotlight"
          style={{
            left: rect.left - pad,
            top: rect.top - pad,
            width: rect.width + pad * 2,
            height: rect.height + pad * 2,
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-black/45" />
      )}

      <img
        src={step.mascot}
        alt=""
        className={`tour-mascot animate-mascot-in ${step.mirror ? '-scale-x-100' : ''}`}
      />

      <div className="tour-bubble absolute top-[13%] left-[30%] w-[min(46vw,560px)] animate-tour-pop">
        <div className="tour-bubble-inner">
          <Paws className="text-[#9cc768]" />
          <p
            id="tour-text"
            className="relative text-[clamp(17px,2.3vw,30px)] leading-snug font-semibold text-white"
          >
            {step.text}
          </p>
          <div className="relative mt-[clamp(10px,2.5vh,24px)] flex justify-end">
            <button ref={buttonRef} type="button" className="btn-lanjut" onClick={onNext}>
              Lanjut
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/** Posisi elemen HUD yang disorot; diukur saat langkah dibuka dan saat layar berubah ukuran. */
function useTargetRect(target: TourTarget): DOMRect | null {
  const [rect, setRect] = useState(() => measureTarget(target))
  useEffect(() => {
    const update = () => setRect(measureTarget(target))
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [target])
  return rect
}

function measureTarget(target: TourTarget): DOMRect | null {
  return document.querySelector(`[data-tour="${target}"]`)?.getBoundingClientRect() ?? null
}

/** Jejak kaki samar sebagai hiasan latar, seperti di desain. */
function Paws({ className }: { className: string }) {
  return (
    <span aria-hidden className={`pointer-events-none absolute inset-0 ${className}`}>
      <PawIcon className="absolute top-[6%] right-[4%] size-[18%] rotate-[24deg] opacity-70" />
      <PawIcon className="absolute top-[38%] right-[30%] size-[14%] -rotate-12 opacity-60" />
      <PawIcon className="absolute bottom-[4%] left-[8%] size-[15%] rotate-[-30deg] opacity-60" />
      <PawIcon className="absolute bottom-[10%] left-[42%] size-[12%] rotate-12 opacity-50" />
    </span>
  )
}
