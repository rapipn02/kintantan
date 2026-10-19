#!/usr/bin/env bash
# Kunci port 80/443 VPS supaya hanya bisa diakses lewat Cloudflare: bandwidth VPS tidak bocor
# ke pengunjung/bot yang menembak IP langsung. Jalankan sekali (dan ulangi bila daftar IP berubah).
#   sudo bash deploy/nginx/cloudflare-only.sh
set -euo pipefail

ufw allow OpenSSH
for ip in $(curl -fsS https://www.cloudflare.com/ips-v4) $(curl -fsS https://www.cloudflare.com/ips-v6); do
  ufw allow proto tcp from "$ip" to any port 80,443 comment 'cloudflare'
done
ufw --force enable
ufw status numbered
