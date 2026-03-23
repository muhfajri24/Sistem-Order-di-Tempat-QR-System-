# 🍽️ Order di Tempat (QR Cafe Ordering App)

Web app sederhana untuk pemesanan makanan/minuman di tempat menggunakan QR code.  
Dirancang **mobile-first**, cepat, dan tanpa login untuk customer.

---

## 🚀 Demo Singkat

Aplikasi ini punya 2 sisi:

- 👤 **Customer** → pilih menu & order
- 🛠️ **Admin** → melihat & mengelola pesanan

Semua data disimpan sementara menggunakan `localStorage` (tanpa backend).

---

## ✨ Fitur Utama

- Masuk langsung tanpa login (customer)
- Pilih menu + atur jumlah item
- Keranjang (cart) real-time
- Checkout cepat (nama opsional + nomor meja dari QR)
- Simulasi pembayaran QRIS
- Status pesanan (pending → diproses → selesai)
- Dashboard admin terpisah
- Notifikasi order masuk
- Reset data demo

---

## 🧭 Alur Penggunaan

### 👤 Customer Flow

1. Buka halaman `index.html`
2. Pilih menu
3. Atur jumlah pesanan
4. Klik checkout
5. Isi nama (opsional)
6. Lakukan pembayaran (simulasi)
7. Lihat status pesanan

---

### 🛠️ Admin Flow

1. Buka halaman `admin.html`
2. Lihat daftar order
3. Cek detail pesanan & meja
4. Update status:
   - `pending`
   - `diproses`
   - `selesai`
5. Reset data jika diperlukan

---

## 🧪 Cara Menjalankan

### ✅ Cara cepat:

1. Clone repo ini:
   ```bash
   git clone https://github.com/username/repo-name.git
2. Masuk ke folder:
    cd repo-name

3. Buka file:
    index.html
