const { Membresia, SolicitudPago, Usuario } = require('../models');
const { sequelize } = require('../config/database');

async function findLastPayment(userId) {
    const membresia = await Membresia.findOne({
        where: { id_usuario: Number(userId) },
        order: [['fecha_expiracion', 'DESC']],
        attributes: ['fecha_inicio', 'fecha_expiracion', 'monto_pagado']
    });
    return membresia ? [membresia.toJSON()] : [];
}

async function findMaxExpiry(userId) {
    const [result] = await sequelize.query(`
        SELECT MAX(m.fecha_expiracion) AS vencimiento_actual
        FROM membresia m WHERE m.id_usuario = ?
    `, { bind: [Number(userId)], type: sequelize.QueryTypes.SELECT });
    return [result];
}

async function insert(userId, inicio, expiracion, monto = 10.00) {
    await Membresia.create({
        id_usuario: Number(userId),
        fecha_inicio: inicio,
        fecha_expiracion: expiracion,
        monto_pagado: monto
    });
}

async function findMembershipDetails(userId) {
    const [result] = await sequelize.query(`
        SELECT CONCAT('Pago $', m.monto_pagado) AS concepto,
               m.fecha_inicio, m.monto_pagado AS total_pagado,
               m.fecha_expiracion,
               'Aprobado' AS estado_pago,
               CAST(m.fecha_expiracion - CURRENT_DATE AS INTEGER) AS dias_restantes,
               'detalle' AS tipo
        FROM membresia m WHERE m.id_usuario = ?
        UNION ALL
        SELECT 'Total Acumulado' AS concepto,
               MIN(m.fecha_inicio), SUM(m.monto_pagado),
               MAX(m.fecha_expiracion),
               CASE WHEN CURRENT_DATE <= MAX(m.fecha_expiracion) THEN 'Activa' ELSE 'Vencida' END,
               GREATEST(0, CAST(MAX(m.fecha_expiracion) - CURRENT_DATE AS INTEGER)),
               'total' AS tipo
        FROM membresia m WHERE m.id_usuario = ?
        ORDER BY CASE tipo WHEN 'total' THEN 2 WHEN 'detalle' THEN 1 ELSE 0 END, fecha_inicio ASC
    `, { bind: [Number(userId), Number(userId)] });
    return result;
}

async function findPendingPayments() {
    const solicitudes = await SolicitudPago.findAll({
        where: { estatus: 'Pendiente' },
        include: [{ model: Usuario, attributes: ['email'] }]
    });
    return solicitudes.map(s => {
        const json = s.toJSON();
        return { ...json, email: json.Usuario?.email };
    });
}

async function findPendingRequests(userId) {
    const solicitudes = await SolicitudPago.findAll({
        where: { id_usuario: Number(userId), estatus: 'Pendiente' },
        order: [['fecha_solicitud', 'DESC']]
    });
    return solicitudes.map(s => ({
        concepto: 'Solicitud de Pago',
        fecha_inicio: s.fecha_solicitud,
        total_pagado: s.monto,
        fecha_expiracion: null,
        estado_pago: s.estatus,
        dias_restantes: null,
        tipo: 'solicitud'
    }));
}

async function approvePayment(idSolicitud) {
    await SolicitudPago.update(
        { estatus: 'Aprobado' },
        { where: { id_solicitud: Number(idSolicitud) } }
    );
}

async function insertPaymentRequest(userId, monto = 10.00) {
    await SolicitudPago.create({
        id_usuario: Number(userId),
        monto: monto,
        estatus: 'Pendiente'
    });
}

module.exports = {
    findLastPayment, findMaxExpiry, insert, findMembershipDetails,
    findPendingPayments, findPendingRequests, approvePayment, insertPaymentRequest
};
