const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const pool = new Pool({
    connectionString: process.env.SUPABASE_URL,
    ssl: { rejectUnauthorized: false }
});

pool.on('error', (err) => {
    console.error('Error en pool de PostgreSQL:', err.message);
});

async function query(text, params = []) {
    const result = await pool.query(text, params);
    return result.rows;
}

async function queryRaw(text, params = []) {
    const result = await pool.query(text, params);
    return result;
}

async function beginTransaction() {
    const client = await pool.connect();
    await client.query('BEGIN');
    return client;
}

async function commit(client) {
    await client.query('COMMIT');
    client.release();
}

async function rollback(client) {
    await client.query('ROLLBACK');
    client.release();
}

module.exports = { pool, query, queryRaw, beginTransaction, commit, rollback };
