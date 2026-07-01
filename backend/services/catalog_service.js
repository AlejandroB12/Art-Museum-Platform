const obraRepo = require('../repositories/obra_repository');
const autorRepo = require('../repositories/autor_repository');

const GENRE_MAP = {
    'Pintura': 'Pintura',
    'Escultura': 'Escultura',
    'Fotografia': 'Fotografía',
    'Orfebreria': 'Orfebreria',
    'Ceramica': 'Ceramica'
};

function formatPrice(price) {
    if (price == null) return null;
    return Number(price).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' USD';
}

function mapObraToFrontend(obra) {
    const detalles = obra.genero && obra.genero.detalles ? obra.genero.detalles : {};
    const autor = obra.autores && obra.autores[0] ? obra.autores[0] : null;
    return {
        id_Obra: obra._id,
        Nombre: obra.nombre,
        Fecha_creacion: obra.fecha_creacion ? obra.fecha_creacion.toISOString().split('T')[0] : null,
        Precio: obra.precio,
        PrecioFormateado: formatPrice(obra.precio),
        Estado_obra: obra.estado_obra,
        imagen_url: obra.fotografia,
        AutorNombre: autor ? autor.nombre : null,
        AutorApellido: autor ? autor.apellido : null,
        GeneroNombre: obra.genero ? obra.genero.nombre : null,
        id_Autor: autor ? autor._id : null,
        autor_foto_url: autor ? autor.fotografia : null,
        ...detalles
    };
}

function mapObraDetailToFrontend(obra) {
    const detalles = obra.genero && obra.genero.detalles ? obra.genero.detalles : {};
    return {
        id_Obra: obra._id,
        Nombre: obra.nombre,
        Fecha_creacion: obra.fecha_creacion ? obra.fecha_creacion.toISOString().split('T')[0] : null,
        Precio: obra.precio,
        PrecioFormateado: formatPrice(obra.precio),
        Estado_obra: obra.estado_obra,
        imagen_url: obra.fotografia || null,
        GeneroNombre: obra.genero ? obra.genero.nombre : null,
        ...detalles
    };
}

async function listAutores() {
    const autores = await autorRepo.findAll('_id nombre apellido');
    return autores.map(a => ({
        id_Autor: a._id,
        Nombre: a.nombre,
        Apellido: a.apellido
    }));
}

async function listObrasFiltradas(genero, artista, orden) {
    const filter = { estado_obra: 'Disponible' };
    if (genero && genero !== 'all') {
        filter['genero.nombre'] = GENRE_MAP[genero] || genero;
    }
    if (artista && artista !== 'all') {
        filter.autores = parseInt(artista);
    }
    const sort = { precio: orden === 'desc' ? -1 : 1 };
    const obras = await obraRepo.findWithPopulate(
        filter,
        { path: 'autores', select: '_id nombre apellido fotografia' },
        sort
    );
    return obras.map(mapObraToFrontend);
}

async function getAutorDetalle(id, ordenDate) {
    const autor = await autorRepo.findById(parseInt(id));
    if (!autor) return null;

    const obraFilter = { autores: parseInt(id), estado_obra: 'Disponible' };
    const obraSort = ordenDate === 'asc' ? { fecha_creacion: 1 } : { fecha_creacion: -1 };
    const obras = await obraRepo.findWithPopulate(
        obraFilter,
        { path: 'autores', select: '_id nombre apellido fotografia' },
        obraSort
    );

    return {
        autor: {
            id_Autor: autor._id,
            Nombre: autor.nombre,
            Apellido: autor.apellido,
            Fecha_nacimiento: autor.fecha_nacimiento,
            Fotografia: autor.fotografia,
            Biografia: autor.biografia,
            Nacionalidad: autor.nacionalidad,
            NacionalidadDesc: autor.nacionalidad
        },
        obras: obras.map(mapObraDetailToFrontend)
    };
}

async function listArtistasCatalogo() {
    const pipeline = [
        {
            $lookup: {
                from: 'obras',
                let: { autorId: '$_id' },
                pipeline: [
                    { $match: { $expr: { $in: ['$$autorId', '$autores'] } } },
                    { $group: { _id: '$genero.nombre' } }
                ],
                as: 'obras_info'
            }
        },
        {
            $project: {
                _id: 1, nombre: 1, apellido: 1, fecha_nacimiento: 1,
                fotografia: 1, biografia: 1, nacionalidad: 1,
                especialidades: {
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
    const artistas = await autorRepo.aggregate(pipeline);
    return artistas.map(a => ({
        id_Autor: a._id,
        Nombre: a.nombre,
        Apellido: a.apellido,
        Fecha_nacimiento: a.fecha_nacimiento,
        Fotografia: a.fotografia,
        Especialidades: (a.especialidades && a.especialidades.length > 0)
            ? a.especialidades.join(', ') : 'Sin especialidades',
        Nacionalidad: a.nacionalidad || 'Nacionalidad no especificada',
        Biografia: a.biografia || ''
    }));
}

async function listObrasDestacadas() {
    const todas = await obraRepo.findWithPopulate(
        { estado_obra: 'Disponible' },
        { path: 'autores', select: '_id nombre apellido fotografia' },
        { precio: -1 }
    );
    return todas.map(mapObraToFrontend).slice(0, 20);
}

module.exports = {
    listAutores, listObrasFiltradas, getAutorDetalle,
    listArtistasCatalogo, listObrasDestacadas
};
