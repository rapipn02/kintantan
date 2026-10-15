import { TOTAL_EXHIBITS } from '../exhibits/catalog.ts'
import { useFoundCount } from '../discovery/discoveryStore.ts'
import { HelpIcon, MapIcon, PawIcon, QrIcon } from '../../shared/ui/icons.tsx'

interface Props {
  onScan: () => void
  onHelp: () => void
  onOverview: () => void
}

/**
 * Baris atas peta sesuai desain: progres koleksi, Scan Barcode, Petunjuk Penggunaan.
 * Sengaja di kiri karena sisi kanan dipakai panel info hewan; di layar sempit label diringkas.
 */
export function Hud({ onScan, onHelp, onOverview }: Props) {
  const found = useFoundCount()
  return (
    <div className="safe-pad pointer-events-none absolute top-0 left-0 z-10 flex items-center gap-2">
      <div
        className="pointer-events-auto flex items-center gap-2 rounded-full bg-white py-1.5 pr-4 pl-1.5 shadow-[0_3px_0_rgb(91_58_31/0.25)]"
        aria-label={`${found} dari ${TOTAL_EXHIBITS} hewan ditemukan`}
        data-testid="hud-progress"
      >
        <span className="grid size-8 place-items-center rounded-full bg-ember text-white">
          <PawIcon className="size-5" />
        </span>
        <span className="text-lg leading-none font-bold">
          {found}
          <span className="text-bark/50">/{TOTAL_EXHIBITS}</span>
        </span>
      </div>
      <button
        type="button"
        className="btn-primary pointer-events-auto min-h-11 px-4 text-base"
        aria-label="Scan Barcode"
        onClick={onScan}
      >
        <QrIcon className="size-5" />
        <span>
          Scan<span className="max-[760px]:hidden"> Barcode</span>
        </span>
      </button>
      <button
        type="button"
        className="btn-secondary pointer-events-auto px-3"
        aria-label="Petunjuk Penggunaan"
        onClick={onHelp}
      >
        <HelpIcon className="size-5" />
        <span className="max-[760px]:hidden">Petunjuk</span>
      </button>
      <button
        type="button"
        className="icon-btn pointer-events-auto"
        aria-label="Lihat seluruh peta"
        onClick={onOverview}
      >
        <MapIcon className="size-6" />
      </button>
    </div>
  )
}
