const artworkRepo = require('../repositories/artwork_repository');
const artistRepo = require('../repositories/artist_repository');
const { mapObraToFrontend, mapSearchResult } = require('./mapper_service');

// Función para listar obras filtradas por género, artista y orden, con paginación.
async function listObrasFiltradas(genero, artista, orden, pagina = 1, limite = 12) 
{
    const filter = { estatus: 'Disponible' };

    if (genero && genero !== 'all') 
    {
        filter['genero.nombre'] = { $regex: new RegExp(`^${genero.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') };
    }

    if (artista && artista !== 'all') 
    {
        filter.artista = parseInt(artista);
    }

    const sort = { precio: orden === 'desc' ? -1 : 1 };
    const skip = (parseInt(pagina) - 1) * parseInt(limite);

    const [obras, total, artistas] = await Promise.all([
        artworkRepo.findPaginated(filter, sort, skip, parseInt(limite)),
        artworkRepo.count(filter),
        artistRepo.findAll('_id nombre apellido fotografia')
    ]);

    const artistasMap = {};
    artistas.forEach(a => { artistasMap[a._id] = a; });

    const result = obras.map(obra => {
        const artista = obra.artista ? artistasMap[obra.artista] : null;
        return mapObraToFrontend({ ...obra, artista });
    });

    return { obras: result, total, pagina: parseInt(pagina), limite: parseInt(limite) };
}

// Función para listar las obras destacadas, ordenadas por precio descendente.
async function listObrasDestacadas() 
{
    const todas = await artworkRepo.findWithPopulate(

        { estatus: 'Disponible' },
        { path: 'artista', select: '_id nombre apellido fotografia' },
        { precio: -1 }
    );

    return todas.map(mapObraToFrontend).slice(0, 20);
}

// Función para obtener los detalles de una obra específica por su ID.
async function getObraById(id) 
{
    const obras = await artworkRepo.findWithPopulate(
        { _id: parseInt(id) },
        { path: 'artista', select: '_id nombre apellido fotografia' }
    );

    if (obras.length === 0) return null;

    return mapObraToFrontend(obras[0]);
}

// Función para buscar obras por título o descripción, incluyendo obras de artistas coincidentes.
async function buscarObras(query) 
{
    const q = query.trim();
    if (!q || q.length < 2) return [];

    const artistasMatch = await artistRepo.findBySearch(q, '_id');
    const artistaIds = artistasMatch.map(a => a._id);

    let obras = await artworkRepo.search(q);

    if (artistaIds.length > 0) 
    {
        const obrasExtra = await artworkRepo.findAll({

            estatus: 'Disponible',
            artista: { $in: artistaIds }
        });

        const seen = new Set(obras.map(o => o._id));

        for (const o of obrasExtra) 
        {
            if (!seen.has(o._id)) 
            {
                seen.add(o._id);
                obras.push(o);
            }
        }
    }

    const todosArtistas = await artistRepo.findAll('_id nombre apellido');
    const artistaMap = {};
    todosArtistas.forEach(a => { artistaMap[a._id] = a.nombre + ' ' + a.apellido; });

    return obras.map(o => mapSearchResult(o, artistaMap[o.artista] || ''));
}

module.exports = { listObrasFiltradas, listObrasDestacadas, getObraById, buscarObras };
