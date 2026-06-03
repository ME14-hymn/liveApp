// backend/db.js
const mysql = require('mysql2/promise');
const { URL } = require('url');

const dbUrl = process.env.DATABASE_URL;
console.log("DATABASE_URL:", dbUrl); // Debug log

const parsedUrl = new URL(dbUrl);

const pool = mysql.createPool({
  host: parsedUrl.hostname,
  port: parsedUrl.port,
  user: parsedUrl.username,
  password: parsedUrl.password,
  database: parsedUrl.pathname.replace('/', ''),
  waitForConnections: true,
  connectionLimit: 10,
  ssl: { rejectUnauthorized: false } // Important for Railway internal MySQL
});

module.exports = pool;
