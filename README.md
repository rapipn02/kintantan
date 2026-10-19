# Kintantan — Peta Kebun Binatang Interaktif

Web game untuk pengunjung kebun binatang. Pengunjung membuka web lewat QR/NFC di gerbang, lalu
melihat peta ilustrasi dalam mode **landscape**. Peta bisa digeser dan di-pinch-zoom seperti peta
game, dan berhenti di tepi (tidak bisa ditarik keluar peta). Tiap hewan bisa dipencet: kalau
pengunjung sudah sampai di kandangnya, mereka bisa **scan QR kandang** untuk membuka kartu hewan dan
menambah koleksi (seperti Pokémon).

## Fitur v1

- Peta full-screen dengan pan, pinch zoom, double-tap zoom, inersia, efek karet di tepi, dan batas zoom.
- 57 hewan bisa dipencet. Badge ✗ menandai hewan yang belum ditemukan, ✓ yang sudah (sesuai
  desain).
- Baris atas sesuai desain: progres koleksi, tombol **Scan Barcode** (scan QR kandang mana pun tanpa
  memilih hewan dulu), dan **Petunjuk Penggunaan** (otomatis tampil sekali saat pertama main).
- Pencet hewan untuk membuka panel info singkat dengan tombol **Scan QR**. Pemindai memakai kamera
  belakang, ada tombol senter, dan kode bisa diketik manual kalau kamera bermasalah.
- Kartu "Hewan Baru Ditemukan!" dengan progres koleksi. Isi info lengkap (habitat, makanan, fakta)
  menyusul di fitur berikutnya.
- QR berisi URL `https://<domain>/s/<token>`, jadi juga bisa discan dengan **kamera bawaan HP**
  atau ditempel ke **tag NFC**. Kalau QR yang discan milik hewan lain, hewan itu tetap
  di-unlock.
- Progres tersimpan di HP (tanpa login). Layar pembuka masuk fullscreen dan mengunci landscape
  (Android). Di iPhone, overlay "Miringkan HP-mu" muncul saat HP dipegang tegak.
- **Offline-first (PWA):** setelah dibuka sekali, peta, kartu, dan scanner tetap jalan tanpa sinyal.

## Stack

Vite 8 · React 19 · TypeScript (strict) · Tailwind CSS v4 · `@use-gesture/react` · Zustand ·
`barcode-detector` (BarcodeDetector bawaan Android, ZXing WebAssembly untuk iOS, di-host sendiri) ·
`vite-plugin-pwa` · Vitest · Playwright · Cloudflare Workers Static Assets.

Muatan awal ±91 KB JS gzip. Scanner dan wasm dimuat terpisah saat dibutuhkan.

```
src/
  app/            App, store alur game, deep link /s/<token>
  features/
    map/          kamera (matematika murni + controller rAF), gesture, marker hewan
    exhibits/     data hewan & posisi, panel info, potret hewan
    discovery/    progres koleksi (localStorage), kartu "ditemukan"
    scanner/      kamera + detektor QR (lazy), parsing hasil scan
    orientation/  layar pembuka, fullscreen/landscape, overlay putar HP
    hud/          progres & toast
assets-src/       file mentah dari Figma (peta, sprite, ikon)
scripts/          optimize-assets.ts, generate-qr.ts
e2e/              tes Playwright (HP landscape, kamera palsu berisi QR, mode offline)
```

## Menjalankan

Butuh **Node.js 22 atau lebih baru**. Unduh installer versi LTS dari https://nodejs.org, lalu buka
ulang Terminal dan cek dengan `node -v`. MAMP/XAMPP tidak diperlukan.

```bash
npm install
npm run dev          # http://localhost:5173 (juga terbuka di jaringan lokal)
npm run build        # hasil di dist/
npm run typecheck && npm run lint && npm test
npx playwright install chromium   # sekali saja
npm run test:e2e
```

Kamera hanya bisa dipakai lewat **HTTPS**. Untuk mencoba scan di HP asli, deploy dulu ke Cloudflare
(lihat di bawah) atau gunakan tunnel HTTPS ke `npm run dev`.

## Mengganti aset dari Figma

Saat ini peta memakai **satu gambar komposit** (peta + semua hewan). Hasil terbaik didapat kalau
teman desainer meng-export:

1. **Peta** → simpan PNG asli dari Figma sebagai `assets-src/map.png`. Lebar minimal 3000 px
   (`npm run assets` memberi peringatan kalau kurang).
2. **Tiap hewan sebagai PNG transparan** (export 2×) → `assets-src/sprites/<id-hewan>.png`. Nama
   file harus sama dengan `id` di `src/features/exhibits/data/exhibits.ts` (mis. `singa.png`,
   `rusa-totol-2.png`).
3. **Gambar desain (tur, scanner, popup "Pindai berhasil", kartu hewan)** → `assets-src/desain/`
   (PNG asli). Gambar **tidak diedit/dipotong sama sekali**: `npm run assets` menyimpannya sebagai
   WebP lossless yang piksel-identik (lihat di bawah); aplikasi hanya mengatur letak dan ukuran
   tampilnya. Tombol yang tergambar (mis. "Lanjut", "Taksonomi", speaker)
   diberi area tekan transparan; letaknya (px gambar asli) ada di `IntroTour.tsx`,
   `ScannerModal.tsx`, dan `src/features/discovery/cardDesigns.ts`. Kartu hewan per spesies:
   `kartu-<id-spesies>.png` + `taksonomi-<id-spesies>.png`, lalu daftarkan di `cardDesigns.ts`.
4. **Suara hewan** (opsional) → `assets-src/suara/<id-spesies>.mp3`, dipakai apa adanya. Tombol
   speaker di kartu memutarnya; tanpa file suara, tombol speaker membacakan isi kartu.
