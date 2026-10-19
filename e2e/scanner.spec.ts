import { expect, test } from '@playwright/test'
import { closeCard, skipHelp, startGame, tapExhibit, waitForCameraToSettle } from './helpers.ts'

// Kamera palsu Chromium memutar video berisi QR kandang singa (lihat global-setup.ts).
// Scan bisa selesai dalam <1 detik, jadi jangan menunggu dialog scanner terlihat lebih dulu:
// dialog itu bisa sudah tertutup sebelum dicek. Yang dicek adalah hasil akhirnya.

test.beforeEach(async ({ page }) => {
  await skipHelp(page)
  await page.goto('/')
  await startGame(page)
  await page.getByRole('button', { name: 'Lihat seluruh peta' }).tap()
  await waitForCameraToSettle(page)
})

test('scan QR di kandang membuka kartu hewan', async ({ page }) => {
  await tapExhibit(page, 'singa')

  const card = page.getByRole('dialog', { name: 'Singa Afrika' })
  await expect(card).toBeVisible({ timeout: 20_000 })
  await expect(page.getByText('Hewan Baru Ditemukan!')).toBeVisible()
  // Scanner dibuka untuk kandang singa, jadi tidak ada pesan "bukan …".
  await expect(page.getByText(/bukan/)).toHaveCount(0)
  await expect(page.getByRole('dialog', { name: /Scan QR kandang/ })).toHaveCount(0)
  await closeCard(page)
  await expect(page.getByTestId('hud-progress')).toHaveAccessibleName('1 dari 57 hewan ditemukan')
})

test('QR kandang lain tetap membuka hewan yang discan', async ({ page }) => {
  await tapExhibit(page, 'macan-tutul')

  const card = page.getByRole('dialog', { name: 'Singa Afrika' })
  await expect(card).toBeVisible({ timeout: 20_000 })
  await expect(page.getByText('bukan Macan Tutul. Tetap masuk koleksimu!')).toBeVisible()
})

test('tombol Scan Barcode bisa scan kandang mana pun tanpa memilih hewan dulu', async ({
  page,
}) => {
  await page.getByRole('button', { name: 'Scan Barcode' }).tap()

  const card = page.getByRole('dialog', { name: 'Singa Afrika' })
  await expect(card).toBeVisible({ timeout: 20_000 })
  await expect(page.getByText('Hewan Baru Ditemukan!')).toBeVisible()
  await expect(page.getByText(/bukan/)).toHaveCount(0)
})
