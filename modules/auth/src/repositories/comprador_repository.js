const { Comprador, Parroquia, Municipio, Usuario } = require('../models');

async function findByUserId(idUsuario) {
    const comprador = await Comprador.findByPk(Number(idUsuario));
    return comprador ? [comprador.toJSON()] : [];
}

async function findShippingData(idUsuario) {
    const comprador = await Comprador.findByPk(Number(idUsuario), {
        include: [
            { model: Usuario, attributes: ['nombre', 'apellido'] },
            {
                model: Parroquia,
                attributes: ['nombre'],
                include: [{ model: Municipio, attributes: ['nombre'] }]
            }
        ]
    });
    if (!comprador) return [];
    const c = comprador.toJSON();
    return [{
        nombre: c.Usuario?.nombre,
        apellido: c.Usuario?.apellido,
        calle: c.calle,
        parroquia: c.Parroquia?.nombre,
        municipio: c.Parroquia?.Municipio?.nombre
    }];
}

async function create(data) {
    await Comprador.create({
        id_usuario: data.id_usuario,
        cedula: data.cedula,
        telefono: data.telefono || null,
        codigo_verificacion: data.codigo_verificacion || null,
        id_estado: data.id_estado || null,
        id_municipio: data.id_municipio || null,
        id_parroquia: data.id_parroquia || null,
        calle: data.calle || null
    });
}

module.exports = { findByUserId, findShippingData, create };
