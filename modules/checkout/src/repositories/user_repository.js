const { query, queryRaw } = require('../config/database');

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

async function updatePuedeAdquirir(id, value) {
    return query("UPDATE Comprador SET PuedeAdquirir = ? WHERE id_usuario = ?", [value, id]);
}

module.exports = { findWithMembresiaStatus, updatePuedeAdquirir, queryRaw };
