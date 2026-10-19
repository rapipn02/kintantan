import { lazy, Suspense, useCallback, useEffect, useRef } from 'react'
import { getExhibit, getSpecies } from '../features/exhibits/catalog.ts'
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
import { ScannerFrame } from '../features/scanner/ScannerFrame.tsx'
import { readFlag } from '../shared/lib/storage.ts'
import { TOUR_SEEN_KEY, useGameStore } from './gameStore.ts'
import { preloadAfterStart, preloadBeforeStart, prepareScannerImage } from './preloadPlan.ts'

const loadScanner = () => import('../features/scanner/ScannerModal.tsx')
const ScannerModal = lazy(loadScanner)

export function App() {
  const mapRef = useRef<MapViewportHandle>(null)
  const phase = useGameStore((state) => state.phase)
  const selectedId = useGameStore((state) => state.selectedId)
  const scanner = useGameStore((state) => state.scanner)
  const start = useGameStore((state) => state.start)
  const select = useGameStore((state) => state.select)
  const openExhibit = useGameStore((state) => state.openExhibit)
  const claim = useGameStore((state) => state.claim)
  const openScanner = useGameStore((state) => state.openScanner)
  const closeScanner = useGameStore((state) => state.closeScanner)
  const openHelp = useGameStore((state) => state.openHelp)
  const tourOpen = useGameStore((state) => state.tourOpen)

  useEffect(() => {
    preloadBeforeStart(!readFlag(TOUR_SEEN_KEY))
  }, [])

  const handleStart = () => {
    const pending = start()
    if (pending) mapRef.current?.flyToExhibit(pending.exhibitId)
    else mapRef.current?.flyToStart()
    // Siapkan pemindai & gambar layar berikutnya di waktu senggang: tampil seketika, juga offline.
    void loadScanner()
    warmUpQrDetector()
    preloadAfterStart(useGameStore.getState().tourOpen)
  }

  /** Jari baru menyentuh tombol scan: mulai siapkan kode & gambar scanner sebelum jari diangkat. */
  const prepareScanner = useCallback(() => {
    void loadScanner()
    prepareScannerImage()
  }, [])

  const handleBackgroundTap = useCallback(() => select(null), [select])
  const handleCode = useCallback((raw: string) => claim(raw).ok, [claim])

  const target = scanner?.targetId ? getExhibit(scanner.targetId) : undefined

  return (
    <main className="fixed inset-0 overflow-hidden">
      <MapViewport
        ref={mapRef}
        selectedId={selectedId}
        onSelect={openExhibit}
        onBackgroundTap={handleBackgroundTap}
      />

      {phase === 'playing' && (
        <>
          {/* Gambar tur sudah memuat HUD tergambar; HUD asli disembunyikan agar tidak dobel. */}
          {!tourOpen && (
            <Hud
              onScan={() => openScanner(null)}
              onScanIntent={prepareScanner}
              onHelp={openHelp}
              onOverview={() => mapRef.current?.showOverview()}
            />
          )}
        </>
      )}

      {scanner && (
        // Selama kode kamera dimuat, bingkai desain scanner sudah tampil (bukan layar hitam).
        <Suspense
          fallback={
            <ScannerFrame
              targetName={target ? getSpecies(target).name : undefined}
              onClose={closeScanner}
            />
          }
        >
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
