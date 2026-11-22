const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://admin:admin123@localhost:5433/pentest_db',
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle database client', err);
});

module.exports = pool;
