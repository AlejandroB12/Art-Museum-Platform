const compradorRepo = require('../repositories/comprador_repository');

async function getDatosEnvioPago(userId) {
    const results = await compradorRepo.findShippingData(userId);
    return results.length > 0 ? results[0] : null;
}

module.exports = { getDatosEnvioPago };
