# 08 - Pemetaan Artefak Teknis ke Laporan Akhir Praktikum

## 1. Struktur Standar Laporan Akhir Praktikum Pentest

Laporan akhir Praktikum Keamanan Jaringan dirancang mengacu pada standar laporan uji penetrasi profesional (misal: format *PTES - Penetration Testing Execution Standard* dan laporan keamanan akademis).

Berikut adalah struktur bab yang wajib dipenuhi:
1. **Bab I: Pendahuluan**
2. **Bab II: Landasan Teori & Arsitektur Sistem**
3. **Bab III: Tahap Pengintaian & Enumerasi (Reconnaissance)**
4. **Bab IV: Tahap Eksploitasi Kerentanan (Exploitation)**
5. **Bab V: Tahap Remediasi & Pengujian Ulang (Remediation & Proof)**
6. **Bab VI: Kesimpulan & Rekomendasi Keamanan**
7. **Lampiran (Appendices)**

---

## 2. Tabel Pemetaan Seluruh Artefak Teknis ke Bab Laporan

Tabel ini menjadi panduan praktikan dalam menempatkan tangkapan layar (*screenshot*), log terminal, dan cuplikan kode ke dalam bab laporan yang tepat.

| ID Artefak | Deskripsi Artefak Teknis | Format Bukti | Sumber Perintah / Alat | Bab Penempatan Laporan |
| :---: | :--- | :--- | :--- | :---: |
| **ART-01** | Diagram arsitektur 3-tier TechStore (FE, BE, DB) dan alur komunikasi port | Diagram / Gambar | Mermaid / Draw.io | **Bab II** (Arsitektur Sistem) |
| **ART-02** | Tabel skema database (`users`, `products`, `orders`) dan dataset awal | Tabel Markdown / Cuplikan SQL | `database/init.sql` | **Bab II** (Spesifikasi Basis Data) |
| **ART-03** | Status container Docker PostgreSQL aktif di port 5432 | Screenshot Terminal | `docker ps --filter "name=pentest_postgres"` | **Bab II** (Lingkungan Pengujian) |
| **ART-04** | Hasil pemindaian port dan deteksi versi layanan nmap (Port 3000, 5000, 5432) | Screenshot Terminal / Teks Log | `nmap -sV -sC -p 3000,5000,5432 localhost` | **Bab III** (Port Scanning) |
| **ART-05** | Header HTTP fingerprinting (Next.js, Express, CORS) | Screenshot Terminal | `curl -I http://localhost:3000` & `5000/api/health` | **Bab III** (Fingerprinting) |
| **ART-06** | Hasil directory brute-force menemukan endpoint API (`/api/products`, `/orders`) | Screenshot Terminal | `gobuster dir -u http://localhost:5000 ...` | **Bab III** (Endpoint Discovery) |
| **ART-07** | Burp Suite Site Map yang memetakan seluruh interaksi request-response | Screenshot GUI | Burp Suite Target tab | **Bab III** (Pemetaan Permukaan Serang) |
| **ART-08** | Form login di browser dieksploitasi dengan `' OR '1'='1' --` dan berhasil masuk Admin | Screenshot Browser | Browser UI `/login` | **Bab IV** (SQLi Auth Bypass) |
| **ART-09** | Intersepsi request dan response login SQLi bypass pada Burp Suite | Screenshot GUI | Burp Suite Repeater `POST /api/auth/login` | **Bab IV** (SQLi Auth Bypass) |
| **ART-10** | Tampilan katalog produk menampilkan dump isi tabel `users` via UNION SELECT | Screenshot Browser | Browser UI `/` (Search Bar) | **Bab IV** (SQLi Data Extraction) |
| **ART-11** | Log eksekusi `sqlmap` yang berhasil men-dump tabel `users` dari database `pentest_db` | Screenshot Terminal / File Log | `sqlmap -u "..." -D pentest_db -T users --dump` | **Bab IV** (Automated SQLi) |
| **ART-12** | Daftar pesanan sah milik Bob di halaman `/orders` (hanya Order #3 dan #4) | Screenshot Browser | Browser UI `/orders` | **Bab IV** (Baseline Akses Bob) |
| **ART-13** | Bob mengakses `/orders/1` di browser dan berhasil melihat invoice pribadi milik Alice | Screenshot Browser | Browser UI `/orders/1` | **Bab IV** (IDOR Exploitation) |
| **ART-14** | Request cURL / Burp Suite: Bob menggunakan tokennya untuk `GET /api/orders/1` (200 OK) | Screenshot Terminal / GUI | `curl -H "Authorization: Bearer <TOKEN_BOB>" ...` | **Bab IV** (IDOR Proof of Concept) |
| **ART-15** | Tabel klasifikasi CWE, OWASP Top 10 (2021), skor CVSS v3.1, dan dampak CIA Triad | Tabel Analisis | Dokumen `plan/04-exploitation-sqli.md` & `05` | **Bab IV** (Risk & Severity Assessment) |
| **ART-16** | Cuplikan kode *Before vs After* SQL Injection (String concat vs Parameterized) | Code Snippet Diff | `git diff main..patched backend/src/routes/` | **Bab V** (Remediasi SQLi) |
| **ART-17** | Cuplikan kode *Before vs After* IDOR (Ketiadaan validasi vs Ownership check) | Code Snippet Diff | `git diff main..patched backend/src/routes/orders.js` | **Bab V** (Remediasi IDOR) |
| **ART-18** | Re-testing login SQLi di branch `patched`: gagal dengan respons `401 Unauthorized` | Screenshot Browser / Burp | `POST /api/auth/login` payload bypass | **Bab V** (Verifikasi SQLi) |
| **ART-19** | Re-testing search SQLi di branch `patched`: mengembalikan array kosong / 0 hasil | Screenshot Browser | Search bar `/` dengan payload UNION | **Bab V** (Verifikasi SQLi) |
| **ART-20** | Re-testing `sqlmap` di branch `patched`: melaporkan *all parameters not injectable* | Screenshot Terminal | `sqlmap` scan di branch `patched` | **Bab V** (Verifikasi Otomatis) |
| **ART-21** | Re-testing IDOR di browser `/orders/1`: menampilkan pesan penolakan `403 Forbidden` | Screenshot Browser | Browser UI `/orders/1` pada branch `patched` | **Bab V** (Verifikasi IDOR) |
| **ART-22** | Re-testing IDOR via cURL / Burp: mengembalikan status HTTP `403 Forbidden` | Screenshot Terminal / GUI | `curl -H "Authorization: Bearer <TOKEN_BOB>" ...` | **Bab V** (Verifikasi IDOR) |
| **ART-23** | Matriks ringkasan komparasi komprehensif Before vs After | Tabel Komparasi | Dokumen `plan/07-proof-and-verification.md` | **Bab V** (Evaluasi Efektivitas) |
| **ART-24** | Commit log Git yang membuktikan pemisahan branch `main` dan `patched` | Screenshot Terminal | `git log --graph --oneline --all` | **Lampiran** (Integritas Pengujian) |
| **ART-25** | Kode sumber lengkap konfigurasi lingkungan (`docker-compose.yml`, `init.sql`) | File Konfigurasi | `docker-compose.yml`, `database/init.sql` | **Lampiran** (Setup Environment) |

---

## 3. Panduan Pengambilan & Penamaan File Artefak

Agar pengumpulan bukti tertata rapi dan tidak tercecer selama sesi praktikum:
1. Buat folder penyimpanan bukti di: `plan/evidence/` atau direktori laporan Word/LaTeX Anda.
2. Gunakan konvensi penamaan seragam:
   - `01_nmap_scan.png`
   - `02_curl_headers.png`
   - `03_burp_sitemap.png`
   - `04_sqli_login_bypass_ui.png`
   - `05_sqli_burp_login.png`
   - `06_sqli_union_search_ui.png`
   - `07_sqli_sqlmap_dump.png`
   - `08_idor_bob_orders_ui.png`
   - `09_idor_alice_invoice_ui.png`
   - `10_idor_burp_poc.png`
   - `11_remediation_code_diff.png`
   - `12_retest_sqli_login_blocked.png`
   - `13_retest_sqlmap_clean.png`
   - `14_retest_idor_403_ui.png`
   - `15_retest_idor_403_burp.png`
3. Pastikan resolusi tangkapan layar jelas dan bagian parameter/header yang penting ditandai (highlight) untuk memudahkan penilaian dosen/asisten praktikum.
