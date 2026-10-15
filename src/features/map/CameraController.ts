import {
  type Camera,
  type CameraLimits,
  type Point,
  type Size,
  type ZoomOptions,
  centerOn,
  clamp,
  clampCamera,
  createLimits,
  easeInOutCubic,
  easeOutCubic,
  interpolateCamera,
  isWithinLimits,
  lerpCamera,
  screenToWorld,
  settleCamera,
  translateRange,
  worldToScreen,
  zoomAt,
} from './camera.ts'

/** Konstanta waktu peluruhan inersia (ms), mirip scroll iOS. */
const FLING_TAU = 325
/** Kecepatan lemparan maksimum (px/ms) agar peta tidak "terbang". */
const MAX_FLING_VELOCITY = 3.5

/** Langkah animasi; kembalikan `true` bila selesai. */
type Animation = (now: number) => boolean

export type CameraControllerOptions = Pick<
  ZoomOptions,
  'maxZoom' | 'maxPhysicalPixelsPerImagePixel'
>

/**
 * Pemilik state kamera. Menulis `transform` langsung ke DOM di requestAnimationFrame,
 * jadi menggeser/zoom peta tidak memicu render ulang React sama sekali.
 */
export class CameraController {
  private camera: Camera = { x: 0, y: 0, scale: 1 }
  private limits: CameraLimits | null = null
  private element: HTMLElement | null = null
  private frame = 0
  private animation: Animation | null = null
  private interacting = false
  private writtenScale = Number.NaN
  private endInteractionTimer = 0
  private readonly world: Size
  private readonly options: CameraControllerOptions

  constructor(world: Size, options: CameraControllerOptions) {
    this.world = world
    this.options = options
  }

  get state(): Camera {
    return { ...this.camera }
  }

  get bounds(): CameraLimits | null {
    return this.limits
  }

  attach(element: HTMLElement) {
    this.element = element
    this.writtenScale = Number.NaN
    this.schedule()
  }

  detach() {
    cancelAnimationFrame(this.frame)
    this.frame = 0
    this.animation = null
    this.element = null
  }

  /**
   * Dipanggil saat ukuran layar berubah (rotasi HP, address bar, resize) atau saat
   * `devicePixelRatio` berubah (jendela pindah ke monitor lain).
   */
  setViewport(viewport: Size, devicePixelRatio: number) {
    if (viewport.width <= 0 || viewport.height <= 0) return
    const previous = this.limits
    this.limits = createLimits(viewport, this.world, { ...this.options, devicePixelRatio })

    if (!previous) {
      // Pertama kali: tampilkan seluruh peta (overview) di tengah.
      this.camera = centerOn(
        { x: this.world.width / 2, y: this.world.height / 2 },
        this.limits.minScale,
        this.limits,
      )
    } else {
      // Pertahankan titik tengah & tingkat zoom relatif supaya rotasi tidak membuat peta melompat.
      const center = screenToWorld(
        { x: previous.viewport.width / 2, y: previous.viewport.height / 2 },
        this.camera,
      )
      const zoom = this.camera.scale / previous.minScale
      this.camera = centerOn(center, this.limits.minScale * zoom, this.limits)
    }
    this.animation = null
    this.schedule()
  }

  /** Set kamera langsung (dipakai selama jari masih menyentuh layar). */
  set(camera: Camera) {
    this.animation = null
    this.camera = camera
    this.schedule()
  }

  /** Hentikan animasi/inersia; dipanggil saat jari mulai menyentuh peta. */
  beginInteraction() {
    this.animation = null
    this.setInteracting(true)
  }

  /** Lepas jari setelah menggeser: lanjutkan dengan inersia lalu berhenti tepat di tepi. */
  fling(velocity: Point) {
    const limits = this.limits
    if (!limits) return
    if (!isWithinLimits(this.camera, limits)) {
      this.settle({ x: limits.viewport.width / 2, y: limits.viewport.height / 2 })
      return
    }
    const vx = clamp(velocity.x, -MAX_FLING_VELOCITY, MAX_FLING_VELOCITY)
    const vy = clamp(velocity.y, -MAX_FLING_VELOCITY, MAX_FLING_VELOCITY)
    const from = this.camera
    const range = translateRange(from.scale, limits)
    const target = {
      scale: from.scale,
      x: clamp(from.x + vx * FLING_TAU, range.x.min, range.x.max),
      y: clamp(from.y + vy * FLING_TAU, range.y.min, range.y.max),
    }
    const start = performance.now()
    this.run((now) => {
      const decay = Math.exp(-(now - start) / FLING_TAU)
      this.camera = {
        scale: from.scale,
        x: target.x + (from.x - target.x) * decay,
        y: target.y + (from.y - target.y) * decay,
      }
      if (Math.abs(target.x - this.camera.x) < 0.5 && Math.abs(target.y - this.camera.y) < 0.5) {
        this.camera = target
        return true
      }
      return false
    })
  }

