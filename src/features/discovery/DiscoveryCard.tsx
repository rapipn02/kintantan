import { useEffect, useRef } from 'react'
import { useGameStore } from '../../app/gameStore.ts'
import { AnimalPortrait } from '../exhibits/AnimalPortrait.tsx'
import { getExhibit, getExhibitNumber, getSpecies, TOTAL_EXHIBITS } from '../exhibits/catalog.ts'
import { useFoundCount } from './discoveryStore.ts'

const HEADINGS = {
  new: 'Hewan Baru Ditemukan!',
  again: 'Sudah Ada di Koleksimu',
  view: 'Kartu Koleksi',
} as const

/** Placeholder isi kartu; diisi di fitur info hewan berikutnya. */
const UPCOMING_INFO = ['Habitat', 'Makanan', 'Fakta Seru']

/** Kartu ala Pokémon yang muncul setelah QR kandang berhasil discan. */
export function DiscoveryCard() {
  const reveal = useGameStore((state) => state.reveal)
  const closeReveal = useGameStore((state) => state.closeReveal)
  const foundCount = useFoundCount()
  const buttonRef = useRef<HTMLButtonElement>(null)

  const exhibit = reveal ? getExhibit(reveal.exhibitId) : undefined
  const expected = reveal?.expectedId ? getExhibit(reveal.expectedId) : undefined

  useEffect(() => {
    if (exhibit) buttonRef.current?.focus()
  }, [exhibit])

  if (!reveal || !exhibit) return null
  const species = getSpecies(exhibit)
  const isNew = reveal.kind === 'new'

  return (
    <div
      className="safe-pad absolute inset-0 z-40 grid animate-fade-in place-items-center overflow-hidden bg-bark/55 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="discovery-title"
    >
      {isNew && (
        <div
          className="sun-rays pointer-events-none absolute top-1/2 left-1/2 size-[160vmax] -translate-1/2 animate-spin-slow"
          aria-hidden="true"
        />
      )}
      <div
        key={`${reveal.exhibitId}-${reveal.kind}`}
        className="card-surface relative flex max-h-full w-[min(640px,100%)] animate-pop-in overflow-hidden rounded-[28px] [perspective:800px]"
      >
        <div className="relative w-[44%] shrink-0 bg-meadow">
          <AnimalPortrait exhibit={exhibit} found aspect={0.95} className="absolute inset-0" />
          <span className="absolute bottom-2 left-2 rounded-full bg-white/90 px-2.5 py-0.5 text-xs font-bold">
            #{String(getExhibitNumber(exhibit.id)).padStart(2, '0')}
          </span>
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-2 overflow-y-auto p-4 sm:p-5">
          <p
            className={`w-fit rounded-full px-3 py-1 text-xs font-bold tracking-wide uppercase ${isNew ? 'bg-sun text-bark' : 'bg-sand'}`}
          >
            {HEADINGS[reveal.kind]}
          </p>
          <h2 id="discovery-title" className="text-3xl leading-none font-bold">
            {species.name}
          </h2>

          {expected && (
            <p className="rounded-xl bg-sky/15 px-3 py-2 text-sm leading-snug">
              Ini QR kandang <b>{species.name}</b>, bukan {getSpecies(expected).name}.{' '}
              {isNew ? 'Tetap masuk koleksimu!' : ''}
            </p>
          )}

          <div className="flex flex-wrap gap-1.5">
            {UPCOMING_INFO.map((label) => (
              <span
                key={label}
                className="rounded-full border-2 border-dashed border-bark/25 px-2.5 py-0.5 text-xs font-semibold text-bark/60"
              >
                {label}
              </span>
            ))}
          </div>
          <p className="text-xs text-bark/60">Info lengkap hewan segera hadir.</p>

          <div className="mt-auto flex flex-col gap-2 pt-1">
            <div>
              <div className="mb-1 flex justify-between text-xs font-semibold">
                <span>Koleksi</span>
                <span>
                  {foundCount}/{TOTAL_EXHIBITS}
                </span>
              </div>
              <div
                className="h-2.5 overflow-hidden rounded-full bg-sand"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={TOTAL_EXHIBITS}
                aria-valuenow={foundCount}
                aria-label="Progres koleksi"
              >
                <div
                  className="h-full rounded-full bg-forest transition-[width] duration-700"
                  style={{ width: `${(foundCount / TOTAL_EXHIBITS) * 100}%` }}
                />
              </div>
            </div>
            <button ref={buttonRef} type="button" className="btn-primary" onClick={closeReveal}>
              Lanjut Jelajah
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
