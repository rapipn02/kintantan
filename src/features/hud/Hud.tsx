import { TOTAL_EXHIBITS } from '../exhibits/catalog.ts'
import { useFoundCount } from '../discovery/discoveryStore.ts'
import { MapIcon, PawIcon } from '../../shared/ui/icons.tsx'

interface Props {
  onOverview: () => void
}

/**
 * Info di atas peta: progres koleksi + tombol lihat seluruh peta.
 * Sengaja di kiri karena sisi kanan dipakai panel info hewan.
 */
export function Hud({ onOverview }: Props) {
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
        className="icon-btn pointer-events-auto"
        aria-label="Lihat seluruh peta"
        onClick={onOverview}
      >
        <MapIcon className="size-6" />
      </button>
    </div>
  )
}
