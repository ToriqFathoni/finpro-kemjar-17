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
