const mysql = require('mysql2');
const { promisify } = require('util');
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });

const db = mysql.createConnection({
    host: process.env.DB_HOST_MYSQL,
    user: process.env.DB_USER_MYSQL,
    password: process.env.DB_PASSWORD_MYSQL,
    database: process.env.DB_NAME_MYSQL
});

db.connect((err) => {
    if (err) { console.error('Error conectando a MySQL:', err); return; }
    console.log('Conexion exitosa a MySQL.');
});

const query = promisify(db.query).bind(db);

async function beginTransaction() {
    return new Promise((resolve, reject) => {
        db.beginTransaction(err => err ? reject(err) : resolve());
    });
}

async function commit() {
    return new Promise((resolve, reject) => {
        db.commit(err => err ? reject(err) : resolve());
    });
}

async function rollback() {
    return new Promise((resolve) => {
        db.rollback(() => resolve());
    });
}

async function queryRaw(sql, params = []) {
    return query(sql, params);
}

module.exports = { db, query, beginTransaction, commit, rollback, queryRaw };
