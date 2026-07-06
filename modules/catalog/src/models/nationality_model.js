const mongoose = require('mongoose');

const nationalitySchema = new mongoose.Schema({
    
    _id: Number,
    nombre: { type: String, unique: true, trim: true }
}, 

{
    timestamps: true,
    collection: 'nacionalidades'
});

module.exports = mongoose.model('Nationality', nationalitySchema);
