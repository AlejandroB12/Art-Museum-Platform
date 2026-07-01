const Nacionalidad = require('./models/nacionalidad_model');

async function findAll(sort = { _id: 1 }) {
    return Nacionalidad.find().sort(sort).lean();
}

module.exports = { findAll };
