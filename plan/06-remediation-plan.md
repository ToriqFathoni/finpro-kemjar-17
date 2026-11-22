# 06 - Rencana Remediasi & Perbaikan Kode (Remediation Plan)

## 1. Strategi Branching & Alur Kerja Remediasi

Seluruh perbaikan kode diimplementasikan secara terisolasi pada Git branch **`patched`**. Hal ini memastikan branch `main` tetap bersih sebagai baseline sistem rentan untuk kebutuhan demonstrasi, sedangkan branch `patched` menunjukkan implementasi standar keamanan perangkat lunak (*Secure Coding Best Practices*).

### Alur Eksekusi:
```bash
# Membuat dan berpindah ke branch patched
git checkout -b patched

# Melakukan pengeditan kode perbaikan di backend
# Menguji dan memvalidasi
# Commit perubahan
git add .
git commit -m "feat(security): remediate SQL Injection and IDOR vulnerabilities"
```

---

## 2. Remediasi 1: Menutup SQL Injection (Parameterized Queries)

### 2.1 Akar Masalah
Pada branch `main`, backend menggunakan konkatenasi string (`${var}`) langsung ke teks query SQL, sehingga input penyerang diinterpretasikan sebagai instruksi SQL oleh parser PostgreSQL.

### 2.2 Solusi Teknis
Mengganti seluruh penggabungan string dengan **Parameterized Queries (Prepared Statements)** menggunakan placeholder native driver `pg` (`$1`, `$2`, dst.). Dengan mekanisme ini, PostgreSQL memperlakukan input pengguna secara mutlak sebagai *literal data*, bukan sebagai kode eksekusi SQL.

---

### 2.3 Kode Sebelum vs Sesudah: Login Endpoint (`backend/src/routes/auth.js`)

#### SEBELUM (Vulnerable - `main`):
```javascript
// RENTAN: String concatenation langsung
const query = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;
const result = await pool.query(query);
```

#### SESUDAH (Patched - `patched`):
```javascript
// AMAN: Parameterized query menggunakan placeholder $1 dan $2
const query = 'SELECT id, username, password, full_name, role FROM users WHERE username = $1';
const result = await pool.query(query, [username]);

if (result.rows.length === 0) {
  return res.status(401).json({ error: 'Invalid username or password' });
}

const user = result.rows[0];

// Verifikasi password (atau verifikasi hash bcrypt pada mitigasi lanjutan)
if (user.password !== password) {
  return res.status(401).json({ error: 'Invalid username or password' });
}

// Terbitkan token JWT
const token = jwt.sign(
  { id: user.id, username: user.username, role: user.role, fullName: user.full_name },
  process.env.JWT_SECRET || 'supersecret_pentest_key',
  { expiresIn: '2h' }
);

res.json({
  message: 'Login successful',
  token,
  user: {
    id: user.id,
    username: user.username,
    fullName: user.full_name,
    role: user.role
  }
});
```

---

### 2.4 Kode Sebelum vs Sesudah: Search Produk (`backend/src/routes/products.js`)

#### SEBELUM (Vulnerable - `main`):
```javascript
let query = 'SELECT id, name, description, price, stock, category, image_url FROM products';
if (search) {
  // RENTAN: String interpolation klausa WHERE
  query += ` WHERE name ILIKE '%${search}%' OR description ILIKE '%${search}%'`;
}
const result = await pool.query(query);
```

#### SESUDAH (Patched - `patched`):
```javascript
let query = 'SELECT id, name, description, price, stock, category, image_url FROM products';
const params = [];

if (search && search.trim() !== '') {
  // AMAN: Parameterized ILIKE dengan placeholder $1
  query += ' WHERE name ILIKE $1 OR description ILIKE $1';
  params.push(`%${search.trim()}%`);
}

query += ' ORDER BY id ASC';

const result = await pool.query(query, params);
res.json({ count: result.rows.length, data: result.rows });
```

---

## 3. Remediasi 2: Menutup IDOR (Ownership Check & Access Control)

