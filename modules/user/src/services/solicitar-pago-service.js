const membershipRepo = require('../repositories/membership_repository');
const auditRepo = require('../repositories/audit_repository');

async function solicitarPago(userId, monto, req) {
    await membershipRepo.insertPaymentRequest(userId, monto);
    await auditRepo.registrarEvento(userId, 'SOLICITUD_PAGO', 'Solicitud de pago de membresía enviada', req);
}

module.exports = { solicitarPago };
