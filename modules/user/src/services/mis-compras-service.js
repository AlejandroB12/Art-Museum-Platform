const compradorRepo = require('../repositories/comprador_repository');

async function getMisCompras(userId) {
    return compradorRepo.findPurchaseHistory(userId);
}

module.exports = { getMisCompras };