  /** Pantulkan kembali ke batas sah (setelah ditarik/pinch melewati tepi). */
  settle(focal: Point, duration = 280) {
    const limits = this.limits
    if (!limits) return
    const target = settleCamera(this.camera, limits, focal)
    const from = this.camera
    this.animate(duration, (t) => lerpCamera(from, target, easeOutCubic(t)))
  }

  /** Zoom dengan faktor tertentu di sekitar titik layar (roda mouse, tombol, double-tap). */
  zoomBy(factor: number, focal: Point, animated = false) {
    const limits = this.limits
    if (!limits) return
    const scale = clamp(this.camera.scale * factor, limits.minScale, limits.maxScale)
    const target = clampCamera(zoomAt(this.camera, scale, focal), limits)
    if (animated) this.flyTo(target, 320)
    else {
      this.set(target)
      this.endInteractionSoon()
    }
  }

  /** Terbang ke titik dunia dengan zoom relatif terhadap skala cover. */
  flyToPoint(point: Point, zoom: number, duration = 900) {
    const limits = this.limits
    if (!limits) return
    const scale = clamp(limits.minScale * zoom, limits.minScale, limits.maxScale)
    this.flyTo(centerOn(point, scale, limits), duration)
  }

  /**
   * Geser seperlunya agar titik dunia terlihat di area layar yang tidak tertutup panel.
   * `insets` = bagian layar yang tertutup UI (px).
   */
  revealPoint(point: Point, insets: { right: number }) {
    const limits = this.limits
    if (!limits) return
    const margin = 32
    const visibleRight = limits.viewport.width - insets.right
    const screen = worldToScreen(point, this.camera)
    const hidden =
      screen.x < margin ||
      screen.x > visibleRight - margin ||
      screen.y < margin ||
      screen.y > limits.viewport.height - margin
    if (!hidden) return
    const anchor = { x: visibleRight / 2, y: limits.viewport.height / 2 }
    this.flyTo(centerOn(point, this.camera.scale, limits, anchor), 450)
  }

  private flyTo(target: Camera, duration: number) {
    const limits = this.limits
    if (!limits) return
    const from = this.camera
    this.animate(duration, (t) => interpolateCamera(from, target, easeInOutCubic(t), limits))
  }

  private animate(duration: number, frame: (t: number) => Camera) {
    const start = performance.now()
    this.run((now) => {
      const t = clamp((now - start) / duration, 0, 1)
      this.camera = frame(t)
      return t >= 1
    })
  }

  private run(animation: Animation) {
    this.setInteracting(true)
    this.animation = animation
    this.schedule()
  }

  private schedule() {
    if (!this.frame) this.frame = requestAnimationFrame(this.tick)
  }

  private readonly tick = (now: number) => {
    this.frame = 0
    if (this.animation && this.animation(now)) {
      this.animation = null
      this.endInteractionSoon()
    }
    this.write()
    if (this.animation) this.schedule()
  }

  /** Lepas `will-change` sesudah diam, agar browser merender ulang peta setajam zoom terakhir. */
  endInteractionSoon() {
    window.clearTimeout(this.endInteractionTimer)
    this.endInteractionTimer = window.setTimeout(() => {
      if (!this.animation) this.setInteracting(false)
    }, 150)
  }

  private setInteracting(value: boolean) {
    if (value) window.clearTimeout(this.endInteractionTimer)
    if (this.interacting === value) return
    this.interacting = value
    if (this.element) this.element.style.willChange = value ? 'transform' : ''
  }

  private write() {
    const el = this.element
    if (!el) return
    const { x, y, scale } = this.camera
    el.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale})`
    if (scale !== this.writtenScale) {
      // Dipakai CSS untuk menjaga ukuran badge & area sentuh tetap konstan di layar.
      el.style.setProperty('--inv-scale', String(1 / scale))
      this.writtenScale = scale
    }
  }
}
