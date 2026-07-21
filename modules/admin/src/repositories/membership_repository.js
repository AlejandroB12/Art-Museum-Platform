const { query } = require('../config/database');

async function findLastPayment(userId) {
    return query(
        "SELECT fecha_inicio, monto_pagado FROM membresia WHERE id_usuario = $1 ORDER BY fecha_inicio DESC LIMIT 1",
        [userId]
    );
}

async function findMaxExpiry(userId) {
    return query(
        `SELECT MAX(fecha_expiracion) AS vencimiento_actual
         FROM membresia WHERE id_usuario = $1`,
        [userId]
    );
}

async function insert(userId, fecha, monto = 10.00) {
    return query(
        "INSERT INTO membresia (fecha_inicio, fecha_expiracion, monto_pagado, id_usuario) VALUES ($1, $1 + ($2 / 10 * 30) * INTERVAL '1 day', $2, $3)",
        [fecha, monto, userId]
    );
}

async function findMembershipDetails(userId) {
    return query(`
        SELECT CONCAT('Pago $', monto_pagado) AS concepto,
               fecha_inicio, monto_pagado AS total_pagado,
               fecha_expiracion AS fecha_vencimiento,
               'Aprobado' AS estado_pago,
               GREATEST(0, EXTRACT(DAY FROM (fecha_expiracion - NOW()))::INTEGER) AS dias_restantes,
               'detalle' AS tipo
        FROM membresia WHERE id_usuario = $1
        UNION ALL
        SELECT 'Total Acumulado' AS concepto,
               MIN(fecha_inicio) AS fecha_inicio, SUM(monto_pagado) AS total_pagado,
               MAX(fecha_expiracion) AS fecha_vencimiento,
               CASE WHEN NOW() <= MAX(fecha_expiracion) THEN 'Activa' ELSE 'Vencida' END AS estado_pago,
               GREATEST(0, EXTRACT(DAY FROM (MAX(fecha_expiracion) - NOW()))::INTEGER) AS dias_restantes,
               'total' AS tipo
        FROM membresia WHERE id_usuario = $2
        ORDER BY CASE tipo WHEN 'total' THEN 2 WHEN 'detalle' THEN 1 ELSE 0 END, fecha_inicio ASC
    `, [userId, userId]);
}

async function findPendingPayments(page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    const [rows, countResult] = await Promise.all([
        query(`
            SELECT s.*, u.email
            FROM solicitud_pago s
            JOIN usuario u ON s.id_usuario = u.id_usuario
            WHERE s.estatus = 'Pendiente'
            ORDER BY s.fecha_solicitud DESC
            LIMIT $1 OFFSET $2
        `, [limit, offset]),
        query("SELECT COUNT(*) FROM solicitud_pago WHERE estatus = 'Pendiente'", [])
    ]);
    const total = parseInt(countResult[0]?.count || 0);
    return { data: rows, total, page, limit, totalPages: Math.ceil(total / limit) || 1 };
}

async function findPendingRequests(userId) {
    return query(`
        SELECT 'Solicitud de Pago' AS concepto, fecha_solicitud AS fecha_inicio,
               monto AS total_pagado, NULL AS fecha_vencimiento, estatus AS estado_pago,
               NULL AS dias_restantes, 'solicitud' AS tipo
        FROM solicitud_pago WHERE id_usuario = $1 AND estatus = 'Pendiente'
        ORDER BY fecha_solicitud DESC
    `, [userId]);
}

async function approvePayment(idSolicitud) {
    return query("UPDATE solicitud_pago SET estatus = 'Aprobado' WHERE id_solicitud = $1", [idSolicitud]);
}

async function insertPaymentRequest(userId, monto = 10.00) {
    return query("INSERT INTO solicitud_pago (id_usuario, fecha_solicitud, monto, estatus) VALUES ($1, NOW(), $2, 'Pendiente')",
        [userId, monto]);
}

module.exports = {
    findLastPayment, findMaxExpiry, insert, findMembershipDetails,
    findPendingPayments, findPendingRequests, approvePayment, insertPaymentRequest
};
