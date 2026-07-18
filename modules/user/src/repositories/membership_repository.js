const { query, queryRaw } = require('../config/database');

async function findLastPayment(userId) {
    return query(
        "SELECT fecha_inicio AS \"FechaPago\", monto_pagado AS \"MontoPagado\" FROM membresia WHERE id_usuario = $1 ORDER BY fecha_inicio DESC LIMIT 1",
        [userId]
    );
}

async function findMaxExpiry(userId) {
    return query(
        `SELECT GREATEST(MAX(fecha_expiracion), CURRENT_DATE) AS vencimiento_actual
         FROM membresia WHERE id_usuario = $1`,
        [userId]
    );
}

async function insert(userId, fecha, monto = 10.00) {
    return queryRaw(
        "INSERT INTO membresia (id_usuario, fecha_inicio, fecha_expiracion, monto_pagado) VALUES ($1, $2::date, $2::date + ($3 / 10.0 * 30) * INTERVAL '1 day', $3)",
        [userId, fecha, monto]
    );
}

async function findMembershipDetails(userId) {
    return query(`
        SELECT * FROM (
            SELECT CONCAT('Pago $', monto_pagado) AS "Concepto",
                   fecha_inicio AS "FechaInicio", monto_pagado AS "TotalPagado",
                   fecha_expiracion AS "FechaVencimiento",
                   'Aprobado' AS "EstadoPago",
                   FLOOR(monto_pagado / 10.0 * 30)::INTEGER AS "DiasRestantes",
                   'detalle' AS "Tipo"
            FROM membresia WHERE id_usuario = $1
            UNION ALL
            SELECT 'Total Acumulado' AS "Concepto",
                   MIN(fecha_inicio) AS "FechaInicio", SUM(monto_pagado) AS "TotalPagado",
                   MAX(fecha_expiracion) AS "FechaVencimiento",
                   CASE WHEN CURRENT_DATE <= MAX(fecha_expiracion) THEN 'Activa' ELSE 'Vencida' END AS "EstadoPago",
                   GREATEST(0, (MAX(fecha_expiracion) - CURRENT_DATE))::INTEGER AS "DiasRestantes",
                   'total' AS "Tipo"
            FROM membresia WHERE id_usuario = $2
        ) sub
        ORDER BY CASE "Tipo" WHEN 'total' THEN 2 WHEN 'detalle' THEN 1 ELSE 0 END, "FechaInicio" ASC
    `, [userId, userId]);
}

async function findPendingPayments() {
    return query(`
        SELECT s.*, u.email
        FROM solicitud_pago s
        JOIN usuario u ON s.id_usuario = u.id_usuario
        WHERE s.estatus = 'Pendiente'
    `);
}

async function findPendingRequests(userId) {
    return query(`
        SELECT 'Solicitud de Pago' AS "Concepto", fecha_solicitud AS "FechaInicio",
               monto AS "TotalPagado", NULL::date AS "FechaVencimiento", estatus AS "EstadoPago",
               NULL::integer AS "DiasRestantes", 'solicitud' AS "Tipo"
        FROM solicitud_pago WHERE id_usuario = $1 AND estatus = 'Pendiente'
        ORDER BY fecha_solicitud DESC
    `, [userId]);
}

async function approvePayment(idSolicitud) {
    return query("UPDATE solicitud_pago SET estatus = 'Aprobado' WHERE id_solicitud = $1", [idSolicitud]);
}

async function insertPaymentRequest(userId, monto = 10.00) {
    return queryRaw("INSERT INTO solicitud_pago (id_usuario, fecha_solicitud, monto, estatus) VALUES ($1, NOW(), $2, 'Pendiente')",
        [userId, monto]);
}

module.exports = {
    findLastPayment, findMaxExpiry, insert, findMembershipDetails,
    findPendingPayments, findPendingRequests, approvePayment, insertPaymentRequest
};
