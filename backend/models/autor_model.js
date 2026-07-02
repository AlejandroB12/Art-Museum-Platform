const mongoose = require('mongoose');

const autorSchema = new mongoose.Schema({
    _id: Number,
    nombre: { type: String, required: true },
    apellido: { type: String, required: true },
    fecha_nacimiento: Date,
    fotografia: String,
    biografia: String,
    nacionalidad: String
});

module.exports = mongoose.model('Autor', autorSchema, 'autores');
