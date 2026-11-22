# 00 - Gambaran Umum & Arsitektur Sistem

## 1. Konsep Proyek
Proyek akhir ini mengimplementasikan sebuah lab praktikum keamanan jaringan (*penetration testing lab*) berbasis aplikasi web **Mini E-Commerce** bernama **"TechStore"**. Aplikasi ini dirancang khusus untuk mensimulasikan dua kerentanan kritis web application yang paling umum dan berdampak tinggi:
1. **SQL Injection (SQLi)** — Terjadi pada mekanisme autentikasi (*Authentication Bypass*) dan fitur pencarian produk (*Data Extraction via UNION-based SQLi*).
2. **Insecure Direct Object Reference (IDOR)** — Terjadi pada endpoint invoice pesanan (*Broken Object Level Authorization*), di mana pengguna dapat mengakses data transaksi dan informasi pribadi (*Personally Identifiable Information / PII*) milik pengguna lain tanpa validasi hak kepemilikan.

Aplikasi dibangun menggunakan arsitektur modern (Next.js, Express.js, PostgreSQL) namun secara sengaja menggunakan implementasi kode tanpa pengamanan yang memadai pada branch `main` (*vulnerable*), dan kemudian diperbaiki secara menyeluruh pada branch `patched` (*remediated*).

---

## 2. Arsitektur Komunikasi & Pemetaan Port

Sistem berjalan secara 100% lokal (*on-premise / localhost*) dengan tiga lapisan utama (*3-tier architecture*):

```
+-------------------------------------------------------------+
|                     Client / Pentester                      |
|      (Browser / Burp Suite / Kali Linux / sqlmap / curl)     |
+------------------------------+------------------------------+
                               |
                               v
+-------------------------------------------------------------+
|                 Frontend: Next.js (App Router)              |
|                     Port: 3000 (HTTP)                       |
|   - Katalog Produk & Search UI (Target SQLi Error/UNION)    |
|   - Form Login (Target SQLi Auth Bypass)                    |
|   - Riwayat Pesanan User                                    |
|   - Detail Invoice Pesanan (Target IDOR Browser URL)        |
+------------------------------+------------------------------+
                               |
                               | REST API (JSON / Bearer JWT)
                               v
+-------------------------------------------------------------+
|                 Backend: Express.js REST API                |
|                     Port: 5000 (HTTP)                       |
|   - POST /api/auth/login        -> Rentan SQLi Concatenation|
|   - GET  /api/products?search=  -> Rentan SQLi Concatenation|
|   - GET  /api/orders            -> Validasi Token JWT       |
|   - GET  /api/orders/:id        -> Rentan IDOR (No user_id) |
+------------------------------+------------------------------+
                               |
                               | TCP / Raw SQL (Driver: pg)
                               v
+-------------------------------------------------------------+
|              Database: PostgreSQL 16 (Docker)               |
|                     Port: 5432 (TCP)                        |
|   - Container: pentest_postgres                             |
|   - Database: pentest_db                                    |
|   - User / Pass: admin / admin123                           |
|   - Data: users (PII), products, orders                     |
+-------------------------------------------------------------+
```

### Rincian Port:
- **Port 3000 (`frontend`)**: Next.js App Router yang menyajikan antarmuka visual pengguna, form pencarian, form autentikasi, dan tampilan invoice.
- **Port 5000 (`backend`)**: Express.js REST API yang menangani pemrosesan logika bisnis, autentikasi berbasis JWT, serta query raw SQL ke PostgreSQL.
- **Port 5432 (`database`)**: PostgreSQL 16 Alpine berjalan di dalam container Docker bernama `pentest_postgres`.

---

## 3. Strategi Alur Kerja Git Branch

Untuk memenuhi standar pengujian sebelum dan sesudah perbaikan (*before-and-after proof*), proyek dikelola menggunakan dua branch Git utama:

```
                  (Initial Commit: Scaffolding)
                              o
                             / \
                            /   \
   [branch: main]          /     \       [branch: patched]
   - Vulnerable Code      o       o      - Parameterized Queries ($1, $2)
   - String Concatenation |       |      - Ownership Check (IDOR Fix)
   - No Access Control    |       |      - Password Hashing (bcrypt)
   - Raw Error Returned   v       v      - Generic Error Responses
                 (Pentest Phase)  (Verification Phase)
```

