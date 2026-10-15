import { expect, test } from '@playwright/test'
import { skipHelp, startGame, tapExhibit, waitForCameraToSettle } from './helpers.ts'

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
  await page.getByRole('button', { name: 'Scan QR' }).tap()

  const card = page.getByRole('dialog', { name: 'Singa Afrika' })
  await expect(card.getByText('Hewan Baru Ditemukan!')).toBeVisible({ timeout: 20_000 })
  // Scanner dibuka untuk kandang singa, jadi tidak ada pesan "bukan …".
  await expect(card.getByText(/bukan/)).toHaveCount(0)
  await expect(page.getByRole('dialog', { name: /Scan QR kandang/ })).toHaveCount(0)
  await card.getByRole('button', { name: 'Lanjut Jelajah' }).tap()
  await expect(page.getByTestId('hud-progress')).toHaveAccessibleName('1 dari 57 hewan ditemukan')
})

test('QR kandang lain tetap membuka hewan yang discan', async ({ page }) => {
  await tapExhibit(page, 'macan-tutul')
  await page.getByRole('button', { name: 'Scan QR' }).tap()

  const card = page.getByRole('dialog', { name: 'Singa Afrika' })
  await expect(card.getByText('bukan Macan Tutul')).toBeVisible({ timeout: 20_000 })
  await expect(card.getByText('Tetap masuk koleksimu!')).toBeVisible()
})

test('tombol Scan Barcode bisa scan kandang mana pun tanpa memilih hewan dulu', async ({
  page,
}) => {
  await page.getByRole('button', { name: 'Scan Barcode' }).tap()

  const card = page.getByRole('dialog', { name: 'Singa Afrika' })
  await expect(card.getByText('Hewan Baru Ditemukan!')).toBeVisible({ timeout: 20_000 })
  await expect(card.getByText(/bukan/)).toHaveCount(0)
})
