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
