const membershipRepo = require('../repositories/membership_repository');

const MEMBERSHIP_PRICE = 10.00;

async function getMembershipConfig() {
    return { precio: MEMBERSHIP_PRICE, moneda: 'USD', concepto: 'Suscripción Digital' };
}

module.exports = { getMembershipConfig };
