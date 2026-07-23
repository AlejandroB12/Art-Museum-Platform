const { query } = require('../config/database');

async function findAllEstados() {
    return query("SELECT id_estado, nombre FROM estado ORDER BY nombre");
}

async function findMunicipiosByEstado(idEstado) {
    return query("SELECT id_municipio, nombre FROM municipio WHERE id_estado = $1 ORDER BY nombre", [idEstado]);
}

async function findParroquiasByMunicipio(idMunicipio) {
    return query("SELECT id_parroquia, nombre FROM parroquia WHERE id_municipio = $1 ORDER BY nombre", [idMunicipio]);
}

module.exports = { findAllEstados, findMunicipiosByEstado, findParroquiasByMunicipio };
