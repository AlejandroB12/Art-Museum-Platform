const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

// MySQL
const mysql = require('mysql2');
const pool = mysql.createPool({
    host: process.env.DB_HOST_MYSQL || 'localhost',
    user: process.env.DB_USER_MYSQL || 'root',
    password: process.env.DB_PASSWORD_MYSQL || '',
    database: process.env.DB_NAME_MYSQL || 'museodb',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Versión con callbacks (para admin_router.js y otros viejos)
const db = pool;

// Versión con promesas (para los repositorios nuevos)
const dbPromise = pool.promise();

// Neo4j
const neo4j = require('neo4j-driver');
const driver = neo4j.driver(
    process.env.NEO4J_URI || 'neo4j://localhost:7687',
    neo4j.auth.basic(process.env.NEO4J_USERNAME || 'neo4j', process.env.NEO4J_PASSWORD || 'password'),
    { maxConnectionPoolSize: 10, connectionTimeout: 30000 }
);
const getSession = () => driver.session();

module.exports = { db, client: db, getSession, dbPromise };