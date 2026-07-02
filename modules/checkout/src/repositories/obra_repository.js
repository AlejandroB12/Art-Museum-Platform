const Obra = require('../models/obra_model');

async function findById(id) {
    return Obra.findById(id).lean();
}

async function findByIdAndUpdate(id, data) {
    return Obra.findByIdAndUpdate(id, data, { new: true });
}

module.exports = { findById, findByIdAndUpdate };
