const Autor = require('./models/autor_model');

async function findAll(select = '', sort = { _id: 1 }) {
    let query = Autor.find();
    if (select) query = query.select(select);
    return query.sort(sort).lean();
}

async function findById(id) {
    return Autor.findById(id).lean();
}

async function findMaxId() {
    return Autor.findOne().sort({ _id: -1 }).select('_id').lean();
}

async function create(data) {
    const autor = new Autor(data);
    return autor.save();
}

async function findByIdAndDelete(id) {
    return Autor.findByIdAndDelete(id);
}

async function aggregate(pipeline) {
    return Autor.aggregate(pipeline);
}

module.exports = { findAll, findById, findMaxId, create, findByIdAndDelete, aggregate };
