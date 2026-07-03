const Obra = require('../models/obra_model');

async function findAll(filters = {}, sort = { _id: 1 }) {
    return Obra.find(filters).sort(sort).lean();
}

async function findById(id) {
    return Obra.findById(id).lean();
}

async function findByIdAndUpdate(id, data) {
    return Obra.findByIdAndUpdate(id, data, { new: true });
}

async function findWithPopulate(filters, populateOpts, sort = {}) {
    let query = Obra.find(filters);
    if (populateOpts) query = query.populate(populateOpts);
    if (Object.keys(sort).length) query = query.sort(sort);
    return query.lean();
}

async function findMaxId() {
    return Obra.findOne().sort({ _id: -1 }).select('_id').lean();
}

async function create(data) {
    const obra = new Obra(data);
    return obra.save();
}

async function findByIdAndDelete(id) {
    return Obra.findByIdAndDelete(id);
}

async function findReserved() {
    return Obra.find({ estado_obra: 'Reservado' }).select('_id nombre precio').lean();
}

module.exports = { findAll, findById, findByIdAndUpdate, findWithPopulate, findMaxId, create, findByIdAndDelete, findReserved };
