const mysql = require('mysql2/promise');

let pool;

async function initDB() {
  // First connect without a database to create it if needed
  const temp = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });

  await temp.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\``);
  await temp.end();

  // Now create the pool with the database selected
  pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
  });

  // Create tables if they don't exist
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(150) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      avatar VARCHAR(255) DEFAULT NULL,
      reset_token VARCHAR(255) DEFAULT NULL,
      reset_expires DATETIME DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS projects (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      name VARCHAR(150) NOT NULL,
      description TEXT,
      color VARCHAR(20) DEFAULT '#6366f1',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      project_id INT DEFAULT NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      status ENUM('todo', 'in_progress', 'done') DEFAULT 'todo',
      priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
      due_date DATE DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
    )
  `);

  console.log('✅ Database and tables ready');
  return pool;
}

function getPool() {
  if (!pool) throw new Error('DB not initialized. Call initDB() first.');
  return pool;
}

// Make pool accessible via module (after init)
const handler = {
  get(target, prop) {
    return getPool()[prop];
  }
};

module.exports = { initDB, db: new Proxy({}, handler) };
