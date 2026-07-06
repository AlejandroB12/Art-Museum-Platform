const mongoose = require('mongoose');

const genreSchema = new mongoose.Schema({

    _id: Number,
    nombre: { type: String, unique: true, trim: true },
    detalles: mongoose.Schema.Types.Mixed
}, 

{
    timestamps: true,
    collection: 'generos'
});

module.exports = mongoose.model('Genre', genreSchema);
