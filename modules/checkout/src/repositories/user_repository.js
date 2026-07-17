const { Usuario, Comprador, Membresia } = require('../config/database');
const { Op } = require('sequelize');

async function findWithMembresiaStatus(id) {
    const user = await Usuario.findByPk(Number(id), {
        attributes: ['rol'],
        include: [{
            model: Membresia,
            attributes: [],
            required: false,
            where: {
                fecha_inicio: { [Op.lte]: new Date() },
                fecha_expiracion: { [Op.gte]: new Date() }
            }
        }]
    });
    if (!user) return [];
    const membresias = user.Membresia || [];
    return [{
        rol: user.rol,
        membresia_activa: membresias.length > 0
    }];
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
        id_estado: c?.id_estado,
        id_municipio: c?.id_municipio,
        id_parroquia: c?.id_parroquia,
        calle: c?.calle
    }];
}

module.exports = { findWithMembresiaStatus, findWithComprador };
