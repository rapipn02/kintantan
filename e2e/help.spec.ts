import { expect, test } from '@playwright/test'
import { startGame } from './helpers.ts'

test('tur pengenalan tampil sekali saat pertama main, lalu panduan bisa dibuka dari tombol info', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Mulai Petualangan' }).tap()

  // Gambar tur dipakai apa adanya; isi teksnya tersedia untuk pembaca layar.
  const steps = [
    [
      'Halo Sobat! Mau tahu apa saja hal seru yang bisa kita lakuin di sini? Yuk, intip panduannya!',
      'Lanjut',
    ],
    ['Disini tertera jumlah kandang yang sudah kamu kunjungi.', 'Lanjut'],
    ['Klik tombol ini untuk memindai kode QR di depanmu ya!', 'Lanjut'],
    ['Klik tombol ini untuk melihat keseluruhan peta ya!', 'Lanjut'],
    ['Bingung? Klik tombol ini untuk panduan tambahan ya!', 'Lanjut'],
    ['Selesai! Apakah kamu siap berpetualang sobat?', 'Siap'],
  ] as const
  for (const [i, [text, button]] of steps.entries()) {
    const step = page.getByRole('dialog', { name: `Panduan ${i + 1} dari 6` })
    await expect(step).toHaveAccessibleDescription(text)
    await step.getByRole('button', { name: button }).tap()
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
  await expect(page.getByRole('dialog', { name: 'Panduan 1 dari 6' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
})
