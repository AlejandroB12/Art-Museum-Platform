const { db } = require('../config/database');
const { promisify } = require('util');
const query = promisify(db.query).bind(db);

async function findAllEstados() {
    return query("SELECT id_estado, nombre FROM Estado ORDER BY nombre");
}

async function findMunicipiosByEstado(idEstado) {
    return query("SELECT id_municipio, nombre FROM Municipio WHERE id_estado = ? ORDER BY nombre", [idEstado]);
}

async function findParroquiasByMunicipio(idMunicipio) {
    return query("SELECT id_parroquia, nombre FROM Parroquia WHERE id_municipio = ? ORDER BY nombre", [idMunicipio]);
}

module.exports = { findAllEstados, findMunicipiosByEstado, findParroquiasByMunicipio };
