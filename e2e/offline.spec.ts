import { expect, test } from '@playwright/test'
import { skipHelp, startGame, tapExhibit, tokenOf } from './helpers.ts'

test.use({ serviceWorkers: 'allow' })

test('setelah dibuka sekali, web tetap jalan tanpa sinyal', async ({ page, context }) => {
  await skipHelp(page)
  await page.goto('/')
  // Tunggu service worker aktif & precache selesai.
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready
  })
  await expect
    .poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller)))
    .toBe(true)

  await context.setOffline(true)
  await page.reload()
  await startGame(page)
  await expect(page.getByRole('img', { name: 'Peta kebun binatang' })).toHaveJSProperty(
    'complete',
    true,
  )
  expect(
    await page
      .getByRole('img', { name: 'Peta kebun binatang' })
      .evaluate((img: HTMLImageElement) => img.naturalWidth),
  ).toBeGreaterThan(0)

  // Deep link dari QR juga terbuka offline, dan kode bisa diketik manual.
  await page.goto(`/s/${tokenOf('zebra')}`)
  await startGame(page)
  await expect(
    page.getByRole('dialog', { name: 'Zebra' }).getByText('Hewan Baru Ditemukan!'),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Tutup kartu' }).tap()
  await tapExhibit(page, 'zebra')
  await expect(
    page.getByRole('complementary', { name: 'Zebra' }).getByText('Sudah masuk koleksimu!'),
  ).toBeVisible()
})
