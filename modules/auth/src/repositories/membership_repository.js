const { prisma } = require('../models');

async function findLastPayment(userId) {
    const membresia = await prisma.membresia.findFirst({
        where: { id_usuario: Number(userId) },
        orderBy: { FechaPago: 'desc' },
        select: { FechaPago: true, MontoPagado: true }
    });
    return membresia ? [membresia] : [];
}

async function findMaxExpiry(userId) {
    const result = await prisma.$queryRawUnsafe(`
        SELECT MAX(DATE_ADD(FechaPago, INTERVAL (MontoPagado / 10 * 30) DAY)) AS vencimiento_actual
        FROM Membresia WHERE id_usuario = ?
    `, [Number(userId)]);
    return result;
}

async function insert(userId, fecha, monto = 10.00) {
    await prisma.membresia.create({
        data: {
            id_usuario: Number(userId),
            FechaPago: fecha === 'NOW()' ? new Date() : new Date(fecha),
            MontoPagado: monto
        }
    });
}

async function findMembershipDetails(userId) {
    const result = await prisma.$queryRawUnsafe(`
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
    `, [Number(userId), Number(userId)]);
    return result;
}

async function findPendingPayments() {
    const result = await prisma.$queryRawUnsafe(`
        SELECT s.*, u.Email
        FROM SolicitudPago s
        JOIN Usuario u ON s.id_usuario = u.id_usuario
        WHERE s.Estatus = 'Pendiente'
    `);
    return result;
}

async function findPendingRequests(userId) {
    const result = await prisma.$queryRawUnsafe(`
        SELECT 'Solicitud de Pago' AS Concepto, FechaSolicitud AS FechaInicio,
               Monto AS TotalPagado, NULL AS FechaVencimiento, Estatus AS EstadoPago,
               NULL AS DiasRestantes, 'solicitud' AS Tipo
        FROM SolicitudPago WHERE id_usuario = ? AND Estatus = 'Pendiente'
        ORDER BY FechaSolicitud DESC
    `, [Number(userId)]);
    return result;
}

async function approvePayment(idSolicitud) {
    await prisma.solicitudPago.update({
        where: { id_solicitud: Number(idSolicitud) },
        data: { Estatus: 'Aprobado' }
    });
}

async function insertPaymentRequest(userId, monto = 10.00) {
    await prisma.solicitudPago.create({
        data: {
            id_usuario: Number(userId),
            Monto: monto,
            Estatus: 'Pendiente'
        }
    });
}

module.exports = {
    findLastPayment, findMaxExpiry, insert, findMembershipDetails,
    findPendingPayments, findPendingRequests, approvePayment, insertPaymentRequest
};
