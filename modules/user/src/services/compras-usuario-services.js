const compradorRepo = require('../repositories/comprador_repository');

async function getMisCompras(idUsuario) {
  return compradorRepo.findPurchaseHistory(idUsuario);
}

module.exports = { getMisCompras };
