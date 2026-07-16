const { Estado, Municipio, Parroquia } = require('../config/database');

async function findAllEstados() {
    const estados = await Estado.findAll({
        order: [['nombre', 'ASC']]
    });
    return estados.map(e => e.toJSON());
}

async function findMunicipiosByEstado(idEstado) {
    const municipios = await Municipio.findAll({
        where: { id_estado: Number(idEstado) },
        order: [['nombre', 'ASC']]
    });
    return municipios.map(m => m.toJSON());
}

async function findParroquiasByMunicipio(idMunicipio) {
    const parroquias = await Parroquia.findAll({
        where: { id_municipio: Number(idMunicipio) },
        order: [['nombre', 'ASC']]
    });
    return parroquias.map(p => p.toJSON());
}

module.exports = { findAllEstados, findMunicipiosByEstado, findParroquiasByMunicipio };
