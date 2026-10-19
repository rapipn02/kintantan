import { expect, test } from '@playwright/test'
import {
  closeCard,
  expectMapCoversViewport,
  pinch,
  screenPoint,
  skipHelp,
  startGame,
  swipe,
  tapExhibit,
  tokenOf,
  VIEWPORT,
  waitForCameraToSettle,
  worldRect,
} from './helpers.ts'

test.beforeEach(async ({ page }) => {
  await skipHelp(page)
  await page.goto('/')
})

test('layar pembuka lalu peta dengan progres 0/57', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Kintantan' })).toBeVisible()
  await startGame(page)
  await expect(page.getByTestId('hud-progress')).toHaveAccessibleName('0 dari 57 hewan ditemukan')
  await expectMapCoversViewport(page)
})

test('peta digeser mentok di tepi dan memantul balik', async ({ page }) => {
  await startGame(page)
  const center = { x: VIEWPORT.width / 2, y: VIEWPORT.height / 2 }

  // Kamera awal ada di Titik Awal (kiri-bawah): tarik ke kanan-bawah melewati tepi kiri.
  await swipe(page, center, { x: 300, y: -250 })
  await waitForCameraToSettle(page)
  await expectMapCoversViewport(page)
  expect((await worldRect(page)).x).toBeCloseTo(0, 0)

  // Geser jauh ke kiri berkali-kali: harus berhenti tepat di tepi kanan peta.
  for (let i = 0; i < 4; i++) await swipe(page, center, { x: -500, y: 0 }, 6)
  await waitForCameraToSettle(page)
  await expectMapCoversViewport(page)
  const rect = await worldRect(page)
  expect(rect.x + rect.width).toBeCloseTo(VIEWPORT.width, 0)
})

test('pinch zoom dibatasi antara seluruh peta dan zoom maksimum', async ({ page }) => {
  await startGame(page)
  const center = { x: 320, y: 200 }

  for (let i = 0; i < 4; i++) await pinch(page, center, 80, 400)
  await waitForCameraToSettle(page)
  await expectMapCoversViewport(page)

  // Zoom maksimum mengikuti resolusi gambar & DPR (lihat `createLimits` di camera.ts).
  const { dpr, worldWidth, worldHeight } = await page.getByTestId('map-world').evaluate((el) => ({
    dpr: window.devicePixelRatio,
    worldWidth: (el as HTMLElement).offsetWidth,
    worldHeight: (el as HTMLElement).offsetHeight,
  }))
  const cover = Math.max(VIEWPORT.width / worldWidth, VIEWPORT.height / worldHeight)
  const maxScale = Math.max(cover * 1.5, Math.min(cover * 4, 2.5 / dpr))
  const maxWidth = (await worldRect(page)).width
  expect(maxWidth).toBeCloseTo(worldWidth * maxScale, 0)

  // Pinch tambahan tidak menambah zoom.
  await pinch(page, center, 80, 400)
  await waitForCameraToSettle(page)
  expect((await worldRect(page)).width).toBeCloseTo(maxWidth, 0)

  for (let i = 0; i < 5; i++) await pinch(page, center, 400, 60)
  await waitForCameraToSettle(page)
  await expectMapCoversViewport(page)
  expect((await worldRect(page)).width).toBeCloseTo(VIEWPORT.width, 0)
})

test('tap hewan yang belum ditemukan langsung membuka kamera kandangnya', async ({ page }) => {
  await startGame(page)
  await tapExhibit(page, 'gajah')
  const scanner = page.getByRole('dialog', { name: 'Scan QR kandang Gajah Sumatera' })
  await expect(scanner).toBeVisible()
  await expect(page.getByRole('complementary')).toHaveCount(0)

  await scanner.getByRole('button', { name: 'Tutup kamera' }).tap()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.locator('[data-exhibit="gajah"]')).toHaveAttribute('aria-pressed', 'false')
})

test('menggeser peta yang dimulai di atas hewan tidak membuka kamera', async ({ page }) => {
  await startGame(page)
  const box = (await page.locator('[data-exhibit="zebra"]').boundingBox())!
  await swipe(page, { x: box.x + box.width / 2, y: box.y + box.height / 2 }, { x: -150, y: 0 })
  await waitForCameraToSettle(page)
  await expect(page.getByRole('dialog')).toHaveCount(0)
})

