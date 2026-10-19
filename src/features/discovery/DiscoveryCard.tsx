import {
  type ComponentType,
  type ReactNode,
  type SVGProps,
  useEffect,
  useRef,
  useState,
} from 'react'
import { type Reveal, useGameStore } from '../../app/gameStore.ts'
import { AnimalPortrait } from '../exhibits/AnimalPortrait.tsx'
import { getExhibit, getSpecies, getSpeciesInfo, TOTAL_EXHIBITS } from '../exhibits/catalog.ts'
import { getPhoto } from '../exhibits/photos.ts'
import type { Exhibit, SpeciesInfo, Taxonomy } from '../exhibits/types.ts'
import {
  ChevronsDownIcon,
  ClassIcon,
  CloseIcon,
  CrownIcon,
  FamilyIcon,
  FoldedMapIcon,
  FoodIcon,
  GenusIcon,
  MoodIcon,
  OrderIcon,
  PhylumIcon,
  SpeakerIcon,
  SpeciesIcon,
} from '../../shared/ui/icons.tsx'
import { useFoundCount } from './discoveryStore.ts'

type Icon = ComponentType<SVGProps<SVGSVGElement>>

/** Rasio foto di desain kartu (245×231). */
const PHOTO_ASPECT = 245 / 231

const TAXONOMY_ROWS: { key: keyof Omit<Taxonomy, 'kingdom'>; label: string; icon: Icon }[] = [
  { key: 'phylum', label: 'Filum', icon: PhylumIcon },
  { key: 'class', label: 'Kelas', icon: ClassIcon },
  { key: 'order', label: 'Ordo', icon: OrderIcon },
  { key: 'family', label: 'Famili', icon: FamilyIcon },
  { key: 'genus', label: 'Genus', icon: GenusIcon },
  { key: 'species', label: 'Spesies', icon: SpeciesIcon },
]

/** Kartu hewan (sesuai desain): muncul setelah popup "Pindai berhasil" atau dari panel hewan. */
export function DiscoveryCard() {
  const reveal = useGameStore((state) => state.reveal)
  const closeReveal = useGameStore((state) => state.closeReveal)
  const exhibit = reveal ? getExhibit(reveal.exhibitId) : undefined
  if (!reveal || !exhibit || reveal.celebrate) return null
  return (
    <AnimalCard
      key={`${reveal.exhibitId}-${reveal.kind}`}
      reveal={reveal}
      exhibit={exhibit}
      onClose={closeReveal}
    />
  )
}

interface CardProps {
  reveal: Reveal
  exhibit: Exhibit
  onClose: () => void
}

function AnimalCard({ reveal, exhibit, onClose }: CardProps) {
  const species = getSpecies(exhibit)
  const info = getSpeciesInfo(species.id)
  const photo = getPhoto(species.id)
  const expected = reveal.expectedId ? getExhibit(reveal.expectedId) : undefined
  const isNew = reveal.kind === 'new'
  const foundCount = useFoundCount()
  const [taxonomyOpen, setTaxonomyOpen] = useState(false)
  const speech = useSpeech(speechText(species.name, info))
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    closeRef.current?.focus({ focusVisible: false })
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="safe-pad absolute inset-0 z-40 flex animate-fade-in items-center justify-center gap-3 overflow-hidden bg-bark/55"
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

      <article className="animal-frame relative flex h-full max-h-[880px] w-[min(430px,54vw)] animate-pop-in flex-col">
        <div className="paw-green flex min-h-0 flex-1 flex-col overflow-hidden rounded-[clamp(14px,2vw,22px)]">
          <header className="flex shrink-0 items-stretch gap-2 p-[clamp(6px,1vw,10px)] pb-1">
            <div className="animal-title flex min-w-0 flex-1 flex-wrap items-baseline gap-x-2 px-3 py-1">
              <h2
                id="discovery-title"
                className="text-[clamp(20px,2.6vw,34px)] leading-tight font-bold"
              >
                {species.name}
              </h2>
              {info && (
                <span className="text-[clamp(10px,1.1vw,13px)] text-bark">
                  {info.scientificName}
                </span>
              )}
            </div>
            {speech.supported && (
              <button
                type="button"
                className="animal-speaker w-[clamp(42px,5vw,56px)] shrink-0"
                aria-label={`Dengarkan info ${species.name}`}
                aria-pressed={speech.speaking}
                onClick={speech.toggle}
              >
                <SpeakerIcon className="size-[55%]" />
              </button>
            )}
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto px-[clamp(8px,1.4vw,16px)] pb-3">
            {(reveal.kind !== 'view' || expected) && (
              <div className="mt-1 flex flex-col items-center gap-1.5 text-center">
                {reveal.kind !== 'view' && (
                  <p
                    className={`rounded-full px-3 py-0.5 text-xs font-bold tracking-wide uppercase shadow-sm ${isNew ? 'bg-sun text-bark' : 'bg-cream text-bark'}`}
                  >
                    {isNew ? 'Hewan Baru Ditemukan!' : 'Sudah Ada di Koleksimu'}
                    <span className="ml-1.5 font-semibold normal-case">
                      ({foundCount}/{TOTAL_EXHIBITS})
                    </span>
                  </p>
                )}
                {expected && (
                  <p className="rounded-xl bg-white/85 px-3 py-1.5 text-sm leading-snug">
                    Ini QR kandang <b>{species.name}</b>, bukan {getSpecies(expected).name}.{' '}
                    {isNew ? 'Tetap masuk koleksimu!' : ''}
                  </p>
                )}
              </div>
            )}

            <div
              className="mx-auto mt-2 w-[62%] overflow-hidden rounded-[clamp(16px,2.4vw,28px)] bg-meadow shadow-[0_4px_10px_rgb(0_0_0/0.18)]"
              style={{ aspectRatio: PHOTO_ASPECT }}
            >
              {photo ? (
                <img
                  src={photo}
                  alt={`Foto ${species.name}`}
                  className="size-full object-cover"
                  draggable={false}
                />
              ) : (
                <AnimalPortrait
                  exhibit={exhibit}
                  found
                  aspect={PHOTO_ASPECT}
                  className="size-full"
                />
              )}
            </div>

            {info ? (
              <>
                <div className="mt-1 grid grid-cols-2 gap-x-[clamp(8px,1.4vw,16px)]">
                  <InfoBox label="Kingdom" icon={CrownIcon} iconSide="left">
                    {info.taxonomy.kingdom}
                  </InfoBox>
                  <InfoBox label="Asal" icon={FoldedMapIcon}>
                    {info.origin}
                  </InfoBox>
                  <InfoBox label="Makanan" icon={FoodIcon} iconSide="left">
                    {info.diet}
                  </InfoBox>
                  <InfoBox label="Sifat" icon={MoodIcon}>
                    {info.temperament}
                  </InfoBox>
                </div>
                <InfoBox label="Fakta Unik" icon={QuestionMark}>
                  {info.funFact}
                </InfoBox>
                <button
                  type="button"
                  className="taxonomy-toggle relative mt-4 min-h-10 w-full text-[clamp(14px,1.6vw,18px)]"
                  aria-expanded={taxonomyOpen}
                  aria-controls="taxonomy-panel"
                  onClick={() => setTaxonomyOpen((open) => !open)}
                >
                  Taksonomi
                  <ChevronsDownIcon
                    className={`absolute right-3 size-5 text-bark transition-transform ${taxonomyOpen ? '-rotate-90' : ''}`}
                  />
                </button>
              </>
            ) : (
              <InfoBox label="Info Hewan" icon={QuestionMark}>
                Info lengkap {species.name} segera hadir. Nantikan, ya!
              </InfoBox>
            )}
          </div>
        </div>
      </article>

      {taxonomyOpen && info && <TaxonomyPanel taxonomy={info.taxonomy} />}

      <button
        ref={closeRef}
        type="button"
        className="icon-btn absolute top-[max(env(safe-area-inset-top),10px)] right-[max(env(safe-area-inset-right),12px)] z-10"
        aria-label="Tutup kartu"
        onClick={onClose}
      >
        <CloseIcon className="size-6" />
      </button>
    </div>
  )
}

