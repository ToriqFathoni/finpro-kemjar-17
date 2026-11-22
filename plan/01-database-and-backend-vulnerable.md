# 01 - Rancang Bangun Database & Backend (Versi Rentan)

## 1. Skema Database PostgreSQL (`database/init.sql`)

Database dirancang untuk menampung data operasional toko online gadget TechStore. File [`database/init.sql`](file:///c:/WebDev/finpro-kemjar/database/init.sql) akan otomatis dieksekusi saat container pertama kali dibuat.

### 1.1 Struktur Tabel
Skema mencakup 3 entitas utama:
1. `users`: Menyimpan kredensial pengguna, profil, dan data sensitif (alamat, nomor HP, peran).
2. `products`: Menyimpan katalog barang elektronik/gadget beserta harga dan stok.
3. `orders`: Menyimpan transaksi pembelian yang mengaitkan pengguna dengan produk yang dibeli beserta alamat pengiriman.

```sql
-- database/init.sql

DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS users;

-- 1. Tabel Users
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL, -- Catatan: Plaintext pada versi vulnerable untuk visibilitas lab
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    address TEXT NOT NULL,
    role VARCHAR(20) DEFAULT 'customer',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabel Products
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    price NUMERIC(12, 2) NOT NULL,
    stock INT NOT NULL DEFAULT 10,
    category VARCHAR(50) NOT NULL,
    image_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabel Orders
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INT NOT NULL DEFAULT 1,
    total_price NUMERIC(12, 2) NOT NULL,
    shipping_address TEXT NOT NULL,
    recipient_phone VARCHAR(20) NOT NULL,
    status VARCHAR(30) DEFAULT 'Processing',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 1.2 Dummy Data Realistis
Dataset mencakup 3 profil pengguna (Admin, Alice sebagai korban, dan Bob sebagai penyerang) serta transaksi belanja realistis.

```sql
-- Seeding Tabel Users
INSERT INTO users (username, email, password, full_name, phone, address, role) VALUES
('admin', 'admin@techstore.local', 'AdminMaster2026!', 'Budi Santoso (System Admin)', '0812-9988-7766', 'Gedung Cyber 1 Lantai 8, Kuningan Barat, Jakarta Selatan', 'admin'),
('alice', 'alice.walker@email.com', 'AliceSecret#88', 'Alice Walker', '0813-1122-3344', 'Jl. Kemang Raya No. 42A, Mampang Prapatan, Jakarta Selatan', 'customer'),
('bob', 'bob.miller@email.com', 'BobPassword123', 'Bob Miller', '0857-4455-6677', 'Apartemen Sudirman Tower Lt. 12 No. 1205, Jakarta Pusat', 'customer');

-- Seeding Tabel Products
INSERT INTO products (name, description, price, stock, category, image_url) VALUES
('Laptop ASUS ROG Zephyrus G16', 'Laptop gaming tipis performa tinggi Intel Core i9 Gen 14 RTX 4080 32GB RAM OLED 240Hz', 38999000.00, 5, 'Laptop', 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45'),
('Apple MacBook Pro 16 M3 Max', 'Workstation profesional Apple Silicon M3 Max 64GB Unified Memory 1TB SSD Space Black', 54999000.00, 3, 'Laptop', 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8'),
('Keyboard Mechanical Keychron Q1 Pro', 'Custom wireless mechanical keyboard QMK/VIA aluminium chassis Gateron Jupiter Banana', 2850000.00, 15, 'Accessories', 'https://images.unsplash.com/photo-1587829741301-dc798b83add3'),
('Mouse Wireless Logitech MX Master 3S', 'Ergonomic performance mouse 8K DPI Quiet clicks MagSpeed electromagnetic scroll', 1699000.00, 25, 'Accessories', 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7'),
('Monitor Gaming LG UltraGear 27-inch', 'Monitor OLED 240Hz 0.03ms QHD 2560x1440 G-Sync HDR10 DisplayPort 1.4', 12500000.00, 8, 'Monitor', 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf'),
('Headset SteelSeries Arctis Nova Pro', 'Multi-system wireless gaming headset Hi-Res audio Active Noise Cancellation', 5490000.00, 10, 'Audio', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e'),
('Webcam Anker PowerConf C300', 'Full HD 1080p 60fps AI auto-focus dual mic wide angle video conference camera', 1450000.00, 20, 'Accessories', 'https://images.unsplash.com/photo-1585060544812-6b45742d762f'),
('Docking Station CalDigit TS4 Thunderbolt 4', '18 ports connectivity 98W host charging dual 6K display support SD UHS-II', 6800000.00, 6, 'Accessories', 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c');

-- Seeding Tabel Orders
-- Order 1 & 2 milik Alice (Berisi data sensitif alamat dan nomor HP Alice)
INSERT INTO orders (user_id, product_id, quantity, total_price, shipping_address, recipient_phone, status) VALUES
(2, 2, 1, 54999000.00, 'Jl. Kemang Raya No. 42A, Mampang Prapatan, Jakarta Selatan (Rumah Alice)', '0813-1122-3344', 'Delivered'),
(2, 4, 1, 1699000.00, 'Jl. Kemang Raya No. 42A, Mampang Prapatan, Jakarta Selatan (Rumah Alice)', '0813-1122-3344', 'Shipped');

-- Order 3 & 4 milik Bob
INSERT INTO orders (user_id, product_id, quantity, total_price, shipping_address, recipient_phone, status) VALUES
(3, 3, 1, 2850000.00, 'Apartemen Sudirman Tower Lt. 12 No. 1205, Jakarta Pusat (Unit Bob)', '0857-4455-6677', 'Delivered'),
(3, 6, 1, 5490000.00, 'Apartemen Sudirman Tower Lt. 12 No. 1205, Jakarta Pusat (Unit Bob)', '0857-4455-6677', 'Processing');

-- Order 5 milik Admin
INSERT INTO orders (user_id, product_id, quantity, total_price, shipping_address, recipient_phone, status) VALUES
(1, 1, 2, 77998000.00, 'Gedung Cyber 1 Lantai 8, Kuningan Barat, Jakarta Selatan (Ruang Server)', '0812-9988-7766', 'Completed');
```

---

## 2. Spesifikasi Endpoint REST API Backend

Backend dibangun menggunakan **Express.js** dengan driver database native `pg` (**tanpa ORM**). Struktur file backend:
```text
backend/
├── src/
│   ├── index.js          # Inisialisasi Express & routing utama
│   ├── db.js             # Konfigurasi pg Pool
│   ├── middleware/
│   │   └── auth.js       # Verifikasi token JWT
│   └── routes/
│       ├── auth.js       # Endpoint login (Vulnerable SQLi)
│       ├── products.js   # Endpoint katalog & search (Vulnerable SQLi)
│       └── orders.js     # Endpoint order list & detail (Vulnerable IDOR)
├── .env
└── package.json
```

### 2.1 Konfigurasi Database Connection (`backend/src/db.js`)
```javascript
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://admin:admin123@localhost:5432/pentest_db',
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle database client', err);
});

module.exports = pool;
```

### 2.2 Middleware Autentikasi (`backend/src/middleware/auth.js`)
Mengekstrak dan memverifikasi token JWT dari header `Authorization: Bearer <token>`.
```javascript
const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'supersecret_pentest_key', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user; // Menyimpan decoded payload { id, username, role }
    next();
  });
}

module.exports = authenticateToken;
```

### 2.3 Endpoint 1: Login Autentikasi (`POST /api/auth/login`)
- **Tujuan**: Menerima input `username` dan `password`, memverifikasi kredensial, dan mengembalikan token JWT.
- **Celah Keamanan**: Menggunakan **string concatenation** langsung pada query SQL.
- **Kode Vulnerable**:
  ```javascript
  // backend/src/routes/auth.js
  const express = require('express');
  const router = express.Router();
  const jwt = require('jsonwebtoken');
  const pool = require('../db');

  router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    // VULNERABLE: String concatenation langsung tanpa parameterization
    const query = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;

    try {
      const result = await pool.query(query);

      if (result.rows.length === 0) {
        return res.status(401).json({ error: 'Invalid username or password' });
      }

      const user = result.rows[0];
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
    } catch (err) {
      // Mengembalikan detail error SQL agar mendukung error-based reconnaissance
      res.status(500).json({ error: err.message, query });
    }
  });

  module.exports = router;
  ```

### 2.4 Endpoint 2: Katalog & Search Produk (`GET /api/products?search=...`)
- **Tujuan**: Mengambil daftar produk, opsional dengan filter parameter query `search`.
- **Celah Keamanan**: Menggabungkan nilai `search` langsung ke klausa `WHERE ... ILIKE`.
- **Kode Vulnerable**:
  ```javascript
  // backend/src/routes/products.js
  const express = require('express');
  const router = express.Router();
  const pool = require('../db');

  router.get('/', async (req, res) => {
    const { search } = req.query;

    let query = 'SELECT id, name, description, price, stock, category, image_url FROM products';

    if (search) {
      // VULNERABLE: String interpolation ke klausa WHERE
      query += ` WHERE name ILIKE '%${search}%' OR description ILIKE '%${search}%'`;
    }

    try {
      const result = await pool.query(query);
      res.json({ count: result.rows.length, data: result.rows });
    } catch (err) {
      // Mengembalikan detail error PostgreSQL untuk analisis eksploitasi
      res.status(500).json({ error: err.message, query });
    }
  });

  module.exports = router;
  ```

### 2.5 Endpoint 3: Daftar Pesanan User (`GET /api/orders`)
- **Tujuan**: Menampilkan seluruh riwayat pesanan milik user yang sedang terotentikasi.
- **Implementasi**: Menggunakan parameter `$1` untuk `req.user.id`.
  ```javascript
  // backend/src/routes/orders.js
  const express = require('express');
  const router = express.Router();
  const pool = require('../db');
  const authenticateToken = require('../middleware/auth');

  router.get('/', authenticateToken, async (req, res) => {
    try {
      const query = `
        SELECT o.id, o.quantity, o.total_price, o.status, o.created_at,
               p.name AS product_name, p.price AS unit_price, p.category
        FROM orders o
        JOIN products p ON o.product_id = p.id
        WHERE o.user_id = $1
        ORDER BY o.created_at DESC
      `;
      const result = await pool.query(query, [req.user.id]);
      res.json({ data: result.rows });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  ```

### 2.6 Endpoint 4: Detail Invoice Pesanan (`GET /api/orders/:id`)
- **Tujuan**: Menampilkan rincian invoice lengkap dari pesanan tertentu (termasuk nama penerima, alamat pengiriman, dan nomor telepon).
- **Celah Keamanan (IDOR)**: Endpoint hanya memeriksa apakah `id` pesanan ada di database (`WHERE o.id = $1`), **tanpa memvalidasi apakah `o.user_id` cocok dengan `req.user.id`**.
- **Kode Vulnerable**:
  ```javascript
  router.get('/:id', authenticateToken, async (req, res) => {
    const orderId = req.params.id;

    try {
      // VULNERABLE IDOR: Tidak ada filter 'AND o.user_id = $2'
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

      // Data langsung dikembalikan tanpa verifikasi kepemilikan
      res.json({ data: result.rows[0] });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  module.exports = router;
  ```

### 2.7 Entry Point Server Express (`backend/src/index.js`)
Mengintegrasikan seluruh middleware dan me-mount ketiga modul route utama (`/api/auth`, `/api/products`, `/api/orders`):
```javascript
// backend/src/index.js
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(cookieParser());

// Healthcheck endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Registrasi route API utama
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
```

---

## 3. Acceptance Criteria Backend (Versi Vulnerable)

1. **Docker Database**: Container `pentest_postgres` aktif di port `5432`, tabel `users`, `products`, `orders` terisi data awal dari `init.sql`.
2. **Konektivitas Backend**: Server Express mendengarkan di port `5000`, `GET /api/health` mengembalikan `{ status: "ok" }`.
3. **Reproduksi SQLi Auth Bypass**:
   - `POST /api/auth/login` dengan body `{"username": "' OR '1'='1' --", "password": "random"}` berhasil menghasilkan respons `200 OK` dan token JWT milik user `admin`.
4. **Reproduksi SQLi UNION**:
   - `GET /api/products?search=' UNION SELECT null, version(), null, null, null, null, null--` mengembalikan informasi versi PostgreSQL pada salah satu kolom produk.
5. **Reproduksi IDOR**:
   - Pengguna login sebagai `bob` (user_id = 3).
   - Melakukan request `GET /api/orders/1` (order milik `alice`) dengan token `bob`.
   - Backend merespons `200 OK` dan menampilkan data alamat serta nomor telepon pribadi `alice`.
