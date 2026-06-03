// backend/db.js
const mysql = require('mysql2/promise');
const url = require('url');

const dbUrl = process.env.DATABASE_URL;
const parsedUrl = new url.URL(dbUrl);

const pool = mysql.createPool({
  host: parsedUrl.hostname,
  port: parsedUrl.port,
  user: parsedUrl.username,
  password: parsedUrl.password,
  database: parsedUrl.pathname.replace('/', ''),
  waitForConnections: true,
  connectionLimit: 10,
});

module.exports = pool;
