import { type FormEvent, type ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import { FlashIcon, KeyboardIcon } from '../../shared/ui/icons.tsx'
import { ScannerFrame } from './ScannerFrame.tsx'
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
    <ScannerFrame
      targetName={targetName}
      onClose={onClose}
      camera={
        <>
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
        </>
      }
      controls={
        <>
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
        </>
      }
    />
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
