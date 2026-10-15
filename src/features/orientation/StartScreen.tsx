import { TOTAL_EXHIBITS } from '../exhibits/catalog.ts'
import { useFoundCount } from '../discovery/discoveryStore.ts'
import { PawIcon } from '../../shared/ui/icons.tsx'
import { enterImmersiveMode } from './immersive.ts'

interface Props {
  onStart: () => void
}

/**
 * Layar pembuka. Tombolnya sekaligus menjadi "gesture pengguna" yang dibutuhkan browser
 * untuk masuk layar penuh & mengunci landscape.
 */
export function StartScreen({ onStart }: Props) {
  const found = useFoundCount()

  const start = () => {
    void enterImmersiveMode()
    onStart()
  }

  return (
    <div className="safe-pad absolute inset-0 z-30 grid animate-fade-in place-items-center bg-gradient-to-b from-grass/70 to-forest/80 backdrop-blur-[3px]">
      <div className="flex flex-col items-center gap-3 text-center text-white">
        <span className="grid size-16 place-items-center rounded-3xl bg-white text-bark shadow-lg">
          <PawIcon className="size-10" />
        </span>
        <h1 className="text-5xl font-bold tracking-tight drop-shadow-[0_3px_0_rgb(0_0_0/0.2)]">
          Kintantan
        </h1>
        <p className="max-w-md text-lg leading-snug text-white/95">
          Jelajahi kebun binatang, datangi kandangnya, scan QR, dan kumpulkan semua kartu hewan!
        </p>
        {found > 0 && (
          <p className="rounded-full bg-white/20 px-3 py-1 text-sm font-semibold">
            Koleksimu: {found}/{TOTAL_EXHIBITS} hewan
          </p>
        )}
        <button type="button" className="btn-primary mt-1 px-8 text-xl" onClick={start} autoFocus>
          {found > 0 ? 'Lanjut Petualangan' : 'Mulai Petualangan'}
        </button>
      </div>
    </div>
  )
}
