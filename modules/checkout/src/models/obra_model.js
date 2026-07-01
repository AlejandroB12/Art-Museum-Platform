const mongoose = require('mongoose');

const obraSchema = new mongoose.Schema({
    _id: Number,
    nombre: { type: String, required: true },
    precio: { type: Number, required: true },
    fecha_creacion: Date,
    fotografia: String,
    estado_obra: { type: String, default: 'Disponible' },
    genero: {
        nombre: String
    }
});

module.exports = mongoose.model('Obra', obraSchema, 'obras');
