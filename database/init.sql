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
