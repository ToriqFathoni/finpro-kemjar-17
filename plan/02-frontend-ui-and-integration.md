# 02 - Rancang Bangun Frontend UI & Integrasi API

## 1. Konsep Desain UI/UX (Tailwind CSS)

Frontend dibangun dengan **Next.js 16 (App Router)** dan **Tailwind CSS**. Desain mengusung antarmuka toko online gadget profesional (*TechStore*) yang clean, modern, dan fungsional. 

Tujuan utama antarmuka adalah:
1. Memberikan alur penggunaan e-commerce yang intuitif bagi pengguna biasa.
2. Memfasilitasi demonstrasi pentest secara visual dan transparan (menampilkan parameter query URL, status token login, pesan feedback, dan error SQL secara eksplisit saat eksploitasi terjadi).

---

## 2. Struktur Rute & Halaman Frontend

Aplikasi memiliki 4 halaman utama di dalam direktori `frontend/src/app/`:

```text
frontend/src/app/
├── layout.tsx             # Root layout (Navbar universal, Footer, Auth Provider)
├── page.tsx               # Halaman 1: Katalog Produk & Fitur Pencarian (/)
├── login/
│   └── page.tsx           # Halaman 2: Login Pengguna (/login)
├── orders/
│   ├── page.tsx           # Halaman 3: Riwayat Pesanan Saya (/orders)
│   └── [id]/
│       └── page.tsx       # Halaman 4: Detail Invoice Pesanan (/orders/[id])
└── globals.css
```

---

## 3. Spesifikasi Halaman & Komponen

### 3.1 Komponen Universal: Navbar (`src/components/Navbar.tsx`)
- **Brand**: "TechStore" dengan badge status indikator server API (`http://localhost:5000`).
- **Navigasi Kiri**: Link "Katalog Gadget" (`/`).
- **Navigasi Kanan**:
  - Jika Belum Login: Tombol "Masuk Akun" mengarah ke `/login`.
  - Jika Sudah Login: Menampilkan teks `Halo, <Nama User> (<Role>)`, link "Pesanan Saya" (`/orders`), dan tombol "Keluar" (Logout).

### 3.2 Halaman 1: Katalog & Pencarian Produk (`/`)
- **Search Bar**:
  - Input field teks dengan placeholder: `Cari laptop, keyboard, mouse...`.
  - Tombol submit "Cari".
  - Tombol "Reset" untuk mengosongkan pencarian.
- **Visual Feedback & Error Box**:
  - Jika query menghasilkan error dari backend (misalnya kutip satu `'` yang memicu error SQL), UI menampilkan alert box berwarna merah dengan pesan: `Database Error: <error_message_from_backend>`. Fitur ini krusial saat demonstrasi serangan SQLi error-based.
- **Product Card Grid & Null-Safe Rendering**:
  - Menampilkan daftar produk (3-4 kolom responsif).
  - Elemen kartu: Foto produk, Tag Kategori, Nama Produk, Deskripsi Singkat, Harga (Format Rupiah `Rp xxx.xxx`), dan Badge Stok.
  - **Ketahanan Render Data (`Null-Safe` & `Injection-Safe` Rendering)**:
    - Gunakan fallback composite key pada React list: `key={product.id ?? `row-${idx}`}` agar tidak terjadi *duplicate key warning* atau crash ketika kolom `id` bernilai `null`.
    - Gunakan pengecekan aman untuk format angka: `product.price != null ? `Rp ${Number(product.price).toLocaleString('id-ID')}` : 'Rp -'` dan `product.stock != null ? `Stok: ${product.stock}` : 'Stok: -'`.
    - Pada bagian `image_url`: Cek apakah string diawali dengan `http://` atau `https://`. Jika valid, render sebagai gambar `<img>`. Jika bukan URL (misalnya berisi teks hasil ekstraksi seperti kolom `address`), tampilkan nilai `product.image_url` tersebut sebagai badge/kotak informasi teks tambahan di dalam kartu produk sehingga data hasil query tetap terlihat jelas di layar saat demo.

### 3.3 Halaman 2: Autentikasi Login (`/login`)
- **Form Login**:
  - Input `username` (teks biasa).
  - Input `password` (tipe password).
  - Tombol submit "Masuk ke Akun".
- **Petunjuk Akun Uji Coba (Demo Helper)**:
  - Kotak catatan di bawah form yang menampilkan daftar user uji coba (`alice` / `bob` / `admin`) untuk kemudahan pengujian.
- **Error Banner**:
  - Jika autentikasi gagal atau query menghasilkan error SQL, pesan error backend ditampilkan langsung di atas tombol login.
- **State Transition**:
  - Saat login berhasil, simpan token JWT dan objek profil user ke `localStorage`, lalu lakukan redirect otomatis ke halaman `/orders`.

### 3.4 Halaman 3: Daftar Riwayat Pesanan (`/orders`)
- **Proteksi Akses Client**:
  - Memeriksa apakah token JWT ada di `localStorage`. Jika tidak ada, redirect user ke `/login`.
