import { type FormEvent, type ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import { CloseIcon, FlashIcon, KeyboardIcon } from '../../shared/ui/icons.tsx'
import { type ScannerError, useQrScanner } from './useQrScanner.ts'

interface Props {
  /** Nama hewan yang sedang dicari, untuk judul. */
  targetName: string
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

/** Layar kamera untuk scan QR kandang. Di-lazy-load supaya tidak membebani muatan awal. */
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

  return (
    <div
      className="absolute inset-0 z-50 animate-fade-in overflow-hidden bg-black text-white"
      role="dialog"
      aria-modal="true"
      aria-label={`Scan QR kandang ${targetName}`}
    >
      <video
        ref={videoRef}
        className="absolute inset-0 size-full object-cover"
        playsInline
        muted
        autoPlay
        aria-hidden="true"
      />

      {/* Bingkai bidik */}
      <div className="pointer-events-none absolute inset-0 grid place-items-center">
        <div className="relative aspect-square h-[min(58vh,58vw)] rounded-3xl shadow-[0_0_0_100vmax_rgb(0_0_0/0.55)]">
          {(
            [
              'top-0 left-0 border-t-4 border-l-4',
              'top-0 right-0 border-t-4 border-r-4',
              'bottom-0 left-0 border-b-4 border-l-4',
              'bottom-0 right-0 border-r-4 border-b-4',
            ] as const
          ).map((position) => (
            <span
              key={position}
              className={`absolute size-10 rounded-[14px] border-sun ${position}`}
            />
          ))}
          {status === 'scanning' && (
            <span className="absolute inset-x-4 top-1/2 h-0.5 animate-pulse rounded bg-sun/80" />
          )}
        </div>
      </div>

      <div className="safe-pad absolute inset-0 flex flex-col">
        <header className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-white/75">Scan QR di kandang</p>
            <h2 className="text-2xl leading-tight font-bold">{targetName}</h2>
          </div>
          <button
            type="button"
            className="icon-btn shrink-0"
            aria-label="Tutup kamera"
            onClick={onClose}
          >
            <CloseIcon className="size-6" />
          </button>
        </header>

        <div className="mt-auto flex items-end justify-between gap-3">
          <div className="min-w-0 max-w-[60%]" aria-live="polite">
            {status === 'starting' && <Bubble>Menyalakan kamera…</Bubble>}
            {status === 'scanning' && !message && (
              <Bubble>Arahkan kamera ke QR di papan kandang.</Bubble>
            )}
            {status === 'error' && error && <Bubble tone="error">{ERROR_TEXT[error]}</Bubble>}
            {message && <Bubble tone="error">{message}</Bubble>}
          </div>

          <div className="flex items-end gap-2">
            {manual ? (
              <form
                onSubmit={submitManual}
                className="flex items-center gap-2 rounded-full bg-white p-1 text-bark"
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
            ) : (
              <button type="button" className="btn-secondary" onClick={() => setManual(true)}>
                <KeyboardIcon className="size-5" /> Ketik kode
              </button>
            )}
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
          </div>
        </div>
      </div>
    </div>
  )
}

function Bubble({ children, tone = 'info' }: { children: ReactNode; tone?: 'info' | 'error' }) {
  return (
    <p
      className={`rounded-2xl px-4 py-2.5 text-sm leading-snug font-medium backdrop-blur ${tone === 'error' ? 'bg-ember/90' : 'bg-black/55'}`}
    >
      {children}
    </p>
  )
}
