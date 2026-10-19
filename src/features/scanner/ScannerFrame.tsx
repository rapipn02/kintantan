import type { ReactNode } from 'react'
import { boxStyle, containWidth } from '../../shared/ui/designImage.ts'
import { CloseIcon } from '../../shared/ui/icons.tsx'
import { CAMERA_BOX, SCAN_DESIGN } from './scannerDesign.ts'

interface Props {
  targetName?: string
  onClose: () => void
  /** Isi area kamera (video, pesan, form kode). Kosong = tampilan sementara saat kode kamera dimuat. */
  camera?: ReactNode
  /** Tombol tambahan di luar gambar desain (senter, ketik kode). */
  controls?: ReactNode
}

/**
 * Bingkai layar scan: gambar desain + tombol tutup. Dipakai oleh ScannerModal, dan juga sebagai
 * tampilan sementara (Suspense) saat kode kamera belum dimuat, jadi tidak ada layar hitam.
 */
export function ScannerFrame({ targetName, onClose, camera, controls }: Props) {
  return (
    <div
      className="safe-pad absolute inset-0 z-50 grid place-items-center bg-black/55"
      role="dialog"
      aria-modal="true"
      aria-label={targetName ? `Scan QR kandang ${targetName}` : 'Scan Barcode'}
    >
      <div
        className="relative"
        style={{
          width: containWidth(SCAN_DESIGN, '100%', 'calc(100dvh - 20px)'),
          aspectRatio: `${SCAN_DESIGN.width} / ${SCAN_DESIGN.height}`,
        }}
      >
        <img
          src={SCAN_DESIGN.src}
          alt=""
          className="size-full select-none"
          draggable={false}
          decoding="sync"
        />
        <p className="sr-only">
          Scan Barcode Hewan. Arahkan kamera ke QR Code di dekat kandang
          {targetName ? ` ${targetName}` : ''} ya!
        </p>
        <div className="overflow-hidden rounded-[10px]" style={boxStyle(CAMERA_BOX, SCAN_DESIGN)}>
          {camera}
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
        {controls}
      </div>
    </div>
  )
}
