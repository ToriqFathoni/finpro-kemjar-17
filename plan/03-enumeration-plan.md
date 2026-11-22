# 03 - Rencana Enumerasi & Pengintaian Target (Reconnaissance)

## 1. Ruang Lingkup & Metodologi Pengujian

Tahap enumerasi bertujuan untuk mengidentifikasi seluruh permukaan serangan (*attack surface*), layanan yang sedang berjalan, teknologi penyusun aplikasi, serta parameter-parameter masukan yang berpotensi memiliki celah keamanan.

Pengujian dapat dilakukan dari dua perspektif lingkungan lokal:
1. **Local Host**: Langsung dari sistem operasi host pengembang mengarah ke `127.0.0.1` / `localhost`.
2. **Virtual Machine (Kali Linux)**: Menggunakan VM Kali Linux yang berada dalam satu jaringan (Host-only / NAT Network) mengarah ke IP Host fisik (misal: `192.168.56.1` atau `10.0.2.2`).

---

## 2. Tahap 1: Port Scanning & Deteksi Layanan (`nmap`)

Pemindaian port dilakukan untuk memastikan port mana saja yang terbuka pada target dan layanan apa yang berjalan di baliknya.

### Perintah Eksekusi Nmap
```bash
# 1. Quick Scan pada port yang relevan dengan proyek
nmap -p 3000,5000,5432 localhost

# 2. Comprehensive Service & Version Detection Scan
nmap -sV -sC -p 3000,5000,5432 -v localhost -oN plan/evidence/nmap_scan.txt
```

### Ekspektasi Hasil Output Nmap:
```text
PORT     STATE SERVICE    VERSION
3000/tcp open  http       Node.js (Next.js App Server)
5000/tcp open  http       Node.js Express framework
5432/tcp open  postgresql PostgreSQL DB 16.X
```

### Analisis Hasil Scan:
- **Port 3000**: Menjalankan web interface Next.js. Merupakan entry point interaksi pengguna utama.
- **Port 5000**: Menjalankan API backend berbasis Express.js. Menjadi target utama injeksi logika bisnis dan request crafting.
- **Port 5432**: Menjalankan PostgreSQL Database. Dalam kondisi produksi port ini seharusnya tidak terekspos ke publik, namun pada lingkungan lab lokal ini membuktikan keberadaan database relational yang dapat ditargetkan via SQL Injection.

---

## 3. Tahap 2: Technology Fingerprinting & HTTP Header Inspection

Langkah ini bertujuan mengenali teknologi di balik aplikasi web untuk menentukan strategi pembuatan payload yang sesuai dengan stack yang digunakan (misal: sintaks SQL spesifik PostgreSQL).

### Perintah Eksekusi:
```bash
# 1. Cek Header Port 3000 (Frontend)
curl -I http://localhost:3000

# 2. Cek Header Port 5000 (Backend API)
curl -I http://localhost:5000/api/health

# 3. Analisis mendalam menggunakan whatweb (dari Kali Linux)
whatweb http://localhost:3000
whatweb http://localhost:5000
```

### Indikator Penting yang Ditemukan:
- `X-Powered-By: Next.js` pada port 3000.
- `X-Powered-By: Express` pada port 5000.
- `Access-Control-Allow-Origin: *` (CORS terbuka, mempermudah interaksi API lintas domain).

---

## 4. Tahap 3: Directory & Endpoint Fuzzing

Enumerasi jalur direktori dan endpoint API dilakukan untuk menemukan rute yang tidak terdaftar secara eksplisit di menu navigasi.

### Menggunakan Gobuster (Directory Brute-Force)
```bash
# Brute force endpoint pada backend API
gobuster dir -u http://localhost:5000 -w /usr/share/wordlists/dirb/common.txt -x json,js -o plan/evidence/gobuster_api.txt
```

### Menggunakan Dirsearch
```bash
dirsearch -u http://localhost:5000 -e json,txt -t 20
```

### Pemetaan Endpoint yang Berhasil Ditemukan:
| Endpoint | Metode HTTP | Deskripsi Fungsi | Tingkat Autentikasi | Potensi Celah |
| :--- | :--- | :--- | :--- | :--- |
| `/api/health` | `GET` | Cek status server | Publik | Low (Info Disclosure) |
| `/api/products` | `GET` | Katalog & Pencarian (`?search=`) | Publik | **CRITICAL: SQL Injection** |
| `/api/auth/login` | `POST` | Autentikasi Pengguna | Publik | **CRITICAL: SQLi Auth Bypass** |
| `/api/orders` | `GET` | Daftar pesanan user | Authenticated (JWT) | Validasi Kepemilikan |
| `/api/orders/:id` | `GET` | Invoice pesanan spesifik | Authenticated (JWT) | **HIGH: IDOR / BOLA** |

---

## 5. Tahap 4: Intersepsi Traffic dengan Burp Suite

Menyiapkan Burp Suite sebagai proxy lokal untuk menangkap seluruh request antara browser dan backend:
1. Set proxy browser ke `127.0.0.1:8080`.
2. Akses `http://localhost:3000`.
3. Telusuri seluruh fungsi: mencari barang, mencoba login, melihat pesanan, dan membuka invoice.
4. Periksa tab **Target -> Site map** di Burp Suite untuk melihat peta struktur request dan respons JSON secara lengkap.

---

## 6. Checklist Artefak & Screenshot yang Wajib Diambil

- [ ] Screenshot 1: Terminal hasil eksekusi perintah `nmap` yang memperlihatkan 3 port terbuka (3000, 5000, 5432).
- [ ] Screenshot 2: Terminal hasil `curl -I` yang memperlihatkan header HTTP server backend dan frontend.
- [ ] Screenshot 3: Output tool directory fuzzing (`gobuster` atau `dirsearch`) yang menemukan endpoint `/api/products` dan `/api/orders`.
- [ ] Screenshot 4: Burp Suite Site Map yang memetakan seluruh interaksi request-response aplikasi TechStore.
