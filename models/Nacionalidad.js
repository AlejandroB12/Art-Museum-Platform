const mongoose = require('mongoose');

const nacionalidadSchema = new mongoose.Schema({
    _id: Number,
    nombre: { type: String, required: true, unique: true }
});

module.exports = mongoose.model('Nacionalidad', nacionalidadSchema, 'nacionalidades');
