const mongoose = require('mongoose');

const atributoSchema = new mongoose.Schema({
    nombre: { type: String, required: true },
    tipo: { type: String, enum: ['string', 'number', 'boolean'], required: true },
    requerido: { type: Boolean, default: false }
}, { _id: false });

const especializacionSchema = new mongoose.Schema({
    _id: Number,
    nombre: { type: String, required: true },
    descripcion: String,
    atributos: [atributoSchema]
});

module.exports = mongoose.model('Especializacion', especializacionSchema, 'especializaciones');
