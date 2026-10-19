#!/usr/bin/env bash
# Deploy Kintantan ke VPS (Nginx), dengan Cloudflare di depannya.
#
#   VPS=user@ip-vps npm run deploy
#
# Build dilakukan di laptop (VPS 2 GB tidak perlu menjalankan build), lalu:
#  1. upload ke folder rilis baru (file rilis sebelumnya dipakai ulang lewat hard link, jadi yang
#     terkirim hanya file yang berubah -> hemat bandwidth VPS);
#  2. symlink `current` dipindah dalam satu langkah (atomik): pengunjung tidak pernah melihat situs
#     setengah ter-upload;
#  3. file /assets lama tetap disimpan, supaya pengunjung yang masih memegang versi lama tidak 404;
#  4. hanya 3 rilis terakhir yang disimpan.
set -euo pipefail

: "${VPS:?Isi VPS, mis: VPS=root@203.0.113.10 npm run deploy}"
APP_DIR="${APP_DIR:-/var/www/kintantan}"
RELEASE="$(date +%Y%m%d-%H%M%S)"
TARGET="$APP_DIR/releases/$RELEASE"

npm run build
npm run check:dist

echo "Menyiapkan rilis $RELEASE di $VPS ..."
ssh "$VPS" "set -e
  mkdir -p '$APP_DIR/releases'
  if [ -d '$APP_DIR/current' ]; then cp -al '$APP_DIR/current/.' '$TARGET'; else mkdir -p '$TARGET'; fi"

# --delete menghapus file yang sudah tidak ada, KECUALI isi assets/ (dilindungi filter P).
rsync -az --delete --filter='P assets/' --exclude='_headers' dist/ "$VPS:$TARGET/"

ssh "$VPS" "set -e
  ln -sfn '$TARGET' '$APP_DIR/current.tmp'
  mv -Tf '$APP_DIR/current.tmp' '$APP_DIR/current'
  cd '$APP_DIR/releases' && ls -1t | tail -n +4 | xargs -r rm -rf
  sudo -n nginx -t >/dev/null 2>&1 && sudo -n systemctl reload nginx || true"

echo "Selesai: $RELEASE aktif. index.html & sw.js tidak di-cache, jadi pengunjung langsung dapat versi baru."
