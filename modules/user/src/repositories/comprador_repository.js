const { query } = require('../config/database');

async function findByUserId(idUsuario) {
    return query("SELECT * FROM comprador WHERE id_usuario = $1", [idUsuario]);
}

async function findShippingData(idUsuario) {
    return query(`
        SELECT u.nombre AS "Nombre", u.apellido AS "Apellido", c.calle AS "Calle",
               p.nombre AS "Parroquia", m.nombre AS "Municipio"
        FROM comprador c
        INNER JOIN usuario u ON c.id_usuario = u.id_usuario
        LEFT JOIN parroquia p ON c.id_parroquia = p.id_parroquia
        LEFT JOIN municipio m ON p.id_municipio = m.id_municipio
        WHERE c.id_usuario = $1
    `, [idUsuario]);
}

async function findPurchaseHistory(idUsuario) {
    return query(`
        SELECT o.nombre AS "Nombre", o.precio AS "Precio", f.fecha_venta AS "Fecha_emision",
               g.nombre AS "Genero", 'Pagado' AS "Estado"
        FROM factura f
        LEFT JOIN obra o ON f.id_obra = o.id_obra
        INNER JOIN comprador c ON f.id_comprador = c.id_usuario
        LEFT JOIN genero g ON o.id_genero = g.id_genero
        WHERE c.id_usuario = $1
        UNION
        SELECT o.nombre AS "Nombre", o.precio AS "Precio", r.fecha_reserva AS "Fecha_emision",
               g.nombre AS "Genero", 'Reservado' AS "Estado"
        FROM reserva r
        LEFT JOIN obra o ON r.id_obra = o.id_obra
        LEFT JOIN genero g ON o.id_genero = g.id_genero
        WHERE r.id_usuario = $2
        ORDER BY "Fecha_emision" DESC
    `, [idUsuario, idUsuario]);
}

async function create(data) {
    return query(
        "INSERT INTO comprador (id_usuario, cedula, telefono, codigo_verificacion, id_parroquia, calle) VALUES ($1, $2, $3, $4, $5, $6)",
        [data.id_usuario, data.Cedula, data.Telefono, data.CodigoVerificacion, data.id_parroquia, data.Calle]
    );
}

module.exports = { findByUserId, findShippingData, findPurchaseHistory, create };
