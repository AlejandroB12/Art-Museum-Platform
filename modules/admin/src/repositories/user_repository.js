const { query, queryRaw, beginTransaction, commit, rollback } = require('../config/database');

async function findByEmail(email) {
    return query("SELECT * FROM usuario WHERE email = $1", [email]);
}

async function findById(id) {
    return query("SELECT * FROM usuario WHERE id_usuario = $1", [id]);
}

async function findWithComprador(id) {
    return query(
        `SELECT u.id_usuario, u.email, u.rol, u.activo, u.nombre, u.apellido,
                c.cedula, c.telefono, c.codigo_verificacion,
                c.id_parroquia, c.calle
         FROM usuario u
         LEFT JOIN comprador c ON u.id_usuario = c.id_usuario
         WHERE u.id_usuario = $1`, [id]
    );
}

async function findWithMembresiaStatus(id) {
    return query(`
        SELECT u.rol,
               CASE WHEN EXISTS (
                   SELECT 1 FROM membresia m
                   WHERE m.id_usuario = u.id_usuario
                   AND NOW() <= m.fecha_expiracion
               ) THEN true ELSE false END AS membresia_activa
        FROM usuario u
        WHERE u.id_usuario = $1
    `, [id]);
}

async function updateActivo(id, activo) {
    return query("UPDATE usuario SET activo = $1::boolean WHERE id_usuario = $2", [activo, id]);
}

async function updatePassword(id, password) {
    return query("UPDATE usuario SET password = $1 WHERE id_usuario = $2", [password, id]);
}

async function deleteById(id) {
    return query("DELETE FROM usuario WHERE id_usuario = $1", [id]);
}

async function findAllUsers(page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    const [rows, countResult] = await Promise.all([
        query(`
            SELECT u.id_usuario, u.email AS "Email", u.rol AS "Rol",
                   CASE WHEN u.activo THEN 1 ELSE 0 END AS "Estatus",
                   CASE WHEN EXISTS (
                       SELECT 1 FROM membresia m
                       WHERE m.id_usuario = u.id_usuario
                       AND NOW() <= m.fecha_expiracion
                   ) THEN 1 ELSE 0 END AS "MembresiaActiva"
            FROM usuario u
            LEFT JOIN comprador c ON u.id_usuario = c.id_usuario
            ORDER BY u.id_usuario
            LIMIT $1 OFFSET $2
        `, [limit, offset]),
        query("SELECT COUNT(*) FROM usuario", [])
    ]);
    const total = parseInt(countResult[0]?.count || 0);
    return { data: rows, total, page, limit, totalPages: Math.ceil(total / limit) || 1 };
}

async function findPendingUsers(page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    const [rows, countResult] = await Promise.all([
        query(`
            SELECT u.id_usuario, u.email AS "Email", u.rol AS "Rol",
                   CASE WHEN u.activo THEN 1 ELSE 0 END AS "Estatus",
                   c.codigo_verificacion AS "CodigoVerificacion"
            FROM usuario u
            LEFT JOIN comprador c ON u.id_usuario = c.id_usuario
            WHERE u.activo = false AND u.rol != 'administrador'
            ORDER BY u.id_usuario
            LIMIT $1 OFFSET $2
        `, [limit, offset]),
        query("SELECT COUNT(*) FROM usuario WHERE activo = false AND rol != 'administrador'", [])
    ]);
    const total = parseInt(countResult[0]?.count || 0);
    return { data: rows, total, page, limit, totalPages: Math.ceil(total / limit) || 1 };
}

async function findUserNamesByIds(ids) {
    if (ids.length === 0) return [];
    const placeholders = ids.map((_, i) => '$' + (i + 1)).join(',');
    return query(
        `SELECT id_usuario, nombre, apellido FROM usuario WHERE id_usuario IN (${placeholders})`, ids
    );
}

async function searchBuyer(email, cedula) {
    let sql = "SELECT u.id_usuario, u.email, u.nombre, u.apellido, c.cedula FROM usuario u LEFT JOIN comprador c ON u.id_usuario = c.id_usuario WHERE";
    const params = [];
    const conditions = [];
    let idx = 1;
    if (email) { conditions.push("u.email = $" + idx++); params.push(email); }
    if (cedula) { conditions.push("c.cedula = $" + idx++); params.push(cedula); }
    sql += " " + conditions.join(" OR ") + " LIMIT 1";
    return query(sql, params);
}

module.exports = {
    findByEmail, findById, findWithComprador, findWithMembresiaStatus,
    updateActivo, updatePassword, deleteById, findAllUsers, findPendingUsers,
    findUserNamesByIds,
    beginTransaction, commit, rollback, queryRaw, searchBuyer
};
