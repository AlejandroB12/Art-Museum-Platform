const mongoose = require('mongoose');

const generoSchema = new mongoose.Schema({
    _id: Number,
    nombre: { type: String, required: true, unique: true },
    descripcion: String
});

module.exports = mongoose.model('Genero', generoSchema, 'generos');
