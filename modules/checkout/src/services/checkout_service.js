const artworkRepo = require('../repositories/artwork_repository');
const obraSyncRepo = require('../repositories/obra_sync_repository');
const userRepo = require('../repositories/user_repository');
const reservationRepo = require('../repositories/reservation_repository');
const auditRepo = require('../repositories/audit_repository');
const recommendationRepo = require('../repositories/recommendation_repository');

async function confirmarReserva(id_obra, id_usuario, req) {
    if (!Number.isInteger(id_obra) || id_obra <= 0) {
        throw Object.assign(new Error("ID de obra inválido"), { statusCode: 400 });
    }

    const puedeAdquirir = await checkMembresia(id_usuario);
    if (!puedeAdquirir) {
        throw Object.assign(new Error("No tienes permiso para adquirir obras. Contacta al administrador."), { statusCode: 403 });
    }

    const obraMongo = await artworkRepo.findById(id_obra);
    if (!obraMongo) throw Object.assign(new Error("La obra no existe"), { statusCode: 404 });
    if (obraMongo.estado_obra !== 'Disponible') {
        throw Object.assign(new Error(`La obra no está disponible (estado: ${obraMongo.estado_obra})`), { statusCode: 400 });
    }

    const fecha = new Date();
    const generoNombre = obraMongo.genero?.nombre || 'Pintura';

    await obraSyncRepo.upsertObra(id_obra, obraMongo.nombre, obraMongo.fecha_creacion || fecha, obraMongo.precio, generoNombre, obraMongo.fotografia || '');
    await reservationRepo.create(id_obra, id_usuario, fecha);
    await artworkRepo.findByIdAndUpdate(id_obra, { estado_obra: 'Reservado' });

    auditRepo.registrarEvento(id_usuario, 'CONFIRMAR_RESERVA', `Obra ${id_obra} reservada`, req).catch(() => {});
    auditRepo.registrarCambioEstatus(id_obra, 'Disponible', 'Reservado', id_usuario, 'Comprador inició proceso de compra').catch(() => {});

    recommendationRepo.createCompraRelation(id_usuario, id_obra).catch(() => {});

    return { success: true, message: "Reserva confirmada y obra actualizada" };
}

async function cancelarReserva(id_obra, id_usuario, req) {
    if (!Number.isInteger(id_obra) || id_obra <= 0) {
        throw Object.assign(new Error("ID de obra inválido"), { statusCode: 400 });
    }

    const reservas = await reservationRepo.findByObra(id_obra);
    if (reservas.length === 0) {
        throw Object.assign(new Error("No hay reserva para esta obra"), { statusCode: 404 });
    }

    if (reservas[0].id_usuario !== Number(id_usuario)) {
        throw Object.assign(new Error("No puedes cancelar una reserva que no te pertenece"), { statusCode: 403 });
    }

    await reservationRepo.deleteByObra(id_obra);
    await artworkRepo.findByIdAndUpdate(id_obra, { estado_obra: 'Disponible' });
    await obraSyncRepo.updateObraStatus(id_obra, 'Disponible');

    auditRepo.registrarEvento(id_usuario, 'CANCELAR_RESERVA', `Reserva de obra ${id_obra} cancelada`, req).catch(() => {});
    auditRepo.registrarCambioEstatus(id_obra, 'Reservado', 'Disponible', id_usuario, 'Comprador canceló la reserva').catch(() => {});

    return { success: true, message: "Reserva cancelada y obra disponible nuevamente" };
}

async function checkMembresia(id_usuario) {
    const results = await userRepo.findWithMembresiaStatus(id_usuario);
    if (results.length === 0) return true;
    return true;
}

module.exports = { confirmarReserva, cancelarReserva };
