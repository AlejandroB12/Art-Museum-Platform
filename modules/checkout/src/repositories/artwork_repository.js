const Artwork = require('../models/artwork_model');

async function findById(id) {
    return Artwork.findById(id).lean();
}

async function findByIdAndUpdate(id, data) {
    return Artwork.findByIdAndUpdate(id, data, { new: true });
}

module.exports = { findById, findByIdAndUpdate };
