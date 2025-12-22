const { Pool } = require('pg');

// Create connection pool with memory-optimized settings for 512MB RAM
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5, // Maximum 5 connections (low memory)
  min: 1, // Keep at least 1 connection alive
  idleTimeoutMillis: 30000, // Close idle connections after 30s
  connectionTimeoutMillis: 5000, // Timeout after 5s
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false
});

// Test connection on startup
pool.on('connect', () => {
  console.log('📦 Connected to PostgreSQL');
});

pool.on('error', (err) => {
  console.error('❌ Database error:', err);
});

// Helper for single queries
const query = (text, params) => pool.query(text, params);

// Helper for transactions
const getClient = () => pool.connect();

module.exports = {
  pool,
  query,
  getClient
};
