import { EXHIBITS } from '../exhibits/catalog.ts'
import { useDiscoveryStore } from '../discovery/discoveryStore.ts'
import { ExhibitMarker } from './ExhibitMarker.tsx'

interface Props {
  selectedId: string | null
  onSelect: (exhibitId: string) => void
}

export function ExhibitLayer({ selectedId, onSelect }: Props) {
  const found = useDiscoveryStore((state) => state.found)
  return (
    <div className="absolute inset-0" role="group" aria-label="Hewan di peta">
      {EXHIBITS.map((exhibit, index) => (
        <ExhibitMarker
          key={exhibit.id}
          exhibit={exhibit}
          index={index}
          found={Boolean(found[exhibit.id])}
          selected={selectedId === exhibit.id}
          onSelect={onSelect}
        />
      ))}
    </div>
  )
}
