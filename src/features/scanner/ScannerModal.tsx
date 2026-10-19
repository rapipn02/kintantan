import { type FormEvent, type ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import daun from '../../assets/decor/daun.webp'
import hewanIntip from '../../assets/decor/hewan-intip.webp'
import sulur from '../../assets/decor/sulur.webp'
import { CameraSignalIcon, CloseIcon, FlashIcon, KeyboardIcon } from '../../shared/ui/icons.tsx'
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
 * Layar "Scan Barcode Hewan": kamera langsung menyala di dalam bingkai desain.
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
      <div className="scan-frame h-full max-h-[760px] w-[min(100%,1000px)] animate-tour-pop">
        <div className="paw-cream flex h-full flex-col gap-[clamp(6px,1.6vh,16px)] rounded-[clamp(14px,2vw,24px)] p-[clamp(10px,1.8vw,26px)]">
          <header className="scan-header relative flex shrink-0 items-center justify-center px-14 py-[clamp(6px,1.6vh,16px)]">
            <h2 className="text-[clamp(18px,2.6vw,34px)] leading-tight font-bold">
              Scan Barcode Hewan
            </h2>
            <button
              type="button"
              className="absolute right-[clamp(6px,1vw,12px)] grid size-[clamp(34px,4vw,46px)] place-items-center rounded-full bg-white/90 text-bark shadow-[0_2px_0_rgb(0_0_0/0.15)]"
              aria-label="Tutup kamera"
              onClick={onClose}
            >
              <CloseIcon className="size-[60%]" />
            </button>
          </header>

          <p className="shrink-0 text-center text-[clamp(13px,1.8vw,22px)] leading-snug text-[#6b4a2b]">
            {targetName ? (
              <>
                Arahkan kamera ke QR Code di kandang <b>{targetName}</b> ya!
              </>
            ) : (
              'Arahkan kamera ke QR Code di dekat kandang ya!'
            )}
          </p>

          <div className="scan-camera paw-camera min-h-0 flex-1">
            <video
              ref={videoRef}
              className={`absolute inset-0 size-full object-cover transition-opacity duration-300 ${scanning ? 'opacity-100' : 'opacity-0'}`}
              playsInline
              muted
              autoPlay
              aria-hidden="true"
            />

            {!scanning && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-white">
                <span className="flex items-center gap-3 text-[clamp(22px,3vw,38px)]">
                  <CameraSignalIcon className="size-[1.6em]" /> Kode Qr
                </span>
              </div>
            )}
            {scanning && (
              <span className="pointer-events-none absolute inset-x-[12%] top-1/2 h-0.5 animate-pulse rounded bg-[#edc64b]" />
            )}

            <div
              className="absolute inset-x-0 top-2 flex justify-center px-3 text-center"
              aria-live="polite"
            >
              {status === 'starting' && <Bubble>Menyalakan kamera…</Bubble>}
              {status === 'error' && error && <Bubble tone="error">{ERROR_TEXT[error]}</Bubble>}
              {message && <Bubble tone="error">{message}</Bubble>}
            </div>

            <div className="absolute inset-x-0 bottom-2 flex items-end justify-center gap-2 px-3">
              {manual ? (
                <form
                  onSubmit={submitManual}
                  className="flex items-center gap-2 rounded-full bg-white p-1 text-bark shadow"
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
                <button
                  type="button"
                  className="btn-secondary min-h-10"
                  onClick={() => setManual(true)}
                >
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

        {/* Hiasan dari desain; tidak bisa dipencet supaya tidak menghalangi tombol. */}
        <img
          src={sulur}
          alt=""
          className="pointer-events-none absolute top-0 left-[3%] h-[34%] w-auto"
        />
        <img
          src={daun}
          alt=""
          className="pointer-events-none absolute -bottom-[3%] -left-[3%] h-[27%] w-auto"
        />
        <img
          src={hewanIntip}
          alt=""
          className="pointer-events-none absolute top-[17%] -right-[2.5%] h-[72%] w-auto"
        />
      </div>
    </div>
  )
}

function Bubble({ children, tone = 'info' }: { children: ReactNode; tone?: 'info' | 'error' }) {
  return (
    <p
      className={`max-w-md rounded-2xl px-4 py-2 text-sm leading-snug font-medium text-white ${tone === 'error' ? 'bg-ember/95' : 'bg-black/55'}`}
    >
      {children}
    </p>
  )
}
