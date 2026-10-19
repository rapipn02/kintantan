import { type FormEvent, type ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import scanDesign from '../../assets/desain/scan.png'
import { boxStyle, containWidth, type DesignImage } from '../../shared/ui/designImage.ts'
import { CloseIcon, FlashIcon, KeyboardIcon } from '../../shared/ui/icons.tsx'
import { type ScannerError, useQrScanner } from './useQrScanner.ts'

interface Props {
  /** Nama hewan yang sedang dicari; kosong bila dibuka dari tombol "Scan Barcode". */
  targetName?: string
  /** Kembalikan `true` bila kode diterima (scanner akan ditutup oleh pemanggil). */
  onCode: (raw: string) => boolean
  onClose: () => void
}

const ERROR_TEXT: Record<ScannerError, string> = {
  denied:
    'Izin kamera ditolak. Buka pengaturan browser, izinkan kamera untuk situs ini, lalu coba lagi.',
  'no-camera': 'Kamera belakang tidak ditemukan di perangkat ini.',
  insecure: 'Kamera hanya bisa dipakai lewat koneksi aman (https).',
  unavailable: 'Kamera tidak bisa dibuka. Tutup aplikasi lain yang memakai kamera, lalu coba lagi.',
}

/** Jeda sebelum QR asing yang sama boleh memicu pesan lagi. */
const REJECT_COOLDOWN_MS = 2500

/** Desain "Scan Barcode Hewan", dipakai apa adanya. */
const DESIGN: DesignImage = { src: scanDesign, width: 1120, height: 913 }

/**
 * Letak gambar kamera di dalam bingkai kuning desain (px gambar asli), tanpa menutupi daun di kiri
 * bawah dan hewan-hewan di kanan. Sebelum kamera menyala, "Kode Qr" di desain tetap terlihat.
 */
const CAMERA_BOX = { x0: 197, y0: 311, x1: 916, y1: 680 }

/**
 * Layar "Scan Barcode Hewan": kamera langsung menyala di dalam gambar desain.
 * Di-lazy-load supaya tidak membebani muatan awal.
 */
export default function ScannerModal({ targetName, onCode, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [manual, setManual] = useState(false)
  const [code, setCode] = useState('')
  const lastRejected = useRef<{ value: string; time: number } | null>(null)

  const handleDetected = useCallback(
    (raw: string) => {
      const previous = lastRejected.current
      if (
        previous &&
        previous.value === raw &&
        performance.now() - previous.time < REJECT_COOLDOWN_MS
      )
        return
      if (!onCode(raw)) {
        lastRejected.current = { value: raw, time: performance.now() }
        setMessage('QR ini bukan kode kandang. Cari QR di papan kandang hewan, ya!')
      }
    },
    [onCode],
  )

  const { status, error, torch, toggleTorch } = useQrScanner(videoRef, handleDetected)

  useEffect(() => {
    if (!message) return
    const timer = window.setTimeout(() => setMessage(null), REJECT_COOLDOWN_MS)
    return () => window.clearTimeout(timer)
  }, [message])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const submitManual = (event: FormEvent) => {
    event.preventDefault()
    if (!onCode(code)) setMessage('Kode tidak dikenal. Periksa lagi 8 huruf/angka di bawah QR.')
  }

  const scanning = status === 'scanning'

  return (
    <div
      className="safe-pad absolute inset-0 z-50 grid animate-fade-in place-items-center bg-black/55"
      role="dialog"
      aria-modal="true"
      aria-label={targetName ? `Scan QR kandang ${targetName}` : 'Scan Barcode'}
    >
      <div
        className="relative"
        style={{
          width: containWidth(DESIGN, '100%', 'calc(100dvh - 20px)'),
          aspectRatio: `${DESIGN.width} / ${DESIGN.height}`,
        }}
      >
        <img src={DESIGN.src} alt="" className="size-full select-none" draggable={false} />
        <p className="sr-only">
          Scan Barcode Hewan. Arahkan kamera ke QR Code di dekat kandang
          {targetName ? ` ${targetName}` : ''} ya!
        </p>

        <div className="overflow-hidden rounded-[10px]" style={boxStyle(CAMERA_BOX, DESIGN)}>
          <video
            ref={videoRef}
            className={`size-full object-cover transition-opacity duration-300 ${scanning ? 'opacity-100' : 'opacity-0'}`}
            playsInline
            muted
            autoPlay
            aria-hidden="true"
          />
          {scanning && (
            <span className="pointer-events-none absolute inset-x-[10%] top-1/2 h-0.5 animate-pulse rounded bg-[#edc64b]" />
          )}
          <div
            className="absolute inset-x-0 top-2 flex justify-center px-2 text-center"
            aria-live="polite"
          >
            {status === 'starting' && <Bubble>Menyalakan kamera…</Bubble>}
            {status === 'error' && error && <Bubble tone="error">{ERROR_TEXT[error]}</Bubble>}
            {message && <Bubble tone="error">{message}</Bubble>}
          </div>
          {manual && (
            <form
              onSubmit={submitManual}
              className="absolute inset-x-0 bottom-2 mx-auto flex w-fit items-center gap-2 rounded-full bg-white p-1 text-bark shadow"
            >
              <input
                value={code}
                onChange={(event) => setCode(event.target.value)}
                placeholder="Kode di bawah QR"
                aria-label="Kode kandang"
                maxLength={8}
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                autoFocus
                className="w-36 bg-transparent px-3 py-2 font-semibold tracking-widest outline-none placeholder:tracking-normal"
              />
              <button type="submit" className="btn-primary min-h-10 px-4 text-base">
                Buka
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Tombol tambahan di luar gambar desain, supaya gambarnya tidak tertutup. */}
      <button
        type="button"
        className="icon-btn absolute top-[max(env(safe-area-inset-top),10px)] right-[max(env(safe-area-inset-right),12px)]"
        aria-label="Tutup kamera"
        onClick={onClose}
      >
        <CloseIcon className="size-6" />
      </button>
      <div className="absolute right-[max(env(safe-area-inset-right),12px)] bottom-[max(env(safe-area-inset-bottom),10px)] flex flex-col items-end gap-2">
        {torch.supported && (
          <button
            type="button"
            className={`icon-btn ${torch.on ? 'bg-sun!' : ''}`}
            aria-label={torch.on ? 'Matikan senter' : 'Nyalakan senter'}
            aria-pressed={torch.on}
            onClick={toggleTorch}
          >
            <FlashIcon className="size-6" />
          </button>
        )}
        {!manual && (
          <button type="button" className="btn-secondary" onClick={() => setManual(true)}>
            <KeyboardIcon className="size-5" /> Ketik kode
          </button>
        )}
      </div>
    </div>
  )
}

function Bubble({ children, tone = 'info' }: { children: ReactNode; tone?: 'info' | 'error' }) {
  return (
    <p
      className={`max-w-md rounded-2xl px-3 py-1.5 text-xs leading-snug font-medium text-white ${tone === 'error' ? 'bg-ember/95' : 'bg-black/55'}`}
    >
      {children}
    </p>
  )
}
