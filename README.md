# Order di Tempat

Web app order di tempat berbasis QR untuk cafe, fokus pada UX cepat, mobile-first, dan sekarang dipisah antara halaman customer dan halaman admin.

## Fitur Utama

- customer masuk langsung ke menu tanpa login
- quantity increment/decrement per menu
- cart real-time dengan total harga otomatis
- checkout ringan: nama opsional + nomor meja dari URL QR
- QRIS simulasi
- status pesanan: pesanan sedang diproses
- dashboard admin terpisah dengan notifikasi dan update status
- sinkronisasi data demo memakai `localStorage`

## Flow Halaman

- `index.html` untuk customer
- `admin.html` untuk admin

Customer fokus ke:
- pilih menu
- review keranjang
- bayar QRIS simulasi
- lihat status pesanan

Admin fokus ke:
- melihat semua order masuk
- melihat meja dan detail item
- update status `pending / diproses / selesai`
- reset data demo jika perlu

## Cara Simulasi

- buka halaman customer biasa: meja default `Meja 01`
- untuk simulasi QR meja, gunakan query param seperti:
  - `index.html?table=Meja%2003`
  - `index.html?table=VIP%2001`
- setelah customer menyelesaikan pembayaran simulasi, buka `admin.html`
- order akan muncul di dashboard admin dari data `localStorage` browser yang sama

## File

- `index.html` untuk halaman customer order
- `admin.html` untuk dashboard admin terpisah
- `style.css` untuk tampilan mobile-first bersama
- `script.js` untuk cart, pembayaran, dan penyimpanan order customer
- `admin.js` untuk membaca order, notifikasi, dan update status admin
- `images/` untuk aset gambar lokal
