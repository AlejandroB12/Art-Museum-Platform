const userRepo = require('../repositories/user_repository');
const membershipRepo = require('../repositories/membership_repository');
const auditRepo = require('../repositories/audit_repository');
const emailUtils = require('../../../../shared/utils/email');

async function registerAdmin(data) {
    const { correo, password, nombre, apellido } = data;
    await userRepo.beginTransaction();
    try {
        const result = await userRepo.queryRaw(
            "INSERT INTO Usuario (Email, Contraseña, Nombre, Apellido, Estatus, Rol) VALUES (?, ?, ?, ?, 1, 'administrador')",
            [correo, password, nombre, apellido]
        );
        await userRepo.queryRaw("INSERT INTO Administrador (id_usuario) VALUES (?)", [result.insertId]);
        await userRepo.commit();
        return { success: true };
    } catch (err) {
        await userRepo.rollback().catch(() => {});
        throw err;
    }
}

async function listUsers() {
    const users = await userRepo.findAllUsers();
    for (const u of users) {
        if (u.Rol !== 'comprador') continue;
        if (u.MembresiaActiva == 0 && u.PuedeAdquirir == 1) {
            await userRepo.updatePuedeAdquirir(u.id_usuario, 0);
            u.PuedeAdquirir = 0;
        }
    }
    return users;
}

async function listPendingUsers() {
    return userRepo.findPendingUsers();
}

async function approveUser(id, req) {
    const sqlDatos = `
        SELECT u.Email, u.Nombre, u.Apellido, c.CodigoVerificacion
        FROM Usuario u LEFT JOIN Comprador c ON u.id_usuario = c.id_usuario WHERE u.id_usuario = ?
    `;
    const results = await userRepo.queryRaw(sqlDatos, [id]);
    if (results.length === 0) throw new Error("Usuario no encontrado");

    const usuario = results[0];
    await userRepo.updateEstatus(id, 1);

    const codigo = usuario.CodigoVerificacion || 'N/A';
    emailUtils.sendMail(emailUtils.createApprovalEmail(usuario, codigo)).catch(err => {
        console.error("Error al enviar correo de aprobación:", err);
    });

    const idAdmin = req.session?.id_usuario || 0;
    await auditRepo.registrarEvento(parseInt(id), 'APROBACION_USUARIO',
        `Usuario ${usuario.Nombre} ${usuario.Apellido} ha sido aceptado por el administrador (ID: ${idAdmin}) a las ${new Date().toLocaleTimeString()}`,
        req
    ).catch(e => console.error('Error Cassandra aprobacion:', e.message));
}

async function toggleUserStatus(id, estatus) {
    const result = await userRepo.updateEstatus(id, estatus);
    if (result.affectedRows === 0) throw new Error("Usuario no encontrado");
}

async function togglePuedeAdquirir(id, value) {
    const result = await userRepo.updatePuedeAdquirir(id, value);
    if (result.affectedRows === 0) throw new Error("Comprador no encontrado");
}

async function deleteUserReservations(id) {
    await userRepo.queryRaw("DELETE FROM Reserva WHERE id_usuario = ?", [id]);
}

async function deleteUserMemberships(id) {
    await userRepo.queryRaw("DELETE FROM Membresia WHERE id_usuario = ?", [id]);
}

async function deleteComprador(id) {
    await userRepo.queryRaw("DELETE FROM Comprador WHERE id_usuario = ?", [id]);
}

async function deleteUser(id) {
    await userRepo.deleteById(id);
}

async function searchBuyer(email, cedula) {
    return userRepo.searchBuyer(email, cedula);
}

async function listPaymentRequests() {
    return membershipRepo.findPendingPayments();
}

async function approvePayment(id_solicitud, id_usuario) {
    const result = await membershipRepo.findMaxExpiry(id_usuario);
    const vencimientoActual = result[0]?.vencimiento_actual;
    const ahora = new Date();
    const inicioEfectivo = vencimientoActual && new Date(vencimientoActual) > ahora ? vencimientoActual : ahora;

    await userRepo.beginTransaction();
    try {
        await membershipRepo.approvePayment(id_solicitud);
        await membershipRepo.insert(id_usuario, inicioEfectivo);
        await userRepo.updatePuedeAdquirir(id_usuario, 1);
        await userRepo.commit();
    } catch (err) {
        await userRepo.rollback().catch(() => {});
        throw err;
    }
}

async function registerNewPayment(id_usuario, req) {
    const result = await membershipRepo.findMaxExpiry(id_usuario);
    const vencimientoActual = result[0]?.vencimiento_actual;
    const ahora = new Date();
    const inicioEfectivo = vencimientoActual && new Date(vencimientoActual) > ahora ? vencimientoActual : ahora;
    await membershipRepo.insert(id_usuario, inicioEfectivo);
    await userRepo.updatePuedeAdquirir(id_usuario, 1);
}

module.exports = {
    registerAdmin, listUsers, listPendingUsers, approveUser,
    toggleUserStatus, togglePuedeAdquirir,
    deleteUserReservations, deleteUserMemberships, deleteComprador, deleteUser,
    searchBuyer, listPaymentRequests, approvePayment, registerNewPayment
};
