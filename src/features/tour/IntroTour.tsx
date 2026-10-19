import { useEffect, useRef, useState } from 'react'
import { useGameStore } from '../../app/gameStore.ts'
import sambutan from '../../assets/desain/tur-1-sambutan.png'
import skor from '../../assets/desain/tur-2-skor.png'
import scan from '../../assets/desain/tur-3-scan.png'
import peta from '../../assets/desain/tur-4-peta.png'
import panduan from '../../assets/desain/tur-5-panduan.png'
import selesai from '../../assets/desain/tur-6-selesai.png'
import {
  boxStyle,
  containWidth,
  type DesignBox,
  type DesignImage,
} from '../../shared/ui/designImage.ts'

interface Step {
  image: DesignImage
  /** Letak tombol kuning yang tergambar di desain (px gambar asli). */
  button: DesignBox
  label: string
  /** Isi teks gambar, untuk pembaca layar. */
  text: string
  /** Gelap latar di luar gambar, disamakan dengan lapisan gelap di tepi gambar (alpha 0–255). */
  backdrop: number
}

/**
 * Gambar tur dipakai PERSIS seperti dari desainer (tidak diedit); yang diatur hanya letak dan
 * ukuran tampilnya. Tombol "Lanjut"/"Siap" adalah area tekan transparan di atas tombol tergambar.
 */
const STEPS: Step[] = [
  {
    image: { src: sambutan, width: 1937, height: 1080 },
    button: { x0: 368, y0: 783, x1: 653, y1: 870 },
    label: 'Lanjut',
    text: 'Halo Sobat! Mau tahu apa saja hal seru yang bisa kita lakuin di sini? Yuk, intip panduannya!',
    backdrop: 138,
  },
  {
    image: { src: skor, width: 1920, height: 1080 },
    button: { x0: 1067, y0: 526, x1: 1352, y1: 613 },
    label: 'Lanjut',
    text: 'Disini tertera jumlah kandang yang sudah kamu kunjungi.',
    backdrop: 41,
  },
  {
    image: { src: scan, width: 1920, height: 1080 },
    button: { x0: 1067, y0: 541, x1: 1352, y1: 628 },
    label: 'Lanjut',
    text: 'Klik tombol ini untuk memindai kode QR di depanmu ya!',
    backdrop: 41,
  },
  {
    image: { src: peta, width: 1920, height: 1080 },
    button: { x0: 1172, y0: 488, x1: 1457, y1: 575 },
    label: 'Lanjut',
    text: 'Klik tombol ini untuk melihat keseluruhan peta ya!',
    backdrop: 41,
  },
  {
    image: { src: panduan, width: 1920, height: 1080 },
    button: { x0: 1156, y0: 496, x1: 1441, y1: 583 },
    label: 'Lanjut',
    text: 'Bingung? Klik tombol ini untuk panduan tambahan ya!',
    backdrop: 41,
  },
  {
    image: { src: selesai, width: 1920, height: 1080 },
    button: { x0: 1149, y0: 659, x1: 1434, y1: 746 },
    label: 'Siap',
    text: 'Selesai! Apakah kamu siap berpetualang sobat?',
    backdrop: 41,
  },
]

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