1. **Branch `main` (Versi Rentan / Vulnerable Baseline)**:
   - Menyimpan seluruh kode aplikasi dengan celah SQLi dan IDOR aktif.
   - Digunakan untuk Fase 1 (Target Creation), Fase 2 (Enumeration), dan Fase 3 (Exploitation).
   - Menghasilkan bukti rekaman eksploitasi (screenshot Burp Suite, terminal sqlmap, dan kebocoran data di UI).
2. **Branch `patched` (Versi Aman / Remediated)**:
   - Dibuat dari `main`, kemudian dilakukan perbaikan kode secara menyeluruh.
   - Mengganti seluruh query string concatenation dengan *parameterized queries* via driver `pg`.
   - Menambahkan validasi kepemilikan objek pesanan (*ownership check*) pada endpoint `/api/orders/:id`.
   - Digunakan untuk Fase 4 (Remediation) dan Fase 5 (Proof & Verification).

---

## 4. Panduan Menjalankan Lingkungan Lokal

### Langkah 1: Menjalankan Database PostgreSQL via Docker
Pastikan Docker Desktop aktif di sistem, lalu jalankan perintah berikut di root repositori:
```bash
# Menjalankan container PostgreSQL di latar belakang
docker compose up -d

# Memastikan status container berjalan normal
docker ps --filter "name=pentest_postgres"

# Verifikasi tabel berhasil dibuat dan di-seed dari database/init.sql
docker exec -it pentest_postgres psql -U admin -d pentest_db -c "\dt"
```

> **Catatan Penting Reset & Re-Seed Database:**
> PostgreSQL pada Docker hanya mengeksekusi skrip `/docker-entrypoint-initdb.d/init.sql` saat volume `pgdata` pertama kali dibuat (masih kosong). Jika Anda memperbarui isi `database/init.sql` atau ingin mengembalikan data ke kondisi awal (*clean state*), hapus volume lama terlebih dahulu dengan perintah:
> ```bash
> docker compose down -v
> docker compose up -d
> ```

### Langkah 2: Menjalankan Server Backend
Buka terminal baru, masuk ke direktori `backend/`, lalu jalankan server dalam mode development:
```bash
cd backend
npm run dev
```
*Backend akan berjalan di `http://localhost:5000` dengan endpoint healthcheck di `http://localhost:5000/api/health`.*

### Langkah 3: Menjalankan Server Frontend
Buka terminal baru, masuk ke direktori `frontend/`, lalu jalankan server Next.js:
```bash
cd frontend
npm run dev
```
*Frontend akan dapat diakses melalui browser di `http://localhost:3000`.*

---

## 5. Checklist 5 Fase Wajib Penetration Testing

| Fase | Nama Fase | Deskripsi Utama | Target Output / Artefak |
| :--- | :--- | :--- | :--- |
| **Fase 1** | **Target Creation & Setup** | Menyiapkan infrastruktur lokal (Docker PostgreSQL, Express BE, Next.js FE) dengan dataset realistis. | Container aktif, database seeded, server merespons 200 OK. |
| **Fase 2** | **Reconnaissance & Enumeration** | Pemindaian port aktif, deteksi teknologi/framework, pemetaan rute URL dan parameter API. | Log scan `nmap`, header HTTP via `curl`, tree rute via `gobuster`/Burp. |
| **Fase 3** | **Exploitation (SQLi & IDOR)** | Melakukan bypass login SQLi, ekstraksi tabel `users` via UNION SELECT, pengujian `sqlmap`, dan pencurian invoice IDOR. | Screenshot Burp Repeater, dump data kredensial, invoice milik user lain. |
| **Fase 4** | **Remediation & Patching** | Menerapkan perbaikan di branch `patched` (Parameterized queries, ownership validation, bcrypt, generic errors). | Cuplikan kode *before vs after*, commit log di branch `patched`. |
| **Fase 5** | **Proof & Verification** | Menguji ulang target dengan payload dan request yang sama pada branch `patched` untuk membuktikan celah tertutup. | Screenshot respons 401/403, hasil scan sqlmap negatif, komparasi final. |
