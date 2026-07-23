const compradorRepo = require('../repositories/comprador_repository');

async function getMisCompras(userId) {
    const compras = await compradorRepo.findPurchaseHistory(userId);
    return compras.map(c => ({
        ...c,
        Genero: c.Genero || 'Sin género'
    }));
}

module.exports = { getMisCompras };
