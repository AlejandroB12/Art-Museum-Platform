const geoRepo = require('../repositories/geography_repository');

async function listEstados() {
    return geoRepo.findAllEstados();
}

async function listMunicipios(idEstado) {
    return geoRepo.findMunicipiosByEstado(idEstado);
}

async function listParroquias(idMunicipio) {
    return geoRepo.findParroquiasByMunicipio(idMunicipio);
}

module.exports = { listEstados, listMunicipios, listParroquias };
