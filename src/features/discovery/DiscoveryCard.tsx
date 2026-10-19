import {
  type ComponentType,
  type MouseEvent,
  type ReactNode,
  type SVGProps,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import { type Reveal, useGameStore } from '../../app/gameStore.ts'
import { AnimalPortrait } from '../exhibits/AnimalPortrait.tsx'
import { getExhibit, getSpecies, getSpeciesInfo, TOTAL_EXHIBITS } from '../exhibits/catalog.ts'
import { getPhoto } from '../exhibits/photos.ts'
import { getSound } from '../exhibits/sounds.ts'
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
import { boxStyle, containWidth } from '../../shared/ui/designImage.ts'
import { type CardDesign, CARD_DESIGNS } from './cardDesigns.ts'
import { useFoundCount } from './discoveryStore.ts'

type Icon = ComponentType<SVGProps<SVGSVGElement>>

/** Rasio foto di desain kartu (245×231). */
const PHOTO_ASPECT = 245 / 231

/** Jarak maksimum antar ketukan agar dihitung ketuk dua kali. */
const DOUBLE_TAP_MS = 400

/**
 * Seberapa tinggi kartu dibanding layar. 1 = muat utuh (teks terlalu kecil di HP landscape);
 * sedikit di atas 1 = kartu lebih besar dan cukup di-scroll sedikit.
 */
const CARD_HEIGHT_VS_SCREEN = 1.35

/**
 * Lebar tampil kartu desain: setinggi ±1,35× layar, tidak melebihi ukuran asli supaya tetap
 * tajam, dan menyisakan tempat untuk panel taksonomi di sampingnya.
 */
function designCardWidth(design: CardDesign) {
  return containWidth(
    design.card,
    `min(${design.card.width}px, 52vw)`,
    `calc((100dvh - 20px) * ${CARD_HEIGHT_VS_SCREEN})`,
  )
}

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
  const speech = useCardSound(speechText(species.name, info), getSound(species.id))
  const closeRef = useRef<HTMLButtonElement>(null)
  const lastTap = useRef(0)

  /** Sesuai petunjuk di desain kartu: "Klik dua kali tempat kosong untuk menutup". */
  // Pakai `click` (event terakhir dari satu ketukan), bukan pointerup: kalau kartu ditutup saat
  // pointerup, click dari ketukan yang sama jatuh ke hewan di peta di bawah jari dan membukanya.
  const handleBackdropTap = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return
    const now = event.timeStamp
    if (now - lastTap.current < DOUBLE_TAP_MS) onClose()
    lastTap.current = now
  }
  const design = CARD_DESIGNS[species.id]
  const showToast = useGameStore((state) => state.showToast)

  // Status ditampilkan sebagai toast supaya tidak menutupi gambar kartu.
  const status = expected
    ? `Ini QR kandang ${species.name}, bukan ${getSpecies(expected).name}.${isNew ? ' Tetap masuk koleksimu!' : ''}`
    : reveal.kind === 'new'
      ? `Hewan Baru Ditemukan! (${foundCount}/${TOTAL_EXHIBITS})`
      : reveal.kind === 'again'
        ? `Sudah ada di koleksimu (${foundCount}/${TOTAL_EXHIBITS})`
        : null
  useEffect(() => {
    if (status) showToast(status)
  }, [status, showToast])

  useEffect(() => {
    closeRef.current?.focus({ focusVisible: false })
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // overflow-clip (bukan hidden): latar tidak ikut tergulir saat tombol di kartu difokus, jadi
  // "tempat kosong" untuk ketuk dua kali tidak tertutup kartu yang bergeser.
  return (
    <div
      className="safe-pad absolute inset-0 z-40 flex animate-fade-in items-center justify-center gap-3 overflow-clip bg-bark/55"
      onClick={handleBackdropTap}
      role="dialog"
      aria-modal="true"
      aria-label={species.name}
    >
      {isNew && (
        <div
          className="sun-rays pointer-events-none absolute top-1/2 left-1/2 size-[160vmax] -translate-1/2 animate-spin-slow"
          aria-hidden="true"
        />
      )}

      {design ? (
        <DesignCardView
          design={design}
          name={species.name}
          info={info}
          taxonomyOpen={taxonomyOpen}
          onToggleTaxonomy={() => setTaxonomyOpen((open) => !open)}
          speech={speech}
        />
      ) : (
        <>
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
                    aria-label={`${speech.label} ${species.name}`}
                    aria-pressed={speech.speaking}
                    onClick={speech.toggle}
                  >
                    <SpeakerIcon className="size-[55%]" />
                  </button>
                )}
              </header>

              <div className="min-h-0 flex-1 no-scrollbar overflow-y-auto px-[clamp(8px,1.4vw,16px)] pb-3">
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
        </>
      )}

      <button
        ref={closeRef}
        type="button"
        className={`icon-btn absolute top-[max(env(safe-area-inset-top),10px)] right-[max(env(safe-area-inset-right),12px)] z-10 ${design ? 'sr-only focus-visible:not-sr-only' : ''}`}
        aria-label="Tutup kartu"
        onClick={onClose}
      >
        <CloseIcon className="size-6" />
      </button>
    </div>
  )
}

