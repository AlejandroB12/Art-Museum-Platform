const { prisma } = require('../models');

async function findByEmail(email) {
    const user = await prisma.usuario.findUnique({ where: { Email: email } });
    return user ? [user] : [];
}

async function findById(id) {
    const user = await prisma.usuario.findUnique({ where: { id_usuario: Number(id) } });
    return user ? [user] : [];
}

async function findWithComprador(id) {
    const user = await prisma.usuario.findUnique({
        where: { id_usuario: Number(id) },
        include: { Comprador: true }
    });
    if (!user) return [];
    return [{
        ...user,
        PuedeAdquirir: user.Comprador?.PuedeAdquirir,
        Cedula: user.Comprador?.Cedula,
        Telefono: user.Comprador?.Telefono,
        CodigoVerificacion: user.Comprador?.CodigoVerificacion,
        id_parroquia: user.Comprador?.id_parroquia,
        Calle: user.Comprador?.Calle
    }];
}

async function findWithMembresiaStatus(id) {
    const result = await prisma.$queryRawUnsafe(`
        SELECT u.Rol, c.PuedeAdquirir,
               CASE WHEN EXISTS (
                   SELECT 1 FROM Membresia m
                   WHERE m.id_usuario = u.id_usuario
                   AND NOW() <= DATE_ADD(m.FechaPago, INTERVAL (m.MontoPagado / 10 * 30) DAY)
               ) THEN 1 ELSE 0 END AS MembresiaActiva
        FROM Usuario u
        LEFT JOIN Comprador c ON u.id_usuario = c.id_usuario
        WHERE u.id_usuario = ?
    `, [Number(id)]);
    return result;
}

async function updateEstatus(id, estatus) {
    await prisma.usuario.update({
        where: { id_usuario: Number(id) },
        data: { Estatus: estatus }
    });
}

async function updatePassword(id, password) {
    await prisma.usuario.update({
        where: { id_usuario: Number(id) },
        data: { Contraseña: password }
    });
}

async function deleteById(id) {
    await prisma.usuario.delete({ where: { id_usuario: Number(id) } });
}

async function findAllUsers() {
    const result = await prisma.$queryRawUnsafe(`
        SELECT u.id_usuario, u.Email, u.Rol, u.Estatus,
               c.PuedeAdquirir,
               CASE WHEN EXISTS (
                   SELECT 1 FROM Membresia m
                   WHERE m.id_usuario = u.id_usuario
                   AND NOW() <= DATE_ADD(m.FechaPago, INTERVAL (m.MontoPagado / 10 * 30) DAY)
               ) THEN 1 ELSE 0 END AS MembresiaActiva
        FROM Usuario u
        LEFT JOIN Comprador c ON u.id_usuario = c.id_usuario
    `);
    return result;
}

async function findPendingUsers() {
    const users = await prisma.usuario.findMany({
        where: { Estatus: 0, Rol: { not: 'administrador' } },
        include: { Comprador: { select: { CodigoVerificacion: true } } }
    });
    return users.map(u => ({
        id_usuario: u.id_usuario,
        Email: u.Email,
        Rol: u.Rol,
        Estatus: u.Estatus,
        CodigoVerificacion: u.Comprador?.CodigoVerificacion
    }));
}

async function findUserNamesByIds(ids) {
    const users = await prisma.usuario.findMany({
        where: { id_usuario: { in: ids.map(Number) } },
        select: { id_usuario: true, Nombre: true, Apellido: true }
    });
    return users;
}

async function updatePuedeAdquirir(id, value) {
    await prisma.comprador.update({
        where: { id_usuario: Number(id) },
        data: { PuedeAdquirir: value === 1 }
    });
}

async function searchBuyer(email, cedula) {
    const where = {};
    if (email) where.Email = email;
    const user = await prisma.usuario.findFirst({
        where,
        include: { Comprador: { select: { Cedula: true } } }
    });
    if (!user) return [];
    if (cedula && user.Comprador?.Cedula !== cedula) return [];
    return [{
        id_usuario: user.id_usuario,
        Email: user.Email,
        Nombre: user.Nombre,
        Apellido: user.Apellido,
        Cedula: user.Comprador?.Cedula
    }];
}

async function beginTransaction() {
    await prisma.$transaction(async (tx) => {
        return tx;
    });
}

async function commit() {}

async function rollback() {}

async function queryRaw(sql, params = []) {
    return prisma.$executeRawUnsafe(sql, ...params);
}

module.exports = {
    findByEmail, findById, findWithComprador, findWithMembresiaStatus,
    updateEstatus, updatePassword, deleteById, findAllUsers, findPendingUsers,
    findUserNamesByIds, updatePuedeAdquirir, beginTransaction, commit, rollback,
    queryRaw, searchBuyer
};
