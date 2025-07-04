import pg from 'pg';
import dotenv from "dotenv";
const { Pool } = pg;

dotenv.config();
const DB_URL = process.env.DB_URL;

const pool = new Pool({
  user: 'Stockverse_admin',
  host: `${DB_URL}`,
  database: 'StockverseDB',
  password: 'Preston23!',
  port: 5432,
  ssl: {
    rejectUnauthorized: false,
  },
});

// Test the connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Error executing query', err.stack);
  } else {
    console.log('Connection successful:', res.rows[0]);
  }
});

export default pool;