### 3.1 Akar Masalah
Backend hanya mengambil data pesanan berdasarkan `id` pesanan (`WHERE id = $1`) tanpa mencocokkan apakah kolom `user_id` pesanan tersebut sesuai dengan identitas pengguna yang terotentikasi di dalam token JWT (`req.user.id`).

### 3.2 Solusi Teknis
1. **Pemeriksaan Kepemilikan (Ownership Validation)**:
   - Menambahkan kondisi pemeriksaan hak akses:
     - Jika pengguna adalah pemilik pesanan (`order.user_id === req.user.id`), berikan akses (`200 OK`).
     - Jika pengguna memiliki role `admin`, berikan akses (*Role-Based Access Control*).
     - Jika bukan keduanya, tolak permintaan dengan status **HTTP 403 Forbidden** (`Access Denied`).
2. **Kueri Terikat (Bound Query)**:
   - Menyertakan `user_id` langsung ke klausa query jika pengguna bukan admin:
     `SELECT ... FROM orders WHERE id = $1 AND user_id = $2`.

---

### 3.3 Kode Sebelum vs Sesudah: Order Detail (`backend/src/routes/orders.js`)

#### SEBELUM (Vulnerable - `main`):
```javascript
router.get('/:id', authenticateToken, async (req, res) => {
  const orderId = req.params.id;
  const query = 'SELECT ... FROM orders o JOIN users u ON o.user_id = u.id WHERE o.id = $1';
  const result = await pool.query(query, [orderId]);

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Order invoice not found' });
  }

  // RENTAN IDOR: Langsung dikembalikan tanpa cek kepemilikan
  res.json({ data: result.rows[0] });
});
```

#### SESUDAH (Patched - `patched`):
```javascript
router.get('/:id', authenticateToken, async (req, res) => {
  const orderId = req.params.id;

  try {
    const query = `
      SELECT o.id, o.user_id, o.quantity, o.total_price, o.shipping_address, 
             o.recipient_phone, o.status, o.created_at,
             p.name AS product_name, p.price AS unit_price, p.description AS product_desc,
             u.full_name AS buyer_name, u.email AS buyer_email
      FROM orders o
      JOIN products p ON o.product_id = p.id
      JOIN users u ON o.user_id = u.id
      WHERE o.id = $1
    `;
    const result = await pool.query(query, [orderId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order invoice not found' });
    }

    const order = result.rows[0];

    // REMEDIASI IDOR: Ownership Check
    const isOwner = order.user_id === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        error: 'Forbidden: You do not have permission to view this order invoice.'
      });
    }

    res.json({ data: order });
  } catch (err) {
    console.error('Error fetching order invoice:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

---

## 4. Mitigasi Strategis Tambahan (Defense-in-Depth)

Untuk memenuhi standar keamanan profesional dalam laporan pentest, diterapkan 3 mitigasi tambahan:

### 4.1 Generic Error Handling (Mencegah Information Disclosure)
Pada branch `main`, blok `catch` mengembalikan `res.status(500).json({ error: err.message, query })` yang membocorkan struktur tabel. Pada branch `patched`, respons diseragamkan:
```javascript
catch (err) {
  console.error('[SERVER_ERROR]', err); // Log tetap ada di server untuk debugging developer
  res.status(500).json({ error: 'An unexpected error occurred. Please try again later.' });
}
```

### 4.2 Rekomendasi UUIDv4 untuk Mencegah Objek Sekuensial
Penggunaan nomor ID berurutan (`1, 2, 3...`) sangat mempermudah penyerang menebak parameter (*enumeration*). Disarankan mengubah tipe data primary key `orders` menjadi `UUID`:
```sql
-- Rekomendasi skema produksi:
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ...
);
```

### 4.3 Password Hashing dengan Bcrypt
Password di database wajib di-hash menggunakan algoritma adaptif seperti `bcrypt` dengan *salt rounds* minimal 10:
```javascript
const bcrypt = require('bcrypt');
const isMatch = await bcrypt.compare(inputPassword, user.password_hash);
```
