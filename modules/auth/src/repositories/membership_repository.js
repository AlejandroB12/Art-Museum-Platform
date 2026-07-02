const { query, queryRaw } = require('../config/database');

async function findLastPayment(userId) {
    return query(
        "SELECT FechaPago, MontoPagado FROM Membresia WHERE id_usuario = ? ORDER BY FechaPago DESC LIMIT 1",
        [userId]
    );
}

async function findMaxExpiry(userId) {
    return query(
        `SELECT MAX(DATE_ADD(FechaPago, INTERVAL (MontoPagado / 10 * 30) DAY)) AS vencimiento_actual
         FROM Membresia WHERE id_usuario = ?`,
        [userId]
    );
}

async function insert(userId, fecha, monto = 10.00) {
    return queryRaw("INSERT INTO Membresia (FechaPago, MontoPagado, id_usuario) VALUES (?, ?, ?)",
        [fecha, monto, userId]);
}

async function findMembershipDetails(userId) {
    return query(`
        SELECT CONCAT('Pago $', MontoPagado) AS Concepto,
               FechaPago AS FechaInicio, MontoPagado AS TotalPagado,
               DATE_ADD(FechaPago, INTERVAL (MontoPagado / 10 * 30) DAY) AS FechaVencimiento,
               'Aprobado' AS EstadoPago,
               CAST(MontoPagado / 10 * 30 AS UNSIGNED) AS DiasRestantes,
               'detalle' AS Tipo
        FROM Membresia WHERE id_usuario = ?
        UNION ALL
        SELECT 'Total Acumulado' AS Concepto,
               MIN(FechaPago) AS FechaInicio, SUM(MontoPagado) AS TotalPagado,
               MAX(DATE_ADD(FechaPago, INTERVAL (MontoPagado / 10 * 30) DAY)) AS FechaVencimiento,
               CASE WHEN NOW() <= MAX(DATE_ADD(FechaPago, INTERVAL (MontoPagado / 10 * 30) DAY)) THEN 'Activa' ELSE 'Vencida' END AS EstadoPago,
               GREATEST(0, TIMESTAMPDIFF(DAY, NOW(), MAX(DATE_ADD(FechaPago, INTERVAL (MontoPagado / 10 * 30) DAY)))) AS DiasRestantes,
               'total' AS Tipo
        FROM Membresia WHERE id_usuario = ?
        ORDER BY CASE Tipo WHEN 'total' THEN 2 WHEN 'detalle' THEN 1 ELSE 0 END, FechaInicio ASC
    `, [userId, userId]);
}

async function findPendingPayments() {
    return query(`
        SELECT s.*, u.Email
        FROM SolicitudPago s
        JOIN Usuario u ON s.id_usuario = u.id_usuario
        WHERE s.Estatus = 'Pendiente'
    `);
}

async function findPendingRequests(userId) {
    return query(`
        SELECT 'Solicitud de Pago' AS Concepto, FechaSolicitud AS FechaInicio,
               Monto AS TotalPagado, NULL AS FechaVencimiento, Estatus AS EstadoPago,
               NULL AS DiasRestantes, 'solicitud' AS Tipo
        FROM SolicitudPago WHERE id_usuario = ? AND Estatus = 'Pendiente'
        ORDER BY FechaSolicitud DESC
    `, [userId]);
}

async function approvePayment(idSolicitud) {
    return query("UPDATE SolicitudPago SET Estatus = 'Aprobado' WHERE id_solicitud = ?", [idSolicitud]);
}

async function insertPaymentRequest(userId, monto = 10.00) {
    return queryRaw("INSERT INTO SolicitudPago (id_usuario, FechaSolicitud, Monto, Estatus) VALUES (?, NOW(), ?, 'Pendiente')",
        [userId, monto]);
}

module.exports = {
    findLastPayment, findMaxExpiry, insert, findMembershipDetails,
    findPendingPayments, findPendingRequests, approvePayment, insertPaymentRequest
};
