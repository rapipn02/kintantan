# Kintantan — Peta Kebun Binatang Interaktif

Web game untuk pengunjung kebun binatang. Pengunjung membuka web lewat QR/NFC di gerbang, lalu
melihat peta ilustrasi dalam mode **landscape**. Peta bisa digeser dan di-pinch-zoom seperti peta
game, dan berhenti di tepi (tidak bisa ditarik keluar peta). Tiap hewan bisa dipencet: kalau
pengunjung sudah sampai di kandangnya, mereka bisa **scan QR kandang** untuk membuka kartu hewan dan
menambah koleksi (seperti Pokémon).

## Fitur v1

- Peta full-screen dengan pan, pinch zoom, double-tap zoom, inersia, efek karet di tepi, dan batas zoom.
- 57 hewan bisa dipencet. Badge `?` menandai hewan yang belum ditemukan, `✓` yang sudah.
- Panel info singkat dan tombol **Scan QR**. Pemindai memakai kamera belakang, ada tombol senter,
  dan kode bisa diketik manual kalau kamera bermasalah.
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

1. **Peta dasar tanpa hewan** → simpan sebagai `assets-src/map.png` (atau `.webp`). Lebar ideal
   3000–4096 px. Gambar yang lebih lebar otomatis dikecilkan ke 4096 px supaya aman di memori iPhone.
2. **Tiap hewan sebagai PNG transparan** (export 2×) → `assets-src/sprites/<id-hewan>.png`. Nama
   file harus sama dengan `id` di `src/features/exhibits/data/exhibits.ts` (mis. `singa.png`,
   `rusa-totol-2.png`).
3. Jalankan `npm run assets`.

Kalau sprite tersedia, hewan otomatis digambar dari sprite, dan hewan yang belum ditemukan tampil
sebagai **siluet**. Kalau sprite belum ada, peta komposit dipakai apa adanya.

Posisi hewan ada di `exhibits.ts` sebagai koordinat **ternormalisasi** (0–1 terhadap lebar/tinggi
peta). Koordinat ini tidak bergantung pada resolusi export, jadi selama komposisi peta di Figma
sama, data posisi tidak perlu diubah. Rumusnya: `x = posisi X layer / lebar frame`, begitu juga
untuk `y`, `w`, dan `h`.

Catatan: gambar komposit sekarang masih memuat dua ikon "x" merah sisa Figma (dekat macaw dan ular
sanca) yang perlu dibersihkan saat export ulang.

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

## Deploy ke Cloudflare

```bash
npx wrangler login
npm run deploy       # build + wrangler deploy (Workers Static Assets)
```

- `wrangler.jsonc` menyajikan `dist/` sebagai situs statis di edge. Path seperti `/s/<token>`
  dijawab dengan `index.html` (SPA).
- `public/_headers` mengatur cache dan keamanan:
  - File ber-hash (`/assets/*`) di-cache selamanya (`immutable`). `index.html`, `sw.js`, dan
    manifest selalu dicek ulang, jadi rilis baru langsung sampai ke pengunjung.
  - CSP ketat, dan kamera hanya diizinkan untuk domain sendiri.
- Cara lain: Cloudflare Pages dengan Git integration (build command `npm run build`, output
  `dist`). `_headers` juga berlaku di sana.

Uji hasil deploy dengan Playwright: `E2E_BASE_URL=https://domain-preview npm run test:e2e`.

## Catatan keamanan

Validasi QR berjalan di HP (tanpa server), sehingga token bisa ditemukan oleh orang yang membaca
kode JavaScript. Ini cukup selama koleksi hanya untuk keseruan. Kalau nanti ada **hadiah**,
pindahkan validasi ke Cloudflare Worker + D1 (token diverifikasi dan diberi tanda tangan di server).

## Berikutnya

Isi kartu info hewan (habitat, makanan, fakta seru), halaman koleksi/Pokédex, badge per zona
(reptil, burung, mamalia), dan multi-bahasa.
