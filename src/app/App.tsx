import { lazy, Suspense, useCallback, useRef } from 'react'
import { getExhibit, getSpecies } from '../features/exhibits/catalog.ts'
import { ExhibitPanel } from '../features/exhibits/ExhibitPanel.tsx'
import { DiscoveryCard } from '../features/discovery/DiscoveryCard.tsx'
import { Hud } from '../features/hud/Hud.tsx'
import { Toast } from '../features/hud/Toast.tsx'
import { MapViewport, type MapViewportHandle } from '../features/map/MapViewport.tsx'
import { RotateDeviceOverlay } from '../features/orientation/RotateDeviceOverlay.tsx'
import { StartScreen } from '../features/orientation/StartScreen.tsx'
import { warmUpQrDetector } from '../features/scanner/qrDetector.ts'
import { useGameStore } from './gameStore.ts'

const loadScanner = () => import('../features/scanner/ScannerModal.tsx')
const ScannerModal = lazy(loadScanner)

export function App() {
  const mapRef = useRef<MapViewportHandle>(null)
  const phase = useGameStore((state) => state.phase)
  const selectedId = useGameStore((state) => state.selectedId)
  const scanningFor = useGameStore((state) => state.scanningFor)
  const start = useGameStore((state) => state.start)
  const select = useGameStore((state) => state.select)
  const claim = useGameStore((state) => state.claim)
  const closeScanner = useGameStore((state) => state.closeScanner)

  const handleStart = () => {
    const pending = start()
    if (pending) mapRef.current?.flyToExhibit(pending.exhibitId)
    else mapRef.current?.flyToStart()
    // Siapkan pemindai di waktu senggang: kamera langsung siap & tetap jalan saat offline.
    void loadScanner()
    warmUpQrDetector()
  }

  const handleBackgroundTap = useCallback(() => select(null), [select])
  const handleCode = useCallback((raw: string) => claim(raw).ok, [claim])

  const target = scanningFor ? getExhibit(scanningFor) : undefined

  return (
    <main className="fixed inset-0 overflow-hidden">
      <MapViewport
        ref={mapRef}
        selectedId={selectedId}
        onSelect={select}
        onBackgroundTap={handleBackgroundTap}
      />

      {phase === 'playing' && (
        <>
          <Hud onOverview={() => mapRef.current?.showOverview()} />
          <ExhibitPanel />
        </>
      )}

      {target && (
        <Suspense fallback={<div className="absolute inset-0 z-50 bg-black" />}>
          <ScannerModal
            targetName={getSpecies(target).name}
            onCode={handleCode}
            onClose={closeScanner}
          />
        </Suspense>
      )}

      <DiscoveryCard />
      {phase === 'intro' && <StartScreen onStart={handleStart} />}
      <Toast />
      <RotateDeviceOverlay />
    </main>
  )
}
