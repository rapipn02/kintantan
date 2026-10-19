import { lazy, Suspense, useCallback, useRef } from 'react'
import { getExhibit, getSpecies } from '../features/exhibits/catalog.ts'
import { ExhibitPanel } from '../features/exhibits/ExhibitPanel.tsx'
import { DiscoveryCard } from '../features/discovery/DiscoveryCard.tsx'
import { ScanSuccess } from '../features/discovery/ScanSuccess.tsx'
import { HelpDialog } from '../features/help/HelpDialog.tsx'
import { Hud } from '../features/hud/Hud.tsx'
import { Toast } from '../features/hud/Toast.tsx'
import { MapViewport, type MapViewportHandle } from '../features/map/MapViewport.tsx'
import { RotateDeviceOverlay } from '../features/orientation/RotateDeviceOverlay.tsx'
import { StartScreen } from '../features/orientation/StartScreen.tsx'
import { IntroTour } from '../features/tour/IntroTour.tsx'
import { warmUpQrDetector } from '../features/scanner/qrDetector.ts'
import { useGameStore } from './gameStore.ts'

const loadScanner = () => import('../features/scanner/ScannerModal.tsx')
const ScannerModal = lazy(loadScanner)

export function App() {
  const mapRef = useRef<MapViewportHandle>(null)
  const phase = useGameStore((state) => state.phase)
  const selectedId = useGameStore((state) => state.selectedId)
  const scanner = useGameStore((state) => state.scanner)
  const start = useGameStore((state) => state.start)
  const select = useGameStore((state) => state.select)
  const claim = useGameStore((state) => state.claim)
  const openScanner = useGameStore((state) => state.openScanner)
  const closeScanner = useGameStore((state) => state.closeScanner)
  const openHelp = useGameStore((state) => state.openHelp)
  const tourOpen = useGameStore((state) => state.tourOpen)

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

  const target = scanner?.targetId ? getExhibit(scanner.targetId) : undefined

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
          {/* Gambar tur sudah memuat HUD tergambar; HUD asli disembunyikan agar tidak dobel. */}
          {!tourOpen && (
            <Hud
              onScan={() => openScanner(null)}
              onHelp={openHelp}
              onOverview={() => mapRef.current?.showOverview()}
            />
          )}
          <ExhibitPanel />
        </>
      )}

      {scanner && (
        <Suspense fallback={<div className="absolute inset-0 z-50 bg-black" />}>
          <ScannerModal
            targetName={target ? getSpecies(target).name : undefined}
            onCode={handleCode}
            onClose={closeScanner}
          />
        </Suspense>
      )}

      <ScanSuccess />
      <DiscoveryCard />
      <IntroTour />
      <HelpDialog />
      {phase === 'intro' && <StartScreen onStart={handleStart} />}
      <Toast />
      <RotateDeviceOverlay />
    </main>
  )
}
