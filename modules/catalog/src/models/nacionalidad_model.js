const mongoose = require('mongoose');

const nacionalidadSchema = new mongoose.Schema({
    _id: Number,
    nombre: String
});

module.exports = mongoose.model('Nacionalidad', nacionalidadSchema, 'nacionalidades');
