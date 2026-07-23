const userRepo = require('../repositories/user_repository');
const membershipRepo = require('../repositories/membership_repository');
const auditRepo = require('../repositories/audit_repository');
const emailUtils = require('../../../../shared/utils/email');
const { query } = require('../config/database');

async function registerAdmin(data) {
    const { correo, password, nombre, apellido } = data;
    const client = await userRepo.beginTransaction();
    try {
        const result = await query(
            "INSERT INTO usuario (email, password, nombre, apellido, activo, rol) VALUES ($1, $2, $3, $4, true, 'administrador') RETURNING id_usuario",
            [correo, password, nombre, apellido]
        );
        const newId = result[0].id_usuario;
        await query("INSERT INTO admin (id_usuario) VALUES ($1)", [newId]);
        await userRepo.commit(client);
        return { success: true };
    } catch (err) {
        await userRepo.rollback(client).catch(() => {});
        throw err;
    }
}

async function listUsers(page = 1, limit = 10) {
    return userRepo.findAllUsers(page, limit);
}

async function listPendingUsers(page = 1, limit = 10) {
    return userRepo.findPendingUsers(page, limit);
}

async function approveUser(id, req) {
    const results = await query(
        "SELECT u.email, u.nombre, u.apellido, c.codigo_verificacion FROM usuario u LEFT JOIN comprador c ON u.id_usuario = c.id_usuario WHERE u.id_usuario = $1",
        [id]
    );
    if (results.length === 0) throw new Error("Usuario no encontrado");

    const usuario = results[0];
    await userRepo.updateActivo(id, true);

    const codigo = usuario.codigo_verificacion || 'N/A';
    emailUtils.sendMail(emailUtils.createApprovalEmail(usuario, codigo)).catch(err => {
        console.error("Error al enviar correo de aprobación:", err);
    });

    const idAdmin = req.session?.id_usuario || 0;
    await auditRepo.registrarEvento(parseInt(id), 'APROBACION_USUARIO',
        `Usuario ${usuario.nombre} ${usuario.apellido} ha sido aceptado por el administrador (ID: ${idAdmin}) a las ${new Date().toLocaleTimeString()}`,
        req
    ).catch(e => console.error('Error Cassandra aprobacion:', e.message));
}

async function toggleUserStatus(id, estatus) {
    const result = await userRepo.updateActivo(id, estatus);
    if (result.rowCount === 0) throw new Error("Usuario no encontrado");
}

async function deleteUserReservations(id) {
    await query("DELETE FROM reserva WHERE id_usuario = $1", [id]);
}

async function deleteUserMemberships(id) {
    await query("DELETE FROM membresia WHERE id_usuario = $1", [id]);
}

async function deleteComprador(id) {
    await query("DELETE FROM comprador WHERE id_usuario = $1", [id]);
}

async function deleteUser(id) {
    await userRepo.deleteById(id);
}

async function searchBuyer(email, cedula) {
    return userRepo.searchBuyer(email, cedula);
}

async function listPaymentRequests(page = 1, limit = 10) {
    return membershipRepo.findPendingPayments(page, limit);
}

async function approvePayment(id_solicitud, id_usuario) {
    const result = await membershipRepo.findMaxExpiry(id_usuario);
    const vencimientoActual = result[0]?.vencimiento_actual;
    const ahora = new Date();
    const inicioEfectivo = vencimientoActual && new Date(vencimientoActual) > ahora ? vencimientoActual : ahora;

    const client = await userRepo.beginTransaction();
    try {
        await membershipRepo.approvePayment(id_solicitud);
        await membershipRepo.insert(id_usuario, inicioEfectivo);
        await userRepo.commit(client);
    } catch (err) {
        await userRepo.rollback(client).catch(() => {});
        throw err;
    }
}

async function registerNewPayment(id_usuario, req) {
    const result = await membershipRepo.findMaxExpiry(id_usuario);
    const vencimientoActual = result[0]?.vencimiento_actual;
    const ahora = new Date();
    const inicioEfectivo = vencimientoActual && new Date(vencimientoActual) > ahora ? vencimientoActual : ahora;
    await membershipRepo.insert(id_usuario, inicioEfectivo);
}

module.exports = {
    registerAdmin, listUsers, listPendingUsers, approveUser,
    toggleUserStatus,
    deleteUserReservations, deleteUserMemberships, deleteComprador, deleteUser,
    searchBuyer, listPaymentRequests, approvePayment, registerNewPayment
};