- **Tabel Riwayat Transaksi**:
  - Menampilkan daftar pesanan yang diambil dari `GET /api/orders` menggunakan header `Authorization: Bearer <token>`.
  - Kolom:
    1. ID Pesanan (misal: `#3`)
    2. Tanggal Transaksi
    3. Nama Produk
    4. Kuantitas & Total Harga
    5. Status Pengiriman (`Processing`, `Shipped`, `Delivered`)
    6. Aksi: Tombol tautan "Lihat Detail Invoice" mengarah ke `/orders/[id]`.

### 3.5 Halaman 4: Detail Invoice Pesanan (`/orders/[id]`) — Target IDOR
- **Mekanisme Permintaan Data**:
  - Mengambil parameter dynamic route `params.id`.
  - Melakukan fetch ke `GET /api/orders/${id}` dengan token JWT pengguna yang sedang login.
- **Komponen Invoice Card**:
  - Header: Logo TechStore, No. Invoice (`INV/2026/000${id}`), Tanggal Pesanan, Badge Status.
  - Bagian Informasi Pengiriman (**Data Sensitif PII Target IDOR**):
    - **Nama Penerima**: Nama lengkap pemilik order.
    - **Email Penerima**: Email pemilik order.
    - **No. Kontak**: Nomor HP pribadi.
    - **Alamat Tujuan**: Alamat rumah/kantor lengkap.
  - Bagian Rincian Item: Nama gadget, kategori, harga satuan, jumlah, dan Total Pembayaran.
- **Celah Visual**:
  - Halaman ini tidak mengecek kesesuaian antara nama pengguna yang sedang login di Navbar dengan nama penerima yang tertera pada invoice. Jika Bob membuka `/orders/1`, halaman akan dengan tenang menampilkan data pribadi Alice.

---

## 4. Penanganan State Autentikasi & Integrasi API

### 4.1 Utilitas API Client & Custom Error (`src/lib/api.ts`)
Agar Frontend dapat membedakan kode status HTTP (`401 Unauthorized`, `403 Forbidden`, `404 Not Found`, dan `500 Internal Server Error`) serta menampilkan detail query saat terjadi database error, gunakan custom class `ApiError`:

```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export class ApiError extends Error {
  status: number;
  query?: string;

  constructor(message: string, status: number, query?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.query = query;
  }
}

export async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('techstore_token') : null;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiError(
      data.error || 'Terjadi kesalahan pada server',
      response.status,
      data.query
    );
  }
  return data;
}
```

### 4.2 Visualisasi Status Error HTTP di UI
- **HTTP 500 (Database / SQL Error pada `/` dan `/login`)**: Tampilkan kotak alert merah bertuliskan `Database Error (HTTP 500): <err.message>` beserta blok `<pre>` untuk `err.query` jika tersedia.
- **HTTP 401 (Unauthorized pada `/login`)**: Tampilkan banner peringatan `HTTP 401 Unauthorized: <err.message>`.
- **HTTP 403 (Forbidden pada `/orders/[id]` di branch `patched`)**: Tampilkan kartu penolakan akses mencolok bertuliskan **`HTTP 403 Forbidden — Akses Ditolak`** beserta pesan dari server (`Forbidden: You do not have permission to view this order invoice`), yang berfungsi sebagai bukti visual utama pada tahap verifikasi remediasi IDOR.
- **HTTP 404 (Not Found pada `/orders/[id]`)**: Tampilkan pesan `HTTP 404: Pesanan tidak ditemukan`.

### 4.2 State Pengguna di Browser
- Kunci `techstore_token`: Menyimpan string token JWT.
- Kunci `techstore_user`: Menyimpan JSON `{ id, username, fullName, role }`.
- Fungsi logout: Menghapus kedua kunci dari `localStorage` dan meredirect ke `/login`.

---

## 5. Acceptance Criteria Frontend

1. **Responsivitas & Tampilan**: Halaman `/`, `/login`, `/orders`, dan `/orders/[id]` dapat diakses tanpa compile error, styling Tailwind diterapkan dengan rapi.
2. **Integrasi Pencarian**:
   - Mengetik `laptop` di search bar menampilkan laptop.
   - Mengetik `'` (karakter injeksi) menampilkan kotak error merah dengan detail sintaks SQL PostgreSQL.
3. **Integrasi Autentikasi**:
   - Login normal dengan akun Bob berhasil dan status di Navbar berganti menjadi `Halo, Bob Miller`.
   - Login menggunakan payload SQLi `' OR '1'='1' --` berhasil login sebagai Admin (`Budi Santoso`).
4. **Integrasi Invoice & IDOR**:
   - Saat login sebagai Bob, navigasi ke `/orders` menampilkan pesanan Bob (Order #3 dan #4).
   - Mengubah URL browser secara manual menjadi `/orders/1` berhasil merender invoice lengkap milik Alice Walker tanpa penolakan dari sistem.
