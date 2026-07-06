const Artist = require('../models/artist_model');

async function findAll(select = '', sort = { _id: 1 }) 
{
    let query = Artist.find();
    if (select) query = query.select(select);
    return query.sort(sort).lean();
}

async function findById(id) 
{
    return Artist.findById(id).lean();
}

async function findMaxId() 
{
    return Artist.findOne().sort({ _id: -1 }).select('_id').lean();
}

async function create(data) 
{
    const artist = new Artist(data);
    return artist.save();
}

async function findByIdAndDelete(id) 
{
    return Artist.findByIdAndDelete(id);
}

async function aggregate(pipeline) 
{
    return Artist.aggregate(pipeline);
}

async function findByIdAndUpdate(id, data) 
{
    return Artist.findByIdAndUpdate(id, data, { new: true });
}

async function findBySearch(query, select = '_id') 
{
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = { $regex: escaped, $options: 'i' };
    return Artist.find({ $or: [{ nombre: regex }, { apellido: regex }] }).select(select).lean();
}

module.exports = {findAll, findById, findMaxId, create, findByIdAndDelete, aggregate, findByIdAndUpdate, findBySearch};
