const mongoose = require('mongoose');

const artworkSchema = new mongoose.Schema({

    _id: Number,
    nombre: { type: String, trim: true },
    precio: Number,
    fecha_creacion: Date,
    fotografia: { type: String, trim: true },
    estado_obra: { type: String, default: 'Disponible' },
    artista: { type: Number, ref: 'Artist' },

    genero: {
        nombre: { type: String, trim: true },
        detalles: mongoose.Schema.Types.Mixed
    }
}, 

{
    strict: false,
    timestamps: true,
    collection: 'obras'
});

artworkSchema.index({ estado_obra: 1, 'genero.nombre': 1, precio: 1 });
artworkSchema.index({ nombre: 'text' });

module.exports = mongoose.model('Artwork', artworkSchema);
