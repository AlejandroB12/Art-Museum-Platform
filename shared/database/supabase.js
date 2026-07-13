const { Pool } = require('pg');
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });

const pool = new Pool({
    connectionString: process.env.SUPABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 8000,
});

const connectSupabase = async () => {
    try {
        const client = await pool.connect();
        await client.query('SELECT 1');
        client.release();
        console.log('Supabase (PostgreSQL) conectado');
        return pool;
    } catch (err) {
        console.error('Error conectando a Supabase:', err.message);
        return null;
    }
};

const query = async (text, params) => pool.query(text, params);

const getClient = async () => pool.connect();

const closeSupabase = async () => {
    await pool.end();
};

module.exports = { pool, connectSupabase, query, getClient, closeSupabase };
