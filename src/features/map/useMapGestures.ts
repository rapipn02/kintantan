import { useGesture } from '@use-gesture/react'
import { type MouseEvent, type RefObject, useRef } from 'react'
import type { CameraController } from './CameraController.ts'
import {
  type Camera,
  type Point,
  rubberbandCamera,
  rubberbandClamp,
  rubberbandScale,
  screenToWorld,
  translateRange,
} from './camera.ts'

const DOUBLE_TAP_MS = 300
const DOUBLE_TAP_DISTANCE = 32
/** Sensitivitas roda mouse (desktop). */
const WHEEL_ZOOM_SPEED = 0.0015

interface Options {
  controller: CameraController
  doubleTapFactor: number
  /** Tap di area peta yang bukan hewan. */
  onBackgroundTap?: () => void
}

interface PinchMemo {
  start: Camera
  /** Titik dunia di bawah titik tengah dua jari saat pinch dimulai. */
  anchor: Point
}

/** Ambil titik relatif terhadap container peta. */
function toLocal(element: HTMLElement, clientX: number, clientY: number): Point {
  const rect = element.getBoundingClientRect()
  return { x: clientX - rect.left, y: clientY - rect.top }
}

function isExhibitTarget(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest('[data-exhibit]') !== null
}

/**
 * Gesture peta: geser (dengan inersia & efek karet di tepi), pinch dua jari,
 * double-tap zoom, dan roda mouse. Mengembalikan handler untuk mencegah klik hewan
 * yang tidak sengaja terjadi di akhir geseran.
 */
export function useMapGestures(
  target: RefObject<HTMLElement | null>,
  { controller, doubleTapFactor, onBackgroundTap }: Options,
) {
  const suppressClick = useRef(false)
  const lastTap = useRef<{ time: number; point: Point } | null>(null)

  const handleTap = (element: HTMLElement, event: Event, clientX: number, clientY: number) => {
    if (isExhibitTarget(event.target)) return // klik hewan ditangani tombolnya sendiri
    const point = toLocal(element, clientX, clientY)
    const now = performance.now()
    const previous = lastTap.current
    if (
      previous &&
      now - previous.time < DOUBLE_TAP_MS &&
      Math.hypot(point.x - previous.point.x, point.y - previous.point.y) < DOUBLE_TAP_DISTANCE
    ) {
      lastTap.current = null
      controller.zoomBy(doubleTapFactor, point, true)
      return
    }
    lastTap.current = { time: now, point }
    onBackgroundTap?.()
  }

  useGesture(
    {
      onDrag: ({
        first,
        last,
        tap,
        pinching,
        cancel,
        movement: [mx, my],
        velocity,
        direction,
        event,
        xy,
        memo,
      }) => {
        const element = target.current
        const limits = controller.bounds
        if (!element || !limits) return memo
        if (pinching) {
          cancel()
          return memo
        }
        // Dengan filterTaps, tap hanya dilaporkan sekali saat jari diangkat (tanpa first/last).
        if (tap) {
          handleTap(element, event, xy[0], xy[1])
          return memo
        }

        const start: Camera = first || !memo ? controller.state : memo
        if (first) controller.beginInteraction()

        const range = translateRange(start.scale, limits)
        controller.set({
          scale: start.scale,
          x: rubberbandClamp(start.x + mx, range.x, limits.viewport.width),
          y: rubberbandClamp(start.y + my, range.y, limits.viewport.height),
        })

        if (last) {
          suppressClick.current = true
          controller.fling({ x: velocity[0] * direction[0], y: velocity[1] * direction[1] })
        }
        return start
      },

      onPinch: ({ first, last, origin: [ox, oy], movement: [ratio], memo }) => {
        const element = target.current
        const limits = controller.bounds
        if (!element || !limits) return memo
        const origin = toLocal(element, ox, oy)

        let data = memo as PinchMemo | undefined
        if (first || !data) {
          controller.beginInteraction()
          suppressClick.current = true
          const start = controller.state
          data = { start, anchor: screenToWorld(origin, start) }
        }

        const scale = rubberbandScale(data.start.scale * ratio, limits.minScale, limits.maxScale)
        // Titik dunia di bawah jari tetap di bawah jari, termasuk saat dua jari ikut menggeser.
        controller.set(
          rubberbandCamera(
            { scale, x: origin.x - data.anchor.x * scale, y: origin.y - data.anchor.y * scale },
            limits,
          ),
        )

        if (last) controller.settle(origin)
        return data
      },

      onWheel: ({ event, delta: [, dy] }) => {
        const element = target.current
        // ctrl + wheel = pinch di trackpad, sudah ditangani onPinch.
        if (!element || event.ctrlKey || dy === 0) return
        event.preventDefault()
        const focal = toLocal(element, event.clientX, event.clientY)
        controller.zoomBy(Math.exp(-dy * WHEEL_ZOOM_SPEED), focal)
      },
    },
    {
      target,
      eventOptions: { passive: false },
      drag: {
        filterTaps: true,
        // Tanpa pointer capture supaya event klik tetap sampai ke tombol hewan.
        pointer: { capture: false },
      },
      pinch: {
        pointer: { touch: true },
      },
    },
  )

  return {
    /** Pasang di container sebagai `onPointerDownCapture`. */
    onPointerDownCapture: () => {
      suppressClick.current = false
    },
    /** Pasang di container sebagai `onClickCapture`: batalkan klik di akhir geseran/pinch. */
    onClickCapture: (event: MouseEvent) => {
      if (suppressClick.current) {
        event.preventDefault()
        event.stopPropagation()
        suppressClick.current = false
      }
    },
  }
}
