import { expect, test } from '@playwright/test'
import { startGame, tapExhibit, waitForCameraToSettle } from './helpers.ts'

// Kamera palsu Chromium memutar video berisi QR kandang singa (lihat global-setup.ts).

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await startGame(page)
  await page.getByRole('button', { name: 'Lihat seluruh peta' }).tap()
  await waitForCameraToSettle(page)
})

test('scan QR di kandang membuka kartu hewan', async ({ page }) => {
  await tapExhibit(page, 'singa')
  await page.getByRole('button', { name: 'Scan QR' }).tap()
  await expect(page.getByRole('dialog', { name: 'Scan QR kandang Singa Afrika' })).toBeVisible()

  const card = page.getByRole('dialog', { name: 'Singa Afrika' })
  await expect(card.getByText('Hewan Baru Ditemukan!')).toBeVisible({ timeout: 20_000 })
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
