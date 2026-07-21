const { query } = require('../config/database');

async function findById(idFactura) {
    return query(`
        SELECT f.*, u.nombre, u.apellido, u.email,
               c.cedula,
               COALESCE(NULLIF(f.nombre_comprador,''), CONCAT(u.nombre,' ',u.apellido)) as comprador_nombre,
               COALESCE(NULLIF(f.email_comprador,''), u.email) as comprador_email,
               COALESCE(NULLIF(f.cedula_comprador,''), c.cedula::TEXT) as comprador_cedula,
               o.nombre as nombre_obra, o.precio
        FROM factura f
        INNER JOIN usuario u ON f.id_comprador = u.id_usuario
        LEFT JOIN comprador c ON u.id_usuario = c.id_usuario
        INNER JOIN obra o ON o.id_obra::TEXT = f.id_obra
        WHERE f.id_factura = $1
    `, [idFactura]);
}

async function create(data) {
    return query(
        `INSERT INTO factura (monto_neto, iva, total_pagado, ganancia_usd, porcentaje_comision,
         id_obra, id_comprador, id_admin, nombre_comprador, email_comprador, cedula_comprador, fecha_venta)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         RETURNING id_factura`,
        [data.monto_neto, data.iva, data.total_pagado, data.ganancia_usd,
         data.porcentaje_comision, data.id_obra, data.id_comprador, data.id_admin,
         data.nombre_comprador, data.email_comprador, data.cedula_comprador, data.fecha_venta]
    );
}

async function updateObraStatus(idObra, estado) {
    return query("UPDATE obra SET estado_obra = $1 WHERE id_obra = $2", [estado, idObra]);
}

async function deleteReserva(idObra) {
    return query("DELETE FROM reserva WHERE id_obra = $1", [idObra]);
}

async function findObraById(idObra) {
    return query("SELECT * FROM obra WHERE id_obra = $1", [idObra]);
}

async function upsertObra(idObra, nombre, fecha, precio, idGenero, fotografia) {
    return query(
        "INSERT INTO obra (id_obra, nombre, fecha_creacion, precio, estado_obra, id_genero, fotografia) VALUES ($1, $2, $3, $4, 'Reservado', $5, $6) ON CONFLICT (id_obra) DO UPDATE SET nombre = EXCLUDED.nombre, precio = EXCLUDED.precio, estado_obra = EXCLUDED.estado_obra",
        [idObra, nombre, fecha, precio, idGenero, fotografia]
    );
}

async function obrasVendidasReport(fechaInicio, fechaFin) {
    return query(
        `SELECT f.id_factura, f.id_obra, o.nombre AS obra, f.total_pagado,
                COALESCE(TO_CHAR(f.fecha_venta, 'YYYY-MM-DD'), '—') AS fecha
         FROM factura f
         JOIN obra o ON o.id_obra::TEXT = f.id_obra
         WHERE COALESCE(f.fecha_venta::DATE, CURRENT_DATE) BETWEEN $1 AND $2
         ORDER BY f.fecha_venta DESC`,
        [fechaInicio, fechaFin]
    );
}

async function facturacionResumen(fechaInicio, fechaFin) {
    return query(
        `SELECT f.id_factura, COALESCE(TO_CHAR(f.fecha_venta, 'YYYY-MM-DD'), '—') AS fecha,
                o.nombre AS obra, f.monto_neto AS precio_obra,
                f.porcentaje_comision AS porcentaje_museo,
                f.ganancia_usd AS ganancia_museo,
                f.total_pagado AS total_recaudado
         FROM factura f
         JOIN obra o ON o.id_obra::TEXT = f.id_obra
         WHERE COALESCE(f.fecha_venta::DATE, CURRENT_DATE) BETWEEN $1 AND $2
         ORDER BY f.fecha_venta DESC`,
        [fechaInicio, fechaFin]
    );
}

async function membresiasResumen(fechaInicio, fechaFin) {
    return query(
        `SELECT m.id_membresia, u.email, TO_CHAR(m.fecha_inicio, 'YYYY-MM-DD') AS fecha_pago, m.monto_pagado
         FROM membresia m
         JOIN usuario u ON m.id_usuario = u.id_usuario
         WHERE m.fecha_inicio::DATE BETWEEN $1 AND $2
         ORDER BY m.fecha_inicio DESC`,
        [fechaInicio, fechaFin]
    );
}

module.exports = {
    findById, create, updateObraStatus, deleteReserva, findObraById,
    upsertObra, obrasVendidasReport, facturacionResumen, membresiasResumen
};
