const { db } = require('../config/database');
const { promisify } = require('util');
const query = promisify(db.query).bind(db);

async function findByEmail(email) {
    return query("SELECT * FROM Usuario WHERE Email = ?", [email]);
}

async function findById(id) {
    return query("SELECT * FROM Usuario WHERE id_usuario = ?", [id]);
}

async function findWithComprador(id) {
    return query(
        `SELECT u.id_usuario, u.Email, u.Rol, u.Estatus, u.Nombre, u.Apellido,
                c.PuedeAdquirir, c.Cedula, c.Telefono, c.CodigoVerificacion,
                c.id_parroquia, c.Calle
         FROM Usuario u
         LEFT JOIN Comprador c ON u.id_usuario = c.id_usuario
         WHERE u.id_usuario = ?`, [id]
    );
}

async function findWithMembresiaStatus(id) {
    return query(`
        SELECT u.Rol, c.PuedeAdquirir,
               CASE WHEN EXISTS (
                   SELECT 1 FROM Membresia m
                   WHERE m.id_usuario = u.id_usuario
                   AND NOW() <= DATE_ADD(m.FechaPago, INTERVAL (m.MontoPagado / 10 * 30) DAY)
               ) THEN 1 ELSE 0 END AS MembresiaActiva
        FROM Usuario u
        LEFT JOIN Comprador c ON u.id_usuario = c.id_usuario
        WHERE u.id_usuario = ?
    `, [id]);
}

async function updateEstatus(id, estatus) {
    return query("UPDATE Usuario SET Estatus = ? WHERE id_usuario = ?", [estatus, id]);
}

async function updatePassword(id, password) {
    return query("UPDATE Usuario SET Contraseña = ? WHERE id_usuario = ?", [password, id]);
}

async function deleteById(id) {
    return query("DELETE FROM Usuario WHERE id_usuario = ?", [id]);
}

async function findAllUsers() {
    return query(`
        SELECT u.id_usuario, u.Email, u.Rol, u.Estatus,
               c.PuedeAdquirir,
               CASE WHEN EXISTS (
                   SELECT 1 FROM Membresia m
                   WHERE m.id_usuario = u.id_usuario
                   AND NOW() <= DATE_ADD(m.FechaPago, INTERVAL (m.MontoPagado / 10 * 30) DAY)
               ) THEN 1 ELSE 0 END AS MembresiaActiva
        FROM Usuario u
        LEFT JOIN Comprador c ON u.id_usuario = c.id_usuario
    `);
}

async function findPendingUsers() {
    return query(`
        SELECT u.id_usuario, u.Email, u.Rol, u.Estatus, c.CodigoVerificacion
        FROM Usuario u
        LEFT JOIN Comprador c ON u.id_usuario = c.id_usuario
        WHERE u.Estatus = 0 AND u.Rol != 'administrador'
    `);
}

async function findUserNamesByIds(ids) {
    if (ids.length === 0) return [];
    const placeholders = ids.map(() => '?').join(',');
    return query(
        `SELECT id_usuario, Nombre, Apellido FROM Usuario WHERE id_usuario IN (${placeholders})`, ids
    );
}

async function updatePuedeAdquirir(id, value) {
    return query("UPDATE Comprador SET PuedeAdquirir = ? WHERE id_usuario = ?", [value, id]);
}

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

async function searchBuyer(email, cedula) {
    let sql = "SELECT u.id_usuario, u.Email, u.Nombre, u.Apellido, c.Cedula FROM Usuario u LEFT JOIN Comprador c ON u.id_usuario = c.id_usuario WHERE";
    const params = [];
    const conditions = [];
    if (email) { conditions.push("u.Email = ?"); params.push(email); }
    if (cedula) { conditions.push("c.Cedula = ?"); params.push(cedula); }
    sql += " " + conditions.join(" OR ") + " LIMIT 1";
    return query(sql, params);
}

module.exports = {
    findByEmail, findById, findWithComprador, findWithMembresiaStatus,
    updateEstatus, updatePassword, deleteById, findAllUsers, findPendingUsers,
    findUserNamesByIds, updatePuedeAdquirir,
    beginTransaction, commit, rollback, queryRaw, searchBuyer
};
