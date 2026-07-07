const mongoose = require('mongoose');

const artistSchema = new mongoose.Schema({
    _id: Number,
    nombre: { type: String, trim: true },
    apellido: { type: String, trim: true },
    fecha_nacimiento: Date,
    fotografia: { type: String, trim: true },
    biografia: { type: String, trim: true },
    nacionalidad: { type: String, trim: true }
}, {
    timestamps: true,
    collection: 'artistas'
});

artistSchema.index({ apellido: 1, nombre: 1 });
artistSchema.index({ nombre: 'text', apellido: 'text' });

module.exports = mongoose.model('Artist', artistSchema);
