const express = require('express');
const router = express.Router();
const Autor = require('../models/Autor');
const Obra = require('../models/Obra');

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

router.get('/autores', async (req, res) => {
    try {
        const autores = await Autor.find().select('_id nombre apellido').lean();
        res.json(autores.map(a => ({
            id_Autor: a._id,
            Nombre: a.nombre,
            Apellido: a.apellido
        })));
    } catch (err) {
        res.status(500).json(err);
    }
});

router.get('/obras-filtradas', async (req, res) => {
    try {
        const { genero, artista, orden } = req.query;
        let filter = { estado_obra: 'Disponible' };

        if (genero && genero !== 'all') {
            filter['genero.nombre'] = GENRE_MAP[genero] || genero;
        }
        if (artista && artista !== 'all') {
            filter.autores = parseInt(artista);
        }

        let query = Obra.find(filter)
            .populate('autores', '_id nombre apellido fotografia')
            .sort({ precio: orden === 'desc' ? -1 : 1 })
            .lean();

        const obras = await query;
        res.json(obras.map(mapObraToFrontend));
    } catch (err) {
        console.error("Error en obras-filtradas:", err);
        res.status(500).json({ error: "Error en la base de datos", detalles: err });
    }
});

router.get('/autor-detalle/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const autor = await Autor.findById(id).lean();
        if (!autor) {
            return res.status(404).json({ error: "Autor no encontrado" });
        }

        const { ordenDate } = req.query;
        let obrasQuery = Obra.find({ autores: id, estado_obra: 'Disponible' })
            .populate('autores', '_id nombre apellido fotografia')
            .lean();

        if (ordenDate === 'asc') {
            obrasQuery = obrasQuery.sort({ fecha_creacion: 1 });
        } else {
            obrasQuery = obrasQuery.sort({ fecha_creacion: -1 });
        }

        const obras = await obrasQuery;

        const obrasMapped = obras.map(obra => mapObraDetailToFrontend(obra));

        res.json({
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
            obras: obrasMapped
        });
    } catch (err) {
        console.error("Error en autor-detalle:", err);
        res.status(500).json({ error: "Error en la base de datos", detalles: err });
    }
});

router.get('/estado-usuario', (req, res) => {
    res.json({ autenticado: !!(req.session.usuario || req.session.id_usuario) });
});

router.get('/usuario-actual', (req, res) => {
    if (req.session && req.session.usuario) {
        return res.json(req.session.usuario);
    }
    if (req.session && req.session.id_usuario) {
        return res.json({
            id_usuario: req.session.id_usuario,
            Nombre: req.session.usuario?.Nombre || 'Invitado',
            Email: req.session.usuario?.Email || 'guest@museo.com',
            Rol: req.session.usuario?.Rol || null
        });
    }
    return res.status(401).json({ error: "No autenticado" });
});

router.get('/artistas-catalogo', async (req, res) => {
    try {
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
                    _id: 1,
                    nombre: 1,
                    apellido: 1,
                    fecha_nacimiento: 1,
                    fotografia: 1,
                    biografia: 1,
                    nacionalidad: 1,
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

        const artistas = await Autor.aggregate(pipeline);

        const processedResults = artistas.map(artista => ({
            id_Autor: artista._id,
            Nombre: artista.nombre,
            Apellido: artista.apellido,
            Fecha_nacimiento: artista.fecha_nacimiento,
            Fotografia: artista.fotografia,
            Especialidades: (artista.especialidades && artista.especialidades.length > 0)
                ? artista.especialidades.join(', ')
                : 'Sin especialidades',
            Nacionalidad: artista.nacionalidad || 'Nacionalidad no especificada',
            Biografia: artista.biografia || ''
        }));

        res.json(processedResults);
    } catch (err) {
        console.error("Error en artistas-catalogo:", err);
        res.status(500).json({ error: "Error en la base de datos", detalles: err });
    }
});

module.exports = router;
