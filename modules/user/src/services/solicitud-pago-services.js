const membershipRepo = require('../repositories/membership_repository');
const auditRepo = require('../repositories/audit_repository');

async function solicitarPago(idUsuario, req) {
  await membershipRepo.insertPaymentRequest(idUsuario);
  await auditRepo.registrarEvento(idUsuario, 'SOLICITUD_PAGO', 'Solicitud de pago de membresía enviada', req);
}

module.exports = { solicitarPago };
