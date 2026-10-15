import { expect, type Page } from '@playwright/test'
import { EXHIBITS } from '../src/features/exhibits/catalog.ts'

export const VIEWPORT = { width: 844, height: 390 }
export const WORLD = { width: 1975, height: 1028 }

export function tokenOf(exhibitId: string): string {
  const exhibit = EXHIBITS.find((e) => e.id === exhibitId)
  if (!exhibit) throw new Error(`exhibit ${exhibitId} tidak ada`)
  return exhibit.token
}

export async function startGame(page: Page) {
  await page.getByRole('button', { name: /Petualangan/ }).tap()
  await waitForCameraToSettle(page)
}

export async function worldRect(page: Page) {
  const box = await page.getByTestId('map-world').boundingBox()
  if (!box) throw new Error('peta tidak terlihat')
  return box
}

/** Tunggu sampai animasi kamera (terbang/inersia/pantulan) selesai. */
export async function waitForCameraToSettle(page: Page) {
  let previous = ''
  await expect
    .poll(
      async () => {
        const current = JSON.stringify(await worldRect(page))
        const stable = current === previous
        previous = current
        return stable
      },
      { intervals: [150], timeout: 5000 },
    )
    .toBe(true)
}

/** Peta harus selalu menutupi layar penuh (mentok di tepi, tidak ada area kosong). */
export async function expectMapCoversViewport(page: Page) {
  const rect = await worldRect(page)
  expect(rect.x).toBeLessThanOrEqual(0.5)
  expect(rect.y).toBeLessThanOrEqual(0.5)
  expect(rect.x + rect.width).toBeGreaterThanOrEqual(VIEWPORT.width - 0.5)
  expect(rect.y + rect.height).toBeGreaterThanOrEqual(VIEWPORT.height - 0.5)
}

async function touch(page: Page) {
  return page.context().newCDPSession(page)
}

/** Geser satu jari dari `from` sejauh `delta` (px). */
export async function swipe(
  page: Page,
  from: { x: number; y: number },
  delta: { x: number; y: number },
  steps = 12,
) {
  const cdp = await touch(page)
  const point = (t: number) => [{ x: from.x + delta.x * t, y: from.y + delta.y * t, id: 1 }]
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: point(0) })
  for (let i = 1; i <= steps; i++) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: point(i / steps) })
    await page.waitForTimeout(16)
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  await cdp.detach()
}

/** Pinch dua jari di sekitar `center`, jarak jari dari `start` ke `end` px. */
export async function pinch(
  page: Page,
  center: { x: number; y: number },
  start: number,
  end: number,
  steps = 12,
) {
  const cdp = await touch(page)
  const points = (distance: number) => [
    { x: center.x - distance / 2, y: center.y, id: 1 },
    { x: center.x + distance / 2, y: center.y, id: 2 },
  ]
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: points(start) })
  for (let i = 1; i <= steps; i++) {
    const distance = start + ((end - start) * i) / steps
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: points(distance) })
    await page.waitForTimeout(16)
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  await cdp.detach()
}

export async function tapExhibit(page: Page, exhibitId: string) {
  const box = await page.locator(`[data-exhibit="${exhibitId}"]`).boundingBox()
  if (!box) throw new Error(`hewan ${exhibitId} tidak terlihat`)
  await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2)
}

/** Koordinat layar untuk titik di peta (piksel gambar). */
export async function screenPoint(page: Page, world: { x: number; y: number }) {
  const rect = await worldRect(page)
  const scale = rect.width / WORLD.width
  return { x: rect.x + world.x * scale, y: rect.y + world.y * scale }
}
