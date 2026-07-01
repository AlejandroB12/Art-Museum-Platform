const mongoose = require('mongoose');

const generoSchema = new mongoose.Schema({
    _id: Number,
    nombre: String,
    descripcion: String
});

module.exports = mongoose.model('Genero', generoSchema, 'generos');
