const { Usuario, Comprador } = require('../models');
const { sequelize } = require('../config/database');

async function findByEmail(email) {
    const user = await Usuario.findOne({ where: { email } });
    return user ? [user.toJSON()] : [];
}

async function findById(id) {
    const user = await Usuario.findByPk(Number(id));
    return user ? [user.toJSON()] : [];
}

async function findWithComprador(id) {
    const user = await Usuario.findByPk(Number(id), {
        include: [{ model: Comprador }]
    });
    if (!user) return [];
    const u = user.toJSON();
    const c = u.Comprador;
    return [{
        ...u,
        cedula: c?.cedula,
        telefono: c?.telefono,
        codigo_verificacion: c?.codigo_verificacion,
        id_estado: c?.id_estado,
        id_municipio: c?.id_municipio,
        id_parroquia: c?.id_parroquia,
        calle: c?.calle
    }];
}

async function findWithMembresiaStatus(id) {
    const [result] = await sequelize.query(`
        SELECT u.rol,
               EXISTS (
                   SELECT 1 FROM membresia m
                   WHERE m.id_usuario = u.id_usuario
                   AND CURRENT_DATE BETWEEN m.fecha_inicio AND m.fecha_expiracion
               ) AS membresia_activa
        FROM usuario u
        WHERE u.id_usuario = $1
    `, { bind: [Number(id)], type: sequelize.QueryTypes.SELECT });
    return result ? [result] : [];
}

async function updateActivo(id, activo) {
    await Usuario.update({ activo }, { where: { id_usuario: Number(id) } });
}

async function updatePassword(id, password) {
    await Usuario.update({ password }, { where: { id_usuario: Number(id) } });
}

async function deleteById(id) {
    await Usuario.destroy({ where: { id_usuario: Number(id) } });
}

async function findAllUsers() {
    const [result] = await sequelize.query(`
        SELECT u.id_usuario, u.email, u.rol, u.activo,
               EXISTS (
                   SELECT 1 FROM membresia m
                   WHERE m.id_usuario = u.id_usuario
                   AND CURRENT_DATE BETWEEN m.fecha_inicio AND m.fecha_expiracion
               ) AS membresia_activa
        FROM usuario u
        LEFT JOIN comprador c ON u.id_usuario = c.id_usuario
    `);
    return result;
}

async function findPendingUsers() {
    const users = await Usuario.findAll({
        where: { activo: false, rol: { [require('sequelize').Op.ne]: 'administrador' } },
        include: [{ model: Comprador, attributes: ['codigo_verificacion'] }]
    });
    return users.map(u => ({
        id_usuario: u.id_usuario,
        email: u.email,
        rol: u.rol,
        activo: u.activo,
        codigo_verificacion: u.Comprador?.codigo_verificacion
    }));
}

async function findUserNamesByIds(ids) {
    const users = await Usuario.findAll({
        where: { id_usuario: ids.map(Number) },
        attributes: ['id_usuario', 'nombre', 'apellido']
    });
    return users.map(u => u.toJSON());
}

async function searchBuyer(email, cedula) {
    const where = { email };
    const user = await Usuario.findOne({
        where,
        include: [{ model: Comprador, attributes: ['cedula'] }]
    });
    if (!user) return [];
    const c = user.Comprador;
    if (cedula && c?.cedula !== Number(cedula)) return [];
    return [{
        id_usuario: user.id_usuario,
        email: user.email,
        nombre: user.nombre,
        apellido: user.apellido,
        cedula: c?.cedula
    }];
}

async function createUser(data) {
    const user = await Usuario.create({
        email: data.email,
        password: data.password,
        nombre: data.nombre,
        apellido: data.apellido,
        rol: data.rol || 'comprador',
        activo: data.activo !== undefined ? data.activo : false
    });
    return user.toJSON();
}

module.exports = {
    findByEmail, findById, findWithComprador, findWithMembresiaStatus,
    updateActivo, updatePassword, deleteById, findAllUsers, findPendingUsers,
    findUserNamesByIds, searchBuyer, createUser
};
