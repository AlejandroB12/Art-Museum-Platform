const artistRepo = require('../repositories/artist_repository');
const artworkRepo = require('../repositories/artwork_repository');
const { mapObraDetailToFrontend } = require('./mapper_service');

// Función para listar todos los artistas con sus detalles y obras.
async function listArtistas() 
{
    const artistas = await artistRepo.findAll('_id nombre apellido');

    return artistas.map(a => ({
        id_artista: a._id,
        nombre: a.nombre,
        apellido: a.apellido
    }));
}

// Función para obtener los detalles de un artista específico y sus obras.
async function getArtistaDetalle(id, ordenDate) 
{
    const artista = await artistRepo.findById(parseInt(id));
    if (!artista) return null;

    const obraFilter = { artista: parseInt(id), estado_obra: 'Disponible' };
    const obraSort = ordenDate === 'asc' ? { fecha_creacion: 1 } : { fecha_creacion: -1 };
    const obras = await artworkRepo.findWithPopulate(
        
        obraFilter,
        { path: 'artista', select: '_id nombre apellido fotografia' },
        obraSort
    );

    return {
        artista: {
            id_artista: artista._id,
            nombre: artista.nombre,
            apellido: artista.apellido,
            fecha_nacimiento: artista.fecha_nacimiento,
            fotografia: artista.fotografia,
            biografia: artista.biografia,
            nacionalidad: artista.nacionalidad
        },
        obras: obras.map(mapObraDetailToFrontend)
    };
}

// Función para listar todos los artistas con sus géneros de obras y detalles.
async function listArtistasCatalogo() 
{
    const pipeline = [
        {
            $lookup: {

                from: 'obras',
                let: { artistaId: '$_id' },
                pipeline: [
                    { $match: { $expr: { $eq: ['$$artistaId', '$artista'] } } },
                    { $group: { _id: '$genero.nombre' } }
                ],
                as: 'obras_info'
            }
        },

        {
            $project: {

                _id: 1, nombre: 1, apellido: 1, fecha_nacimiento: 1,
                fotografia: 1, biografia: 1, nacionalidad: 1,
                generos: {

                    $reduce: {

                        input: '$obras_info._id',
                        initialValue: [],
                        in: { $concatArrays: ['$$value', ['$$this']] }
                    }
                }
            }
        },

        { $sort: { apellido: 1 } }
    ];

    const artistas = await artistRepo.aggregate(pipeline);

    return artistas.map(a => ({

        id_artista: a._id,
        nombre: a.nombre,
        apellido: a.apellido,
        fecha_nacimiento: a.fecha_nacimiento,
        fotografia: a.fotografia,
        generos: (a.generos && a.generos.length > 0) ? a.generos.join(', ') : 'Sin géneros',
        nacionalidad: a.nacionalidad || 'Nacionalidad no especificada',
        biografia: a.biografia || ''
    }));
}

async function getArtistaByName(name) {
    const cleanName = name.replace(/\s+/g, '');
    const artista = await artistRepo.findByFullName(cleanName);
    if (!artista) return null;
    return getArtistaDetalle(artista._id);
}

module.exports = { listArtistas, getArtistaDetalle, listArtistasCatalogo, getArtistaByName };
