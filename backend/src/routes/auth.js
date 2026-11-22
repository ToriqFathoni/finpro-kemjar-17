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
