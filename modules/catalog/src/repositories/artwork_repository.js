const Artwork = require('../models/artwork_model');

async function findAll(filters = {}, sort = { _id: 1 }) {
    return Artwork.find(filters).sort(sort).lean();
}

async function findById(id) {
    return Artwork.findById(id).lean();
}

async function findByIdAndUpdate(id, data) {
    return Artwork.findByIdAndUpdate(id, data, { new: true });
}

async function findWithPopulate(filters, populateOpts, sort = {}) {
    let query = Artwork.find(filters);
    if (populateOpts) query = query.populate(populateOpts);
    if (Object.keys(sort).length) query = query.sort(sort);
    return query.lean();
}

async function findMaxId() {
    return Artwork.findOne().sort({ _id: -1 }).select('_id').lean();
}

async function create(data) {
    const artwork = new Artwork(data);
    return artwork.save();
}

async function findByIdAndDelete(id) {
    return Artwork.findByIdAndDelete(id);
}

async function findReserved() {
    return Artwork.find({ estado_obra: 'Reservado' }).select('_id nombre precio').lean();
}

async function count(filters = {}) {
    return Artwork.countDocuments(filters);
}

async function findPaginated(filters = {}, sort = { _id: 1 }, skip = 0, limit = 12) {
    return Artwork.find(filters).sort(sort).skip(skip).limit(limit).lean();
}

async function search(query, limit = 15) {
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = { $regex: escaped, $options: 'i' };
    const filter = {
        estado_obra: 'Disponible',
        $or: [
            { nombre: regex },
            { 'genero.nombre': regex }
        ]
    };
    return Artwork.find(filter).limit(limit).lean();
}

module.exports = {
    findAll, findById, findByIdAndUpdate, findWithPopulate,
    findMaxId, create, findByIdAndDelete, findReserved,
    count, findPaginated, search
};
