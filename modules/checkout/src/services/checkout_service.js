const obraRepo = require('../repositories/obra_repository');
const userRepo = require('../repositories/user_repository');
const invoiceRepo = require('../repositories/invoice_repository');
const auditRepo = require('../repositories/audit_repository');
const recommendationRepo = require('../repositories/recommendation_repository');

const generoMap = { 'Pintura': 1, 'Escultura': 2, 'Fotografía': 3, 'Orfebreria': 4, 'Ceramica': 5 };

async function confirmarReserva(id_obra, id_usuario, req) {
    if (!Number.isInteger(id_obra) || id_obra <= 0) {
        throw Object.assign(new Error("ID de obra inválido"), { statusCode: 400 });
    }

    const puedeAdquirir = await checkMembresia(id_usuario);
    if (!puedeAdquirir) {
        throw Object.assign(new Error("No tienes permiso para adquirir obras. Contacta al administrador."), { statusCode: 403 });
    }

    const obraMongo = await obraRepo.findById(id_obra);
    if (!obraMongo) throw Object.assign(new Error("La obra no existe"), { statusCode: 404 });
    if (obraMongo.estado_obra !== 'Disponible') {
        throw Object.assign(new Error(`La obra no está disponible (estado: ${obraMongo.estado_obra})`), { statusCode: 400 });
    }

    const fecha = new Date();
    const generoNombre = obraMongo.genero?.nombre || 'Pintura';
    const idGenero = generoMap[generoNombre] || 1;

    await userRepo.queryRaw("SET FOREIGN_KEY_CHECKS = 0");
    await invoiceRepo.upsertObra(id_obra, obraMongo.nombre, obraMongo.fecha_creacion || fecha, obraMongo.precio, idGenero, obraMongo.fotografia || '');
    await userRepo.queryRaw("SET FOREIGN_KEY_CHECKS = 1");

    await userRepo.queryRaw("INSERT INTO Reserva (id_Obra, id_Usuario, Fecha_Reserva) VALUES (?, ?, ?)", [id_obra, id_usuario, fecha]);
    await obraRepo.findByIdAndUpdate(id_obra, { estado_obra: 'Reservado' });

    auditRepo.registrarEvento(id_usuario, 'CONFIRMAR_RESERVA', `Obra ${id_obra} reservada`, req).catch(() => {});
    auditRepo.registrarCambioEstatus(id_obra, 'Disponible', 'Reservado', id_usuario, 'Comprador inició proceso de compra').catch(() => {});

    recommendationRepo.createCompraRelation(id_usuario, id_obra).catch(() => {});

    return { success: true, message: "Reserva confirmada y obra actualizada" };
}

async function checkMembresia(id_usuario) {
    const results = await userRepo.findWithMembresiaStatus(id_usuario);
    if (results.length === 0) return true;
    const r = results[0];
    const membresiaActiva = r.MembresiaActiva == 1;
    if (!membresiaActiva) {
        userRepo.updatePuedeAdquirir(id_usuario, 0).catch(() => {});
        return false;
    }
    return r.PuedeAdquirir == 1;
}

module.exports = { confirmarReserva };
