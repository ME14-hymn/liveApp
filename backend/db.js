// backend/db.js
const mysql = require('mysql2/promise');

// Use Railway's DATABASE_URL connection string
const pool = mysql.createPool(process.env.DATABASE_URL);

module.exports = pool;
