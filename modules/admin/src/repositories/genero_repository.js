const Genero = require('../models/genero_model');
const mongoose = require('mongoose');

async function findAll(sort = { _id: 1 }) {
    return Genero.find().sort(sort).lean();
}

async function findById(id) {
    return Genero.findById(id);
}

async function findOneByName(nombre) {
    return Genero.findOne({ nombre }).lean();
}

async function findMaxId() {
    return Genero.findOne().sort({ _id: -1 }).select('_id').lean();
}

async function create(data) {
    const genero = new Genero(data);
    return genero.save();
}

async function findByIdAndUpdate(id, data) {
    return Genero.findByIdAndUpdate(id, data, { new: true });
}

async function findByIdAndDelete(id) {
    return Genero.findByIdAndDelete(id);
}

async function getEspecializaciones() {
    return mongoose.connection.db.collection('especializaciones').find().toArray();
}

module.exports = { findAll, findById, findOneByName, findMaxId, create, findByIdAndUpdate, findByIdAndDelete, getEspecializaciones };
