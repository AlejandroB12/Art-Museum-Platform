const Artista = require('../models/mongoose/artista.model');

async function findAll(select = '', sort = { _id: 1 }) {
    let query = Artista.find();
    if (select) query = query.select(select);
    return query.sort(sort).lean();
}

async function findById(id) {
    return Artista.findById(id).lean();
}

async function findMaxId() {
    return Artista.findOne().sort({ _id: -1 }).select('_id').lean();
}

async function create(data) {
    const artista = new Artista(data);
    return artista.save();
}

async function findByIdAndDelete(id) {
    return Artista.findByIdAndDelete(id);
}

async function aggregate(pipeline) {
    return Artista.aggregate(pipeline);
}

module.exports = { findAll, findById, findMaxId, create, findByIdAndDelete, aggregate };