interface DesignCardViewProps {
  design: CardDesign
  name: string
  info: SpeciesInfo | undefined
  taxonomyOpen: boolean
  onToggleTaxonomy: () => void
  speech: ReturnType<typeof useCardSound>
}

/**
 * Kartu dari desainer, ditampilkan apa adanya. Tombol speaker & "Taksonomi" adalah area tekan
 * transparan di atas tombol yang tergambar. Isi kartu juga ditulis sebagai teks tersembunyi
 * untuk pembaca layar.
 */
function DesignCardView({
  design,
  name,
  info,
  taxonomyOpen,
  onToggleTaxonomy,
  speech,
}: DesignCardViewProps) {
  return (
    <>
      <article
        className="relative max-h-full animate-pop-in no-scrollbar overflow-y-auto"
        style={{ width: designCardWidth(design) }}
      >
        <div
          className="relative"
          style={{ aspectRatio: `${design.card.width} / ${design.card.height}` }}
        >
          <img src={design.card.src} alt="" className="size-full select-none" draggable={false} />
          {info && (
            <div className="sr-only">
              <p>
                {name} ({info.scientificName})
              </p>
              <p>Kingdom: {info.taxonomy.kingdom}</p>
              <p>Asal: {info.origin}</p>
              <p>Makanan: {info.diet}</p>
              <p>Sifat: {info.temperament}</p>
              <p>Fakta unik: {info.funFact}</p>
            </div>
          )}
          {speech.supported && (
            <button
              type="button"
              className="design-hotspot rounded-[22%]"
              style={boxStyle(design.speaker, design.card)}
              aria-label={`${speech.label} ${name}`}
              aria-pressed={speech.speaking}
              onClick={speech.toggle}
            />
          )}
          <button
            type="button"
            className="design-hotspot rounded-[10px]"
            style={boxStyle(design.taxonomyButton, design.card)}
            aria-expanded={taxonomyOpen}
            aria-controls="taxonomy-panel"
            onClick={onToggleTaxonomy}
          >
            <span className="sr-only">Taksonomi</span>
          </button>
        </div>
      </article>

      {taxonomyOpen && (
        <aside
          id="taxonomy-panel"
          aria-label="Taksonomi"
          className="relative max-h-full animate-slide-in-right no-scrollbar overflow-y-auto"
          style={{
            width: `calc(${designCardWidth(design)} * ${design.taxonomy.width / design.card.width})`,
          }}
        >
          <img src={design.taxonomy.src} alt="" className="w-full select-none" draggable={false} />
          {info && (
            <ul className="sr-only">
              {TAXONOMY_ROWS.map(({ key, label }) => (
                <li key={key}>
                  {label}: {info.taxonomy[key]}
                </li>
              ))}
            </ul>
          )}
        </aside>
      )}
    </>
  )
}

function TaxonomyPanel({ taxonomy }: { taxonomy: Taxonomy }) {
  return (
    <aside
      id="taxonomy-panel"
      aria-label="Taksonomi"
      className="animal-frame relative h-full max-h-[880px] w-[min(250px,30vw)] animate-slide-in-right no-scrollbar overflow-y-auto"
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

/**
 * Tombol speaker kartu: putar suara asli hewan bila ada (`assets-src/suara/`), kalau tidak
 * bacakan isi kartu dengan suara bahasa Indonesia bawaan perangkat. Ketuk lagi untuk berhenti.
 */
function useCardSound(text: string, soundUrl: string | undefined) {
  const canSpeak = typeof window !== 'undefined' && 'speechSynthesis' in window
  const supported = Boolean(soundUrl) || canSpeak
  const [speaking, setSpeaking] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const stop = useCallback(() => {
    audioRef.current?.pause()
    if (audioRef.current) audioRef.current.currentTime = 0
    if (canSpeak) window.speechSynthesis.cancel()
    setSpeaking(false)
  }, [canSpeak])

  // Hentikan suara saat kartu ditutup.
  useEffect(() => stop, [stop])

  const toggle = () => {
    if (speaking) {
      stop()
      return
    }
    if (soundUrl) {
      const audio = (audioRef.current ??= new Audio(soundUrl))
      audio.onended = () => setSpeaking(false)
      audio.currentTime = 0
      void audio.play().catch(() => setSpeaking(false))
    } else if (canSpeak) {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'id-ID'
      utterance.rate = 0.95
      utterance.onend = () => setSpeaking(false)
      utterance.onerror = () => setSpeaking(false)
      window.speechSynthesis.speak(utterance)
    } else return
    setSpeaking(true)
  }

  return { supported, speaking, toggle, label: soundUrl ? 'Putar suara' : 'Dengarkan info' }
}
