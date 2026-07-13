const { query, queryRaw } = require('../config/database');

async function findWithMembresiaStatus(id) {
    const rows = await query(`
        SELECT u.rol,
               EXISTS (
                   SELECT 1 FROM membresia m
                   WHERE m.id_usuario = u.id_usuario
                   AND CURRENT_DATE BETWEEN m.fecha_inicio AND m.fecha_expiracion
               ) AS membresia_activa,
               TRUE AS puede_adquirir
        FROM usuario u
        WHERE u.id_usuario = $1
    `, [id]);
    return rows;
}

async function updatePuedeAdquirir(id, value) {
    // No-op en PostgreSQL: no existe columna PuedeAdquirir
}

module.exports = { findWithMembresiaStatus, updatePuedeAdquirir, queryRaw };
