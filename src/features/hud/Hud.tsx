import { TOTAL_EXHIBITS } from '../exhibits/catalog.ts'
import { useFoundCount } from '../discovery/discoveryStore.ts'
import { InfoIcon, ScanQrIcon, ShrinkIcon } from '../../shared/ui/icons.tsx'

interface Props {
  onScan: () => void
  onHelp: () => void
  onOverview: () => void
}

/**
 * HUD sesuai desain: skor koleksi di kiri atas, tombol Scan QR, lihat seluruh peta, dan panduan
 * di kanan atas.
 * Atribut `data-tour` dipakai tur pengenalan untuk menyorot tiap elemen.
 */
export function Hud({ onScan, onHelp, onOverview }: Props) {
  const found = useFoundCount()
  return (
    <>
      <div className="safe-pad pointer-events-none absolute top-0 left-0 z-10">
        <div
          className="hud-chip pointer-events-auto"
          aria-label={`${found} dari ${TOTAL_EXHIBITS} hewan ditemukan`}
          data-testid="hud-progress"
          data-tour="score"
        >
          {found}/{TOTAL_EXHIBITS}
        </div>
      </div>
      <div className="safe-pad pointer-events-none absolute top-0 right-0 z-10 flex gap-2">
        <button
          type="button"
          className="hud-btn pointer-events-auto"
          aria-label="Scan Barcode"
          title="Scan QR kandang"
          data-tour="scan"
          onClick={onScan}
        >
          <ScanQrIcon />
        </button>
        <button
          type="button"
          className="hud-btn pointer-events-auto"
          aria-label="Lihat seluruh peta"
          title="Lihat seluruh peta"
          data-tour="overview"
          onClick={onOverview}
        >
          <ShrinkIcon />
        </button>
        <button
          type="button"
          className="hud-btn pointer-events-auto"
          aria-label="Petunjuk Penggunaan"
          title="Petunjuk Penggunaan"
          data-tour="help"
          onClick={onHelp}
        >
          <InfoIcon />
        </button>
      </div>
    </>
  )
}
