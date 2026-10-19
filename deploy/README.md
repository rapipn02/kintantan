# Deploy Kintantan: VPS + Cloudflare

## Kenapa begini

Kintantan adalah situs **statis** (tanpa server aplikasi/database), tapi isinya **berat gambar**.
Pengunjung membukanya di gerbang kebun binatang yang **ramai** dan **sinyalnya sering hilang**.
Jadi yang menentukan kecepatan bukan CPU server, tapi **jarak & bandwidth** ke HP pengunjung.

| Pilihan                        | Kecepatan di HP                                     | Beban VPS (2 vCPU / 2 GB, bandwidth kecil)    |
| ------------------------------ | --------------------------------------------------- | --------------------------------------------- |
| VPS saja                       | Lambat saat ramai: semua unduhan lewat 1 server     | Berat: tiap pengunjung ±8 MB dari VPS         |
| **VPS + Cloudflare (dipakai)** | Cepat: file diambil dari server Cloudflare terdekat | Ringan: VPS hanya melayani file baru/rilis    |
| Cloudflare saja (tanpa VPS)    | Sama cepatnya                                       | Tidak perlu VPS (`npm run deploy:cloudflare`) |
| Gambar di Cloudflare R2        | Sama dengan cache Cloudflare biasa                  | Menambah setup; **tidak perlu** di sini       |

Nama file gambar/JS sudah ber-hash (`base-BqhQJVFn.webp`), jadi Cloudflare boleh menyimpannya
selamanya. R2 baru berguna kalau gambar diunggah terus-menerus tanpa build; di sini tidak.

### Yang sudah dilakukan aplikasi supaya cepat & tahan sinyal hilang

- **Offline setelah dibuka sekali**: service worker menyimpan semua yang dibutuhkan (peta, gambar
  tur, scanner, kartu, suara, font). Masuk ke dalam kebun binatang tanpa sinyal pun tetap jalan.
- **Gambar tidak diedit, tapi 42% lebih kecil**: WebP lossless piksel-identik (8,1 → 4,7 MiB).
- **Peta mulai diunduh paling awal** (`<link rel="preload">`), dan sambil menunggu tampil
  versi mini (LQIP) seketika. Aplikasi sudah bisa dipakai sebelum peta penuh selesai.
- **Layar berikutnya disiapkan diam-diam**: gambar tur, scanner, popup, dan kartu diunduh +
  di-decode saat HP senggang, jadi tidak ada layar kosong/hitam saat dibuka.
- **Rilis baru tanpa putus**: `index.html` & `sw.js` selalu dicek ulang, file ber-hash di-cache
  selamanya.

Ukuran (cek sendiri dengan `npm run check:dist`):

| Muatan                               | Ukuran               | 4G normal (±10 Mbps) | Ramai (±3 Mbps) |
| ------------------------------------ | -------------------- | -------------------- | --------------- |
| Aplikasi siap dipakai (HTML+JS+CSS)  | ±110 KB (terkompres) | < 0,5 dtk            | ±0,5 dtk        |
| Peta penuh                           | 2,7 MiB              | ±2,5 dtk             | ±8 dtk          |
| Semua untuk offline (latar belakang) | 5,2 MiB              | ±4,5 dtk             | ±15 dtk         |

**Saran di lapangan:** taruh QR/NFC "buka web" di **gerbang**, idealnya dekat Wi-Fi gratis. Sekali
terbuka di sana, semuanya tersimpan di HP dan bisa dipakai di dalam tanpa sinyal.

## Setup sekali

### 1. VPS (Ubuntu/Debian)

```bash
sudo apt update && sudo apt install -y nginx rsync ufw
sudo mkdir -p /var/www/kintantan/releases
sudo chown -R $USER:$USER /var/www/kintantan
```

### 2. Cloudflare (paket gratis)

1. Tambahkan domain ke Cloudflare, arahkan nameserver domain ke Cloudflare.
2. **DNS**: record `A` (mis. `kebun`) → IP VPS, status **Proxied** (awan oranye).
3. **SSL/TLS → Overview**: mode **Full (strict)**.
4. **SSL/TLS → Origin Server → Create Certificate** → simpan di VPS:
   `/etc/ssl/cloudflare/kintantan.pem` dan `/etc/ssl/cloudflare/kintantan.key`.
5. **Caching → Cache Rules → Create rule**:
   - Jika: _URI Path_ _starts with_ `/assets/`
   - Maka: **Eligible for cache**, Edge TTL **Use cache-control header**, Browser TTL **Respect
     origin**. (Wajib untuk file `.wasm` pemindai iPhone, yang tidak di-cache Cloudflare secara
     bawaan.)
6. **Caching → Tiered Cache**: aktifkan _Smart Tiered Cache_ (gratis): VPS makin jarang ditanya.
7. **Speed → Optimization**: **Rocket Loader OFF** (bisa merusak script modul). HTTP/3 & Brotli ON.
8. **SSL/TLS → Edge Certificates**: _Always Use HTTPS_ ON.

### 3. Nginx + firewall

```bash
sudo cp deploy/nginx/kintantan-headers.conf /etc/nginx/snippets/
sudo cp deploy/nginx/kintantan.conf /etc/nginx/sites-available/kintantan
sudo sed -i 's/kebun.example.com/kebun.domainmu.id/g' /etc/nginx/sites-available/kintantan
sudo ln -s /etc/nginx/sites-available/kintantan /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

# Hanya Cloudflare yang boleh mengakses port 80/443 (bandwidth VPS tidak bocor ke bot).
sudo bash deploy/nginx/cloudflare-only.sh
```

Nginx untuk situs statis hanya butuh ±10–20 MB RAM; 2 vCPU / 2 GB lebih dari cukup.

## Deploy

```bash
VPS=user@ip-vps npm run deploy
```

Build dilakukan di laptop, lalu dikirim dengan `rsync` (hanya file yang berubah). Rilis aktif
diganti sekaligus (symlink `current`), 3 rilis terakhir disimpan.

**Rollback** ke rilis sebelumnya:

```bash
ssh user@ip-vps 'cd /var/www/kintantan && ls -1t releases'      # lihat daftar
ssh user@ip-vps 'cd /var/www/kintantan && ln -sfn releases/<NAMA> current'
```

## Cek setelah deploy

```bash
curl -sI https://kebun.domainmu.id/ | grep -iE 'cache-control|content-security'
# File ber-hash: request kedua harus "cf-cache-status: HIT"
curl -sI https://kebun.domainmu.id/assets/<nama-file>.webp | grep -iE 'cf-cache-status|cache-control'
E2E_BASE_URL=https://kebun.domainmu.id npm run test:e2e
```

Sebelum dibuka untuk pengunjung: matikan **mode demo** (`DEMO.acceptAnyCode = false` di
`src/app/gameStore.ts`), karena saat ini kode apa pun bisa membuka kartu.
