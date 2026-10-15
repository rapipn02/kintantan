import { useGameStore } from '../../app/gameStore.ts'
import { CameraIcon, CloseIcon, PawIcon } from '../../shared/ui/icons.tsx'
import { useIsFound } from '../discovery/discoveryStore.ts'
import { AnimalPortrait } from './AnimalPortrait.tsx'
import { getExhibit, getSpecies } from './catalog.ts'

const GROUP_LABEL = {
  mamalia: 'Mamalia',
  burung: 'Burung',
  reptil: 'Reptil',
  ikan: 'Ikan',
} as const

/** Panel info singkat di sisi kanan saat hewan di peta dipencet. */
export function ExhibitPanel() {
  const selectedId = useGameStore((state) => state.selectedId)
  const exhibit = selectedId ? getExhibit(selectedId) : undefined
  if (!exhibit) return null
  // `key` mereset animasi masuk tiap kali hewan berganti.
  return <PanelContent key={exhibit.id} exhibitId={exhibit.id} />
}

function PanelContent({ exhibitId }: { exhibitId: string }) {
  const exhibit = getExhibit(exhibitId)!
  const species = getSpecies(exhibit)
  const found = useIsFound(exhibit.id)
  const select = useGameStore((state) => state.select)
  const openScanner = useGameStore((state) => state.openScanner)
  const viewCard = useGameStore((state) => state.viewCard)

  return (
    <aside
      aria-labelledby="exhibit-panel-title"
      className="pointer-events-none absolute inset-y-0 right-0 z-20 flex w-[min(340px,42vw)] pr-[max(env(safe-area-inset-right),10px)] py-[max(env(safe-area-inset-top),10px)]"
    >
      <div className="card-surface pointer-events-auto relative flex w-full animate-slide-in-right flex-col overflow-hidden rounded-3xl">
        <button
          type="button"
          className="icon-btn absolute top-2 right-2 z-10 size-10"
          aria-label="Tutup"
          onClick={() => select(null)}
        >
          <CloseIcon className="size-5" />
        </button>

        <AnimalPortrait
          exhibit={exhibit}
          found={found}
          aspect={2.2}
          className="h-[38%] min-h-24 shrink-0 bg-meadow"
        />

        <div className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto px-4 pt-3 pb-2">
          <span className="w-fit rounded-full bg-sand px-2.5 py-0.5 text-xs font-semibold tracking-wide uppercase">
            {GROUP_LABEL[species.group]}
          </span>
          <h2 id="exhibit-panel-title" className="text-2xl leading-tight font-bold">
            {species.name}
          </h2>
          {found ? (
            <p className="flex items-center gap-1.5 font-semibold text-forest">
              <PawIcon className="size-4" /> Sudah masuk koleksimu!
            </p>
          ) : (
            <p className="text-sm leading-snug text-bark/80">
              Datangi kandangnya, lalu scan QR yang ada di sana untuk membuka kartu hewan ini.
            </p>
          )}
        </div>

        <div className="shrink-0 px-4 pb-4">
          {found ? (
            <button
              type="button"
              className="btn-primary w-full"
              onClick={() => viewCard(exhibit.id)}
            >
              Lihat Kartu
            </button>
          ) : (
            <button type="button" className="btn-primary w-full" onClick={openScanner}>
              <CameraIcon className="size-6" /> Scan QR
            </button>
          )}
        </div>
      </div>
    </aside>
  )
}
