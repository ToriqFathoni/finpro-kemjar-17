const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const pool = require('../db');

router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    // AMAN: Parameterized query untuk mencegah SQL Injection
    const query = 'SELECT id, username, password, full_name, role FROM users WHERE username = $1';
    const result = await pool.query(query, [username]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const user = result.rows[0];

    // Verifikasi password
    if (user.password !== password) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

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
    // Sanitasi error: cegah information disclosure / error database internal
    console.error('Error during login:', err);
    res.status(500).json({ error: 'An unexpected error occurred. Please try again later.' });
  }
});

module.exports = router;
