import { describe, expect, it } from 'vitest'
import {
  type Camera,
  centerOn,
  clampCamera,
  coverScale,
  createLimits,
  interpolateCamera,
  isWithinLimits,
  rubberband,
  rubberbandCamera,
  rubberbandScale,
  screenToWorld,
  settleCamera,
  translateRange,
  zoomAt,
} from './camera.ts'

const world = { width: 1975, height: 1028 }
const phone = { width: 844, height: 390 }
const zoom = { maxZoom: 4, devicePixelRatio: 1, maxPhysicalPixelsPerImagePixel: 2.5 }
const limits = createLimits(phone, world, zoom)

describe('coverScale', () => {
  it('menutupi seluruh layar (tidak ada area kosong)', () => {
    const scale = coverScale(phone, world)
    expect(world.width * scale).toBeGreaterThanOrEqual(phone.width - 1e-9)
    expect(world.height * scale).toBeGreaterThanOrEqual(phone.height - 1e-9)
  })

  it('memakai sisi yang paling "ketat" untuk layar tinggi', () => {
    const tablet = { width: 768, height: 1024 }
    expect(coverScale(tablet, world)).toBeCloseTo(1024 / 1028)
  })
})

describe('createLimits', () => {
  // Peta HD: cover di HP = 390/2161 ≈ 0.18, jadi 4x cover ≈ 0.72.
  const hd = { width: 4150, height: 2161 }

  it.each([
    { dpr: 1, viewport: { width: 2560, height: 1440 } },
    { dpr: 2, viewport: { width: 1440, height: 900 } },
    { dpr: 3, viewport: { width: 1440, height: 900 } },
  ])('zoom maksimum dibatasi resolusi gambar untuk DPR $dpr', ({ dpr, viewport }) => {
    const l = createLimits(viewport, hd, { ...zoom, devicePixelRatio: dpr })
    // 1 piksel gambar = tepat 2.5 piksel fisik, masih di bawah 4x cover dan di atas 1.5x cover.
    expect(l.maxScale).toBeCloseTo(2.5 / dpr)
    expect(l.maxScale).toBeLessThan(l.minScale * 4)
    expect(l.maxScale).toBeGreaterThan(l.minScale * 1.5)
  })

  it('selalu menyisakan minimal 1.5x zoom walau gambarnya kecil', () => {
    const tiny = { width: 400, height: 208 }
    for (const dpr of [1, 2, 3]) {
      const l = createLimits(phone, tiny, { ...zoom, devicePixelRatio: dpr })
      expect(l.maxScale).toBeCloseTo(l.minScale * 1.5)
    }
  })

  it('untuk gambar besar, batasnya kembali ke maxZoom (4x)', () => {
    const l = createLimits(phone, hd, { ...zoom, devicePixelRatio: 3 })
    expect(l.minScale * 4 * 3).toBeLessThan(2.5)
    expect(l.maxScale).toBeCloseTo(l.minScale * 4)
  })
})

describe('clampCamera', () => {
  it('peta mentok di tepi kiri-atas', () => {
    const cam = clampCamera({ x: 500, y: 300, scale: limits.minScale }, limits)
    expect(cam.x).toBe(0)
    expect(cam.y).toBe(0)
  })

  it('peta mentok di tepi kanan-bawah', () => {
    const scale = limits.minScale * 2
    const cam = clampCamera({ x: -1e6, y: -1e6, scale }, limits)
    expect(cam.x).toBeCloseTo(phone.width - world.width * scale)
    expect(cam.y).toBeCloseTo(phone.height - world.height * scale)
  })

  it('membatasi skala ke [min, max]', () => {
    expect(clampCamera({ x: 0, y: 0, scale: 0.01 }, limits).scale).toBe(limits.minScale)
    expect(clampCamera({ x: 0, y: 0, scale: 99 }, limits).scale).toBe(limits.maxScale)
  })
})

