const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  const { search } = req.query;

  let query = 'SELECT id, name, description, price, stock, category, image_url FROM products';
  const params = [];

  if (search && typeof search === 'string' && search.trim() !== '') {
    // AMAN: Parameterized query untuk mencegah SQL Injection UNION-based maupun Error-based
    query += ' WHERE name ILIKE $1 OR description ILIKE $1';
    params.push(`%${search.trim()}%`);
  }

  query += ' ORDER BY id ASC';

  try {
    const result = await pool.query(query, params);
    res.json({ count: result.rows.length, data: result.rows });
  } catch (err) {
    // Sanitasi error: cegah kebocoran sintaks query atau error internal database
    console.error('Error retrieving products:', err);
    res.status(500).json({ error: 'Failed to retrieve products' });
  }
});

module.exports = router;
