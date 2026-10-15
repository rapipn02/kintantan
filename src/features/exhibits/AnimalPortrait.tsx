import { MAP } from '../map/mapConfig.ts'
import { getSprite } from './sprites.ts'
import type { Exhibit } from './types.ts'

interface Props {
  exhibit: Exhibit
  found: boolean
  /** Perkiraan rasio lebar/tinggi bingkai, agar potongan peta pas tanpa area kosong. */
  aspect?: number
  className?: string
}

/** Ruang ekstra di sekitar hewan saat dipotong dari peta komposit. */
const PADDING = 0.15

/**
 * Gambar hewan untuk panel & kartu. Pakai sprite bila ada; kalau belum, potong langsung dari
 * peta komposit lewat viewBox SVG (gambar peta sudah ada di cache, jadi tanpa unduhan tambahan).
 */
export function AnimalPortrait({ exhibit, found, aspect = 1, className = '' }: Props) {
  const sprite = getSprite(exhibit.id)
  const hidden = !found

  if (sprite) {
    return (
      <div className={`relative grid place-items-center ${className}`}>
        <img
          src={sprite}
          alt=""
          draggable={false}
          className={`max-h-full max-w-full object-contain transition-[filter] duration-500 ${hidden ? 'brightness-0 opacity-50' : ''}`}
        />
        {hidden && <Mystery />}
      </div>
    )
  }

  const { x, y, w, h } = cropAround(exhibit, aspect)

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <svg
        viewBox={`${x} ${y} ${w} ${h}`}
        preserveAspectRatio="xMidYMid meet"
        className={`size-full transition-[filter] duration-500 ${hidden ? 'brightness-110 grayscale' : ''}`}
        aria-hidden="true"
      >
        <image href={MAP.src} width={MAP.width} height={MAP.height} />
      </svg>
      {hidden && <Mystery />}
    </div>
  )
}

/**
 * Kotak potong (piksel peta) di sekitar hewan dengan rasio `aspect`, digeser agar tetap
 * di dalam gambar peta (hewan di tepi peta tidak menghasilkan area kosong).
 */
function cropAround(exhibit: Exhibit, aspect: number) {
  const { box } = exhibit
  const animalW = box.w * MAP.width * (1 + PADDING * 2)
  const animalH = box.h * MAP.height * (1 + PADDING * 2)
  const w = Math.min(MAP.width, Math.max(animalW, animalH * aspect))
  const h = Math.min(MAP.height, w / aspect)
  const cx = (box.x + box.w / 2) * MAP.width
  const cy = (box.y + box.h / 2) * MAP.height
  return {
    x: Math.min(Math.max(cx - w / 2, 0), MAP.width - w),
    y: Math.min(Math.max(cy - h / 2, 0), MAP.height - h),
    w,
    h,
  }
}

function Mystery() {
  return (
    <span className="absolute bottom-2 left-2 grid size-9 place-items-center rounded-full border-[3px] border-white bg-ember text-lg font-bold text-white shadow-md">
      ?
    </span>
  )
}
