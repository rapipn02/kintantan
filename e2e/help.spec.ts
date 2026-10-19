import { expect, test } from '@playwright/test'
import { startGame } from './helpers.ts'

test('tur pengenalan tampil sekali saat pertama main, lalu panduan bisa dibuka dari tombol info', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Mulai Petualangan' }).tap()

  const welcome = page.getByRole('dialog', { name: 'Halo Sobat!' })
  await expect(welcome).toBeVisible()
  await welcome.getByRole('button', { name: 'Lanjut' }).tap()

  // Tiap langkah menyorot satu elemen HUD.
  const steps = [
    'Di sini tertera jumlah kandang yang sudah kamu kunjungi.',
    'Klik tombol ini untuk memindai kode QR di depanmu ya!',
    'Klik tombol ini untuk melihat keseluruhan peta ya!',
    'Bingung? Klik tombol ini untuk panduan tambahan ya!',
  ]
  for (const [i, text] of steps.entries()) {
    const step = page.getByRole('dialog', { name: `Panduan ${i + 2} dari 5` })
    await expect(step).toHaveAccessibleDescription(text)
    await step.getByRole('button', { name: 'Lanjut' }).tap()
  }
  await expect(page.getByRole('dialog')).toHaveCount(0)

  // Petunjuk lengkap tidak terbuka otomatis, tapi bisa dibuka dari tombol info.
  const help = page.getByRole('dialog', { name: 'Petunjuk Penggunaan' })
  await page.getByRole('button', { name: 'Petunjuk Penggunaan' }).tap()
  await expect(help).toBeVisible()
  await expect(help.getByText('Scan di kandang')).toBeVisible()
  await help.getByRole('button', { name: 'Mengerti, ayo jelajah!' }).tap()
  await expect(help).toBeHidden()

  // Kunjungan berikutnya langsung ke peta.
  await page.reload()
  await startGame(page)
  await expect(page.getByRole('dialog')).toHaveCount(0)
})

test('tur bisa dilewati dengan Escape', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Mulai Petualangan' }).tap()
  await expect(page.getByRole('dialog', { name: 'Halo Sobat!' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
})
