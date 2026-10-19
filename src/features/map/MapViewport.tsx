import { type Ref, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react'
import { getExhibit } from '../exhibits/catalog.ts'
import { CameraController } from './CameraController.ts'
import { ExhibitLayer } from './ExhibitLayer.tsx'
import { CAMERA, MAP } from './mapConfig.ts'
import { useMapGestures } from './useMapGestures.ts'

export interface MapViewportHandle {
  /** Terbang ke Titik Awal (pintu masuk). */
  flyToStart: () => void
  /** Terbang & zoom ke hewan tertentu. */
  flyToExhibit: (exhibitId: string) => void
  /** Kembali ke tampilan seluruh peta. */
  showOverview: () => void
}

interface Props {
  ref?: Ref<MapViewportHandle>
  selectedId: string | null
  onSelect: (exhibitId: string) => void
  onBackgroundTap: () => void
}

function exhibitCenter(exhibitId: string) {
  const exhibit = getExhibit(exhibitId)
  if (!exhibit) return null
  const { box } = exhibit
  return { x: (box.x + box.w / 2) * MAP.width, y: (box.y + box.h / 2) * MAP.height }
}

export function MapViewport({ ref, selectedId, onSelect, onBackgroundTap }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const worldRef = useRef<HTMLDivElement>(null)
  const [controller] = useState(
    () => new CameraController({ width: MAP.width, height: MAP.height }, CAMERA),
  )

  useLayoutEffect(() => {
    const container = containerRef.current
    const world = worldRef.current
    if (!container || !world) return
    controller.attach(world)
    const update = () =>
      controller.setViewport(
        { width: container.clientWidth, height: container.clientHeight },
        window.devicePixelRatio,
      )
    update()
    const observer = new ResizeObserver(update)
    observer.observe(container)

    // Pindah ke monitor dengan DPR lain sering tidak mengubah ukuran CSS, jadi pantau DPR juga.
    let dprQuery: MediaQueryList | null = null
    const watchDpr = () => {
      dprQuery?.removeEventListener('change', onDprChange)
      dprQuery = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`)
      dprQuery.addEventListener('change', onDprChange)
    }
    const onDprChange = () => {
      update()
      watchDpr()
    }
    watchDpr()

    return () => {
      observer.disconnect()
      dprQuery?.removeEventListener('change', onDprChange)
      controller.detach()
    }
  }, [controller])

  useImperativeHandle(
    ref,
    () => ({
      flyToStart: () =>
        controller.flyToPoint(
          { x: CAMERA.startPoint.x * MAP.width, y: CAMERA.startPoint.y * MAP.height },
          CAMERA.startZoom,
        ),
      flyToExhibit: (exhibitId) => {
        const center = exhibitCenter(exhibitId)
        if (center) controller.flyToPoint(center, CAMERA.focusZoom)
      },
      showOverview: () => controller.flyToPoint({ x: MAP.width / 2, y: MAP.height / 2 }, 1, 600),
    }),
    [controller],
  )

  const clickGuards = useMapGestures(containerRef, {
    controller,
    doubleTapFactor: CAMERA.doubleTapFactor,
    onBackgroundTap,
  })

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 touch-none overflow-hidden bg-meadow"
      data-testid="map-viewport"
      {...clickGuards}
    >
      <div
        ref={worldRef}
        className="map-world"
        data-testid="map-world"
        style={{ width: MAP.width, height: MAP.height }}
      >
        <img
          className="map-image"
          src={MAP.src}
          width={MAP.width}
          height={MAP.height}
          alt="Peta kebun binatang"
          draggable={false}
          decoding="async"
          fetchPriority="high"
          style={{ backgroundImage: `url(${MAP.placeholder})` }}
        />
        <ExhibitLayer selectedId={selectedId} onSelect={onSelect} />
      </div>
    </div>
  )
}