5. **Foto hewan untuk kartu** (opsional) → `assets-src/photos/<id-spesies>.jpg`, mis.
   `beruang-madu.jpg`. Tanpa foto, kartu memotong gambar hewan dari peta.
6. Jalankan `npm run assets`.

**Mode demo (sementara aktif):** kode apa pun yang discan atau diketik di scanner aplikasi membuka
kartu hewan (hewan yang sedang dipilih, atau Beruang Madu dari tombol QR umum). Deep link
`/s/<token>` tetap hanya menerima kode asli. Matikan dengan `DEMO.acceptAnyCode = false` di
`src/app/gameStore.ts` sebelum dipakai pengunjung.

Isi kartu hewan (nama ilmiah, asal, makanan, sifat, fakta unik, taksonomi) ada di
`src/features/exhibits/data/speciesInfo.ts`, satu entri per spesies. Spesies yang belum diisi
tetap punya kartu dengan keterangan "segera hadir".

Kalau sprite tersedia, hewan otomatis digambar dari sprite, dan hewan yang belum ditemukan tampil
sebagai **siluet**. Kalau sprite belum ada, peta komposit dipakai apa adanya.

### Gambar tidak diedit: WebP lossless piksel-identik

- Peta dan semua gambar desain disimpan sebagai **WebP lossless** (opsi `exact`), bukan dikompres
  lossy, di-resize, atau diedit. `npm run assets` mendekode ulang setiap hasil dan membandingkan
  **seluruh piksel** (termasuk area transparan) dengan PNG asli; satu piksel beda saja langsung
  membatalkan proses. Hasilnya sama persis secara visual, tapi file 35–55% lebih kecil
  (total 8,1 MiB → 4,7 MiB; peta 4,3 → 2,7 MiB). PNG asli tetap di `assets-src/`.
- `base.meta.json` berisi ukuran peta + LQIP mini 48 px (data URI, dibuat terpisah dari peta).
- **Masukkan file HD langsung ke `assets-src/map.png`** (salin dari export Figma / Google Drive).
  Jangan lewat chat AI: chat mengecilkan dan mengompres gambar yang diunggah.
- **Jangan taruh file desain di `public/`**: semua isi `public/` ikut tersalin ke hasil build dan
  ikut diunduh pengunjung. `npm run check:dist` (otomatis saat deploy) menolak build seperti itu.
- Usahakan ≤ 16 megapiksel. Gambar yang lebih besar berisiko gagal tampil di iPhone lama (batas
  memori gambar Safari), jadi tes di iPhone asli.
- **Zoom maksimum otomatis mengikuti resolusi gambar**: zoom berhenti saat 1 piksel gambar ≈ 2.5
  piksel fisik layar (`CAMERA.maxPhysicalPixelsPerImagePixel`), maksimal 4× tampilan seluruh peta
  (`CAMERA.maxZoom`), dan selalu menyisakan minimal 1.5× zoom.

Posisi hewan ada di `exhibits.ts` sebagai koordinat **ternormalisasi** (0–1 terhadap lebar/tinggi
peta). Koordinat ini tidak bergantung pada resolusi export, jadi selama komposisi peta di Figma
sama, data posisi tidak perlu diubah. Rumusnya: `x = posisi X layer / lebar frame`, begitu juga
untuk `y`, `w`, dan `h`.

## QR & NFC kandang

```bash
QR_BASE_URL=https://domain-kamu.com npm run qr
```

Hasilnya ada di `print/qr/`: satu SVG per kandang dan `index.html` sebagai lembar cetak A4. Setiap
kartu memuat nama hewan dan **kode 8 huruf** untuk input manual. URL yang sama bisa ditulis ke tag
NFC sebagai record URI (mis. dengan aplikasi NFC Tools). iPhone dan Android bisa membacanya tanpa
aplikasi tambahan.

Token di `exhibits.ts` **jangan diubah** setelah QR dicetak. Untuk menambah hewan, tambahkan
spesiesnya di `species.ts` dan exhibit baru di `exhibits.ts` dengan token acak 8 karakter. Karakter
yang boleh dipakai adalah `a-z` dan `2-9`, tanpa `i`, `l`, `o`, `0`, atau `1`. Tes unit memeriksa
keunikan dan formatnya.

## Deploy (VPS + Cloudflare)

Situs ini 100% statis. Production: **Nginx di VPS** sebagai sumber, dengan **Cloudflare (proxy,
gratis)** di depannya. Cloudflare menyimpan gambar & JS di server terdekat pengunjung, jadi
bandwidth VPS hampir tidak terpakai. Panduan lengkap (sekali setup + alasan pilihannya):
[`deploy/README.md`](deploy/README.md).

```bash
VPS=user@ip-vps npm run deploy   # build + cek dist + upload + ganti rilis (atomik)
npm run check:dist               # cek isi dist/ & ukuran unduhan
```

Alternatif tanpa VPS: `npm run deploy:cloudflare` (Cloudflare Workers Static Assets, pakai
`wrangler.jsonc` + `public/_headers`).

Uji hasil deploy dengan Playwright: `E2E_BASE_URL=https://domainmu npm run test:e2e`.

## Catatan keamanan

Validasi QR berjalan di HP (tanpa server), sehingga token bisa ditemukan oleh orang yang membaca
kode JavaScript. Ini cukup selama koleksi hanya untuk keseruan. Kalau nanti ada **hadiah**,
pindahkan validasi ke Cloudflare Worker + D1 (token diverifikasi dan diberi tanda tangan di server).

## Berikutnya

Isi kartu info hewan (habitat, makanan, fakta seru), halaman koleksi/Pokédex, badge per zona
(reptil, burung, mamalia), dan multi-bahasa.