describe('zoomAt', () => {
  it('titik di bawah jari tidak bergeser saat zoom', () => {
    const cam: Camera = { x: -120, y: -40, scale: 0.6 }
    const focal = { x: 300, y: 200 }
    const before = screenToWorld(focal, cam)
    const after = screenToWorld(focal, zoomAt(cam, 1.3, focal))
    expect(after.x).toBeCloseTo(before.x)
    expect(after.y).toBeCloseTo(before.y)
  })
})

describe('centerOn', () => {
  it('menaruh titik dunia di tengah layar bila tidak terhalang tepi', () => {
    const point = { x: world.width / 2, y: world.height / 2 }
    const cam = centerOn(point, limits.minScale * 2, limits)
    const center = screenToWorld({ x: phone.width / 2, y: phone.height / 2 }, cam)
    expect(center.x).toBeCloseTo(point.x)
    expect(center.y).toBeCloseTo(point.y)
  })

  it('tetap di dalam batas untuk titik di pojok peta', () => {
    const cam = centerOn({ x: 0, y: world.height }, limits.minScale * 1.8, limits)
    expect(isWithinLimits(cam, limits)).toBe(true)
    expect(cam.x).toBe(0)
  })
})

describe('rubberband', () => {
  it('jarak tarikan diperkecil dan tidak pernah melebihi ukuran layar', () => {
    expect(rubberband(0, 400)).toBe(0)
    expect(Math.abs(rubberband(100, 400))).toBeLessThan(100)
    expect(Math.abs(rubberband(1e6, 400))).toBeLessThan(400)
    expect(rubberband(-100, 400)).toBeCloseTo(-rubberband(100, 400))
  })

  it('makin jauh ditarik, makin jauh bergerak (monoton)', () => {
    expect(rubberband(200, 400)).toBeGreaterThan(rubberband(100, 400))
  })

  it('tidak mengubah posisi yang masih sah', () => {
    const cam = { x: -100, y: -20, scale: limits.minScale * 1.5 }
    expect(rubberbandCamera(cam, limits)).toEqual(cam)
  })

  it('skala melewati batas terasa berat', () => {
    const over = rubberbandScale(limits.maxScale * 2, limits.minScale, limits.maxScale)
    expect(over).toBeGreaterThan(limits.maxScale)
    expect(over).toBeLessThan(limits.maxScale * 2)
  })
})

describe('settleCamera', () => {
  it('memantul kembali ke batas sah', () => {
    const out = { x: 200, y: 150, scale: limits.minScale * 0.7 }
    const settled = settleCamera(out, limits, { x: 400, y: 200 })
    expect(isWithinLimits(settled, limits)).toBe(true)
    expect(settled.scale).toBe(limits.minScale)
  })
})

describe('translateRange', () => {
  it('menengahkan konten yang lebih kecil dari layar (sesaat saat pinch-out)', () => {
    const range = translateRange(limits.minScale * 0.5, limits)
    expect(range.x.min).toBe(range.x.max)
    expect(range.x.min).toBeGreaterThan(0)
  })
})

describe('interpolateCamera', () => {
  it('mulai dan berakhir tepat di kamera asal & tujuan', () => {
    const from = centerOn({ x: 1000, y: 500 }, limits.minScale, limits)
    const to = centerOn({ x: 100, y: 950 }, limits.minScale * 2, limits)
    const start = interpolateCamera(from, to, 0, limits)
    const end = interpolateCamera(from, to, 1, limits)
    expect(start.x).toBeCloseTo(from.x)
    expect(start.scale).toBeCloseTo(from.scale)
    expect(end.x).toBeCloseTo(to.x)
    expect(end.y).toBeCloseTo(to.y)
    expect(end.scale).toBeCloseTo(to.scale)
  })

  it('setiap frame tetap di dalam batas', () => {
    const from = centerOn({ x: 1900, y: 50 }, limits.minScale * 3, limits)
    const to = centerOn({ x: 50, y: 1000 }, limits.minScale * 1.2, limits)
    for (let t = 0; t <= 1; t += 0.05) {
      expect(isWithinLimits(interpolateCamera(from, to, t, limits), limits)).toBe(true)
    }
  })
})
