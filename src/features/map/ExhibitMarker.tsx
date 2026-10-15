import { type CSSProperties, memo } from 'react'
import { getSpecies } from '../exhibits/catalog.ts'
import { getSprite } from '../exhibits/sprites.ts'
import type { Exhibit } from '../exhibits/types.ts'

interface Props {
  exhibit: Exhibit
  found: boolean
  selected: boolean
  index: number
  onSelect: (exhibitId: string) => void
}

/** Tombol hewan di peta. Posisinya dalam persen dunia, jadi ikut terskala bersama peta. */
export const ExhibitMarker = memo(function ExhibitMarker({
  exhibit,
  found,
  selected,
  index,
  onSelect,
}: Props) {
  const { box } = exhibit
  const species = getSpecies(exhibit)
  const sprite = getSprite(exhibit.id)

  const style = {
    left: `${box.x * 100}%`,
    top: `${box.y * 100}%`,
    width: `${box.w * 100}%`,
    height: `${box.h * 100}%`,
    // Badge tidak bergoyang serempak.
    '--bob-delay': `${(index % 7) * -0.37}s`,
  } as CSSProperties

  return (
    <button
      type="button"
      className="exhibit-marker"
      data-exhibit={exhibit.id}
      aria-pressed={selected}
      aria-label={found ? `${species.name}, sudah ditemukan` : `${species.name}, belum ditemukan`}
      style={style}
      onClick={() => onSelect(exhibit.id)}
    >
      {sprite && (
        <img
          className="marker-sprite"
          src={sprite}
          alt=""
          draggable={false}
          decoding="async"
          data-found={found}
        />
      )}
      <span className="marker-badge" data-found={found} aria-hidden="true">
        {found ? '✓' : '?'}
      </span>
    </button>
  )
})