test('double-tap memperbesar peta', async ({ page }) => {
  await startGame(page)
  const before = (await worldRect(page)).width
  const empty = await screenPoint(page, { x: 0.28, y: 0.615 })
  await page.touchscreen.tap(empty.x, empty.y)
  await page.touchscreen.tap(empty.x, empty.y)
  await waitForCameraToSettle(page)
  expect((await worldRect(page)).width).toBeGreaterThan(before * 1.5)
  await expectMapCoversViewport(page)
})

test('link QR (kamera bawaan / NFC) membuka kartu dan progres tersimpan', async ({ page }) => {
  await page.goto(`/s/${tokenOf('beruang-madu')}`)
  await expect(page).toHaveURL(/\/$/)
  await page.getByRole('button', { name: /Petualangan/ }).tap()

  // Popup "Pindai berhasil" dulu (±1,6 detik), lalu kartu hewan.
  await expect(page.getByRole('img', { name: 'Pindai berhasil' })).toBeVisible()
  const card = page.getByRole('dialog', { name: 'Beruang Madu' })
  await expect(card).toBeVisible()
  await expect(page.getByRole('img', { name: 'Pindai berhasil' })).toBeHidden()
  // Status tampil sebagai toast supaya tidak menutupi gambar kartu.
  await expect(page.getByText('Hewan Baru Ditemukan! (1/57)')).toBeVisible()
  await expect(card.getByText('Helarctos malayanus').first()).toBeVisible()
  await expect(card.getByText('Asia Tenggara')).toBeVisible()

  const taxonomy = card.getByRole('complementary', { name: 'Taksonomi' })
  await expect(taxonomy).toBeHidden()
  await card.getByRole('button', { name: 'Taksonomi' }).tap()
  await expect(taxonomy.getByText('Ursidae')).toBeVisible()

  // Sekali ketuk di tempat kosong tidak menutup kartu; ketuk dua kali baru menutup.
  await page.touchscreen.tap(6, 195)
  await page.waitForTimeout(500)
  await expect(card).toBeVisible()
  await closeCard(page)

  await expect(page.getByTestId('hud-progress')).toHaveAccessibleName('1 dari 57 hewan ditemukan')
  await expect(page.locator('[data-exhibit="beruang-madu"]')).toHaveAccessibleName(
    'Beruang Madu, sudah ditemukan',
  )

  // Hewan yang sudah ditemukan: ketuk langsung membuka kartunya (tanpa kamera).
  await tapExhibit(page, 'beruang-madu')
  await expect(page.getByRole('dialog', { name: 'Beruang Madu' })).toBeVisible()
  await expect(page.getByRole('dialog', { name: /Scan/ })).toHaveCount(0)
  await closeCard(page)

  await page.reload()
  await expect(page.getByText('Koleksimu: 1/57 hewan')).toBeVisible()
  await startGame(page)
  await expect(page.getByTestId('hud-progress')).toHaveAccessibleName('1 dari 57 hewan ditemukan')
})

test('link QR yang tidak dikenal menampilkan pesan', async ({ page }) => {
  await page.goto('/s/zzzzzzzz')
  await expect(page.getByText('QR tidak dikenali')).toBeVisible()
})

test('kode bisa diketik manual bila kamera tidak tersedia', async ({ page }) => {
  await startGame(page)
  await tapExhibit(page, 'gajah')

  const scanner = page.getByRole('dialog', { name: 'Scan QR kandang Gajah Sumatera' })
  await expect(scanner).toBeVisible()
  await scanner.getByRole('button', { name: 'Ketik kode' }).tap()
  await scanner.getByRole('textbox', { name: 'Kode kandang' }).fill(tokenOf('gajah').toUpperCase())
  await scanner.getByRole('button', { name: 'Buka' }).tap()
  await expect(scanner).toBeHidden()
  await expect(page.getByRole('dialog', { name: 'Gajah Sumatera' })).toBeVisible()
})

test('mode demo: kode sembarang di scanner tetap membuka kartu hewan', async ({ page }) => {
  await startGame(page)
  await page.getByRole('button', { name: 'Scan Barcode' }).tap()
  const scanner = page.getByRole('dialog', { name: 'Scan Barcode' })
  await scanner.getByRole('button', { name: 'Ketik kode' }).tap()
  await scanner.getByRole('textbox', { name: 'Kode kandang' }).fill('asal1234')
  await scanner.getByRole('button', { name: 'Buka' }).tap()
  await expect(page.getByRole('dialog', { name: 'Beruang Madu' })).toBeVisible()
})

test('HP tegak menampilkan ajakan memiringkan HP', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await expect(page.getByTestId('rotate-overlay')).toBeVisible()
  await page.setViewportSize(VIEWPORT)
  await expect(page.getByTestId('rotate-overlay')).toBeHidden()
})
