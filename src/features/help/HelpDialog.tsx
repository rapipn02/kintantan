import { type ReactNode, useEffect, useRef } from 'react'
import { useGameStore } from '../../app/gameStore.ts'
import { TOTAL_EXHIBITS } from '../exhibits/catalog.ts'
import { HandIcon, MapIcon, QrIcon, StarIcon } from '../../shared/ui/icons.tsx'

interface Step {
  icon: ReactNode
  title: string
  text: ReactNode
}

const STEPS: Step[] = [
  {
    icon: <MapIcon className="size-7" />,
    title: 'Jelajahi peta',
    text: 'Geser dengan satu jari, cubit dengan dua jari untuk zoom.',
  },
  {
    icon: <HandIcon className="size-7" />,
    title: 'Pilih hewan',
    text: (
      <>
        Pencet hewan untuk melihat namanya. <b className="text-[#e5392f]">✗</b> belum ditemukan,{' '}
        <b className="text-[#3c9a2e]">✓</b> sudah.
      </>
    ),
  },
  {
    icon: <QrIcon className="size-7" />,
    title: 'Scan di kandang',
    text: 'Datangi kandangnya, tekan Scan Barcode, arahkan kamera ke QR di papan kandang.',
  },
  {
    icon: <StarIcon className="size-7" />,
    title: 'Kumpulkan semua',
    text: `Setiap QR membuka kartu hewan. Kumpulkan ${TOTAL_EXHIBITS} kartu!`,
  },
]

/** Petunjuk Penggunaan: tampil otomatis sekali saat pertama main, bisa dibuka lagi dari tombol. */
export function HelpDialog() {
  const open = useGameStore((state) => state.helpOpen)
  const close = useGameStore((state) => state.closeHelp)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    buttonRef.current?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, close])

  if (!open) return null

  return (
    <div
      className="safe-pad absolute inset-0 z-40 grid animate-fade-in place-items-center bg-bark/55 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="help-title"
    >
      <div className="card-surface flex max-h-full w-[min(720px,100%)] animate-pop-in flex-col overflow-hidden rounded-[28px]">
        <div className="min-h-0 overflow-y-auto px-4 pt-3.5 pb-2">
          <h2 id="help-title" className="text-xl font-bold">
            Petunjuk Penggunaan
          </h2>
          <ol className="mt-2.5 grid grid-cols-2 gap-2">
            {STEPS.map((step, index) => (
              <li key={step.title} className="flex gap-3 rounded-2xl bg-white p-2.5">
                <span className="relative grid size-11 shrink-0 place-items-center rounded-2xl bg-meadow text-forest">
                  {step.icon}
                  <span className="absolute -top-1.5 -left-1.5 grid size-5 place-items-center rounded-full bg-ember text-xs font-bold text-white">
                    {index + 1}
                  </span>
                </span>
                <span className="min-w-0">
                  <span className="block leading-tight font-bold">{step.title}</span>
                  <span className="mt-0.5 block text-sm leading-snug text-bark/80">
                    {step.text}
                  </span>
                </span>
              </li>
            ))}
          </ol>
        </div>
        <div className="flex shrink-0 items-center gap-3 px-4 pt-1 pb-3.5">
          <p className="min-w-0 flex-1 text-xs leading-snug text-bark/70">
            Kamera bermasalah? Pilih <b>Ketik kode</b> di layar scan, lalu masukkan 8 huruf di bawah
            QR. QR juga bisa discan pakai kamera bawaan HP.
          </p>
          <button ref={buttonRef} type="button" className="btn-primary shrink-0" onClick={close}>
            Mengerti, ayo jelajah!
          </button>
        </div>
      </div>
    </div>
  )
}
