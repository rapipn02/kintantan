import { expect, test } from '@playwright/test'
import { startGame } from './helpers.ts'

test('petunjuk penggunaan tampil sekali saat pertama main dan bisa dibuka lagi', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Mulai Petualangan' }).tap()

  const help = page.getByRole('dialog', { name: 'Petunjuk Penggunaan' })
  await expect(help).toBeVisible()
  await expect(help.getByText('Scan di kandang')).toBeVisible()
  await help.getByRole('button', { name: 'Mengerti, ayo jelajah!' }).tap()
  await expect(help).toBeHidden()

  await page.getByRole('button', { name: 'Petunjuk Penggunaan' }).tap()
  await expect(help).toBeVisible()
  await help.getByRole('button', { name: 'Mengerti, ayo jelajah!' }).tap()

  // Kunjungan berikutnya langsung ke peta.
  await page.reload()
  await startGame(page)
  await expect(help).toBeHidden()
})
