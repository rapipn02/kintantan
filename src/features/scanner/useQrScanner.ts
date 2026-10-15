import { type RefObject, useCallback, useEffect, useRef, useState } from 'react'
import { getQrDetector } from './qrDetector.ts'

export type ScannerError = 'denied' | 'no-camera' | 'insecure' | 'unavailable'

export type ScannerStatus = 'starting' | 'scanning' | 'error'

const SCAN_INTERVAL_MS = 150

const CONSTRAINTS: MediaStreamConstraints = {
  audio: false,
  video: {
    facingMode: { ideal: 'environment' },
    width: { ideal: 1280 },
    height: { ideal: 720 },
  },
}

function toScannerError(error: unknown): ScannerError {
  if (error instanceof DOMException) {
    if (error.name === 'NotAllowedError' || error.name === 'SecurityError') return 'denied'
    if (error.name === 'NotFoundError' || error.name === 'OverconstrainedError') return 'no-camera'
  }
  return 'unavailable'
}

interface TorchCapabilities extends MediaTrackCapabilities {
  torch?: boolean
}

/**
 * Nyalakan kamera belakang dan panggil `onCode` untuk setiap QR yang terbaca.
 * Kamera dimatikan otomatis saat komponen dilepas.
 */
export function useQrScanner(
  videoRef: RefObject<HTMLVideoElement | null>,
  onCode: (rawValue: string) => void,
) {
  const [status, setStatus] = useState<ScannerStatus>('starting')
  const [error, setError] = useState<ScannerError | null>(null)
  const [torch, setTorch] = useState<{ supported: boolean; on: boolean }>({
    supported: false,
    on: false,
  })
  const trackRef = useRef<MediaStreamTrack | null>(null)
  const onCodeRef = useRef(onCode)

  useEffect(() => {
    onCodeRef.current = onCode
  }, [onCode])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    let cancelled = false
    let timer = 0
    let stream: MediaStream | null = null

    const fail = (reason: ScannerError) => {
      if (cancelled) return
      setError(reason)
      setStatus('error')
    }

    const start = async () => {
      if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
        fail('insecure')
        return
      }
      try {
        const [detector, media] = await Promise.all([
          getQrDetector(),
          navigator.mediaDevices.getUserMedia(CONSTRAINTS),
        ])
        stream = media
        if (cancelled) return
        video.srcObject = media
        await video.play()
        if (cancelled) return

        const track = media.getVideoTracks()[0] ?? null
        trackRef.current = track
        const capabilities = track?.getCapabilities?.() as TorchCapabilities | undefined
        setTorch({ supported: Boolean(capabilities?.torch), on: false })
        setStatus('scanning')

        const scan = async () => {
          if (cancelled) return
          if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
            try {
              const codes = await detector.detect(video)
              const value = codes[0]?.rawValue
              if (value && !cancelled) onCodeRef.current(value)
            } catch {
              // frame gagal dibaca, coba frame berikutnya
            }
          }
          if (!cancelled) timer = window.setTimeout(scan, SCAN_INTERVAL_MS)
        }
        void scan()
      } catch (err) {
        fail(toScannerError(err))
      }
    }

    void start()
    return () => {
      cancelled = true
      window.clearTimeout(timer)
      stream?.getTracks().forEach((track) => track.stop())
      trackRef.current = null
      video.srcObject = null
    }
  }, [videoRef])

  const toggleTorch = useCallback(async () => {
    const track = trackRef.current
    if (!track) return
    const next = !torch.on
    try {
      await track.applyConstraints({ advanced: [{ torch: next } as MediaTrackConstraintSet] })
      setTorch((state) => ({ ...state, on: next }))
    } catch {
      setTorch({ supported: false, on: false })
    }
  }, [torch.on])

  return { status, error, torch, toggleTorch }
}