function TaxonomyPanel({ taxonomy }: { taxonomy: Taxonomy }) {
  return (
    <aside
      id="taxonomy-panel"
      aria-label="Taksonomi"
      className="animal-frame relative h-full max-h-[880px] w-[min(250px,30vw)] animate-slide-in-right overflow-y-auto"
    >
      {TAXONOMY_ROWS.map(({ key, label, icon }) => (
        <InfoBox key={key} label={label} icon={icon} align="left">
          {taxonomy[key]}
        </InfoBox>
      ))}
    </aside>
  )
}

interface InfoBoxProps {
  label: string
  icon: Icon
  iconSide?: 'left' | 'right'
  align?: 'center' | 'left'
  children: ReactNode
}

/** Kotak krem dengan label coklat muda + ikon yang menempel di tepi atas (seperti desain). */
function InfoBox({
  label,
  icon: IconComponent,
  iconSide = 'right',
  align = 'center',
  children,
}: InfoBoxProps) {
  const icon = <IconComponent className="mb-1.5 size-[26px] shrink-0 text-[#4e342e]" />
  return (
    <div className="info-box mt-[22px] px-3 pt-6 pb-3">
      <div
        className={`absolute -top-[18px] flex items-end gap-1 ${align === 'center' ? 'left-1/2 -translate-x-1/2' : 'left-3'}`}
      >
        {iconSide === 'left' && icon}
        <span className="info-tag">{label}</span>
        {iconSide === 'right' && icon}
      </div>
      <p
        className={`text-[clamp(13px,1.5vw,17px)] leading-snug ${align === 'center' ? 'text-center' : 'text-left'}`}
      >
        {children}
      </p>
    </div>
  )
}

/** Tanda tanya besar di samping label "Fakta Unik". */
function QuestionMark({ className }: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <text
        x="12"
        y="20"
        textAnchor="middle"
        fontSize="24"
        fontWeight="700"
        fill="currentColor"
        fontFamily="inherit"
      >
        ?
      </text>
    </svg>
  )
}

function speechText(name: string, info: SpeciesInfo | undefined): string {
  if (!info) return name
  return [
    `${name}.`,
    `Asal: ${info.origin}.`,
    `Makanan: ${info.diet}.`,
    `Sifat: ${info.temperament}.`,
    `Fakta unik: ${info.funFact}`,
  ].join(' ')
}

/** Bacakan isi kartu dengan suara bahasa Indonesia bawaan perangkat (bila tersedia). */
function useSpeech(text: string) {
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window
  const [speaking, setSpeaking] = useState(false)

  useEffect(
    () => () => {
      if (supported) window.speechSynthesis.cancel()
    },
    [supported],
  )

  const toggle = () => {
    if (!supported) return
    window.speechSynthesis.cancel()
    if (speaking) {
      setSpeaking(false)
      return
    }
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'id-ID'
    utterance.rate = 0.95
    utterance.onend = () => setSpeaking(false)
    utterance.onerror = () => setSpeaking(false)
    window.speechSynthesis.speak(utterance)
    setSpeaking(true)
  }

  return { supported, speaking, toggle }
}
