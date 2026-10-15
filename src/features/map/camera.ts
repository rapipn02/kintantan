/**
 * Matematika kamera peta (murni, tanpa DOM) supaya mudah dites.
 *
 * Konvensi: titik layar = titik dunia * scale + (x, y).
 * "Dunia" adalah piksel gambar peta; "layar" adalah piksel CSS viewport.
 */

export interface Size {
  width: number
  height: number
}

export interface Point {
  x: number
  y: number
}

export interface Camera {
  x: number
  y: number
  scale: number
}

export interface CameraLimits {
  viewport: Size
  world: Size
  /** Skala "cover": peta selalu menutupi seluruh layar, jadi tidak pernah ada area kosong. */
  minScale: number
  maxScale: number
}

interface Range {
  min: number
  max: number
}

export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value))

export function coverScale(viewport: Size, world: Size): number {
  return Math.max(viewport.width / world.width, viewport.height / world.height)
}

export function createLimits(viewport: Size, world: Size, maxZoom: number): CameraLimits {
  const minScale = coverScale(viewport, world)
  return { viewport, world, minScale, maxScale: minScale * maxZoom }
}

/** Rentang translasi yang sah untuk skala tertentu (peta tidak boleh lepas dari tepi layar). */
export function translateRange(scale: number, limits: CameraLimits): { x: Range; y: Range } {
  const axis = (view: number, world: number): Range => {
    const content = world * scale
    if (content <= view) {
      // Hanya terjadi sesaat saat pinch melewati batas zoom-out: tempatkan di tengah.
      const center = (view - content) / 2
      return { min: center, max: center }
    }
    return { min: view - content, max: 0 }
  }
  return {
    x: axis(limits.viewport.width, limits.world.width),
    y: axis(limits.viewport.height, limits.world.height),
  }
}

/** Paksa kamera ke dalam batas: skala di [min, max] dan peta menempel di tepi ("mentok"). */
export function clampCamera(camera: Camera, limits: CameraLimits): Camera {
  const scale = clamp(camera.scale, limits.minScale, limits.maxScale)
  const range = translateRange(scale, limits)
  return {
    scale,
    x: clamp(camera.x, range.x.min, range.x.max),
    y: clamp(camera.y, range.y.min, range.y.max),
  }
}

export function screenToWorld(point: Point, camera: Camera): Point {
  return { x: (point.x - camera.x) / camera.scale, y: (point.y - camera.y) / camera.scale }
}

export function worldToScreen(point: Point, camera: Camera): Point {
  return { x: point.x * camera.scale + camera.x, y: point.y * camera.scale + camera.y }
}

/** Ubah skala sambil menjaga titik dunia di bawah `focal` (koordinat layar) tetap di tempat. */
export function zoomAt(camera: Camera, scale: number, focal: Point): Camera {
  const k = scale / camera.scale
  return {
    scale,
    x: focal.x - (focal.x - camera.x) * k,
    y: focal.y - (focal.y - camera.y) * k,
  }
}

/** Kamera dengan titik dunia `point` di tengah layar (atau di `anchor` bila diberikan), sudah di-clamp. */
export function centerOn(
  point: Point,
  scale: number,
  limits: CameraLimits,
  anchor: Point = { x: limits.viewport.width / 2, y: limits.viewport.height / 2 },
): Camera {
  return clampCamera(
    { scale, x: anchor.x - point.x * scale, y: anchor.y - point.y * scale },
    limits,
  )
}

/**
 * Efek karet ala iOS: jarak yang melewati tepi diperkecil, makin jauh makin berat.
 * Hasilnya selalu < `dimension`, jadi peta tidak bisa ditarik jauh dari tepi.
 */
export function rubberband(overshoot: number, dimension: number, constant = 0.55): number {
  const distance = Math.abs(overshoot)
  return Math.sign(overshoot) * (1 - 1 / ((distance * constant) / dimension + 1)) * dimension
}

export function rubberbandClamp(value: number, range: Range, dimension: number): number {
  if (value < range.min) return range.min + rubberband(value - range.min, dimension)
  if (value > range.max) return range.max + rubberband(value - range.max, dimension)
  return value
}

/** Versi karet untuk skala: melewati batas zoom terasa berat lalu memantul balik saat dilepas. */
export function rubberbandScale(
  scale: number,
  min: number,
  max: number,
  resistance = 0.35,
): number {
  if (scale < min) return min * Math.pow(scale / min, resistance)
  if (scale > max) return max * Math.pow(scale / max, resistance)
  return scale
}

export function rubberbandCamera(camera: Camera, limits: CameraLimits): Camera {
  const range = translateRange(camera.scale, limits)
  return {
    scale: camera.scale,
    x: rubberbandClamp(camera.x, range.x, limits.viewport.width),
    y: rubberbandClamp(camera.y, range.y, limits.viewport.height),
  }
}

export function isWithinLimits(camera: Camera, limits: CameraLimits, epsilon = 0.5): boolean {
  const clamped = clampCamera(camera, limits)
  return (
    Math.abs(clamped.x - camera.x) < epsilon &&
    Math.abs(clamped.y - camera.y) < epsilon &&
    Math.abs(clamped.scale - camera.scale) < 1e-4
  )
}

/** Posisi akhir yang sah setelah gesture dilepas: skala dikembalikan ke batas di sekitar `focal`. */
export function settleCamera(camera: Camera, limits: CameraLimits, focal: Point): Camera {
  const scale = clamp(camera.scale, limits.minScale, limits.maxScale)
  return clampCamera(zoomAt(camera, scale, focal), limits)
}

export const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)
export const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2

/**
 * Interpolasi kamera yang terasa alami (seperti "fly to" di peta): titik tengah bergerak linear,
 * skala bergerak secara logaritmik.
 */
export function interpolateCamera(
  from: Camera,
  to: Camera,
  t: number,
  limits: CameraLimits,
): Camera {
  const mid = { x: limits.viewport.width / 2, y: limits.viewport.height / 2 }
  const a = screenToWorld(mid, from)
  const b = screenToWorld(mid, to)
  const scale = from.scale * Math.pow(to.scale / from.scale, t)
  const center = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }
  return clampCamera({ scale, x: mid.x - center.x * scale, y: mid.y - center.y * scale }, limits)
}

/** Interpolasi lurus tanpa clamp; dipakai untuk memantul balik dari posisi karet ke batas. */
export function lerpCamera(from: Camera, to: Camera, t: number): Camera {
  return {
    x: from.x + (to.x - from.x) * t,
    y: from.y + (to.y - from.y) * t,
    scale: from.scale + (to.scale - from.scale) * t,
  }
}
