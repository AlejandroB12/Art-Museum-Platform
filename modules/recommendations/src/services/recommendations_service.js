const neoRepo = require('../repositories/recommendation_repository');

function getSimilitudLabel(sim) {
    if (sim >= 90) return 'Muy similar';
    if (sim >= 80) return 'Estilo parecido';
    if (sim >= 70) return 'Técnica similar';
    return 'Composición afín';
}

function cosineSimilarity(a, b) {
    if (!a || !b || a.length === 0 || b.length === 0) return 0;
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < a.length; i++) {
        dot += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }
    return (normA === 0 || normB === 0) ? 0 : dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

async function mismoGenero(idUsuario) {
    const records = await neoRepo.findSameGenre(idUsuario);
    return records.map(r => ({
        id_Obra: neoRepo.toNum(r.get('id_Obra')),
        Nombre: r.get('Nombre'),
        Precio: r.get('Precio'),
        Genero: r.get('Genero')
    }));
}

async function colaborativo(idUsuario) {
    const records = await neoRepo.findCollaborative(idUsuario);
    return records.map(r => ({
        id_Obra: neoRepo.toNum(r.get('id_Obra')),
        Nombre: r.get('Nombre'),
        Precio: r.get('Precio'),
        CantidadCoincidencias: neoRepo.toNum(r.get('CantidadCoincidencias'))
    }));
}

async function personalizadas(idUsuario) {
    const records = await neoRepo.findPersonalized(idUsuario);
    return records.map(r => ({
        id_Obra: neoRepo.toNum(r.get('id_Obra')),
        Nombre: r.get('Nombre'),
        Precio: r.get('Precio'),
        Genero: r.get('Genero')
    }));
}

async function artistasPopulares() {
    const records = await neoRepo.findPopularArtists();
    let fotosMap = {};
    try {
        const Autor = require('../models/autor_model');
        const ids = records.map(r => neoRepo.toNum(r.get('idArtista')));
        const autores = await Autor.find({ _id: { $in: ids } }).select('_id fotografia').lean();
        autores.forEach(a => { fotosMap[a._id] = a.fotografia || ''; });
    } catch (e) {
        console.warn('autor_model no disponible, se omite foto de artistas:', e.message);
    }

    return records.map(r => {
        const id = neoRepo.toNum(r.get('idArtista'));
        const obrasRaw = r.get('obras') || [];
        const topObras = obrasRaw
            .sort((a, b) => Number(b.vistas || 0) - Number(a.vistas || 0))
            .slice(0, 5)
            .map(o => ({
                id: neoRepo.toNum(o.id),
                nombre: o.nombre,
                fotografia: o.fotografia || '',
                vistas: neoRepo.toNum(o.vistas)
            }));

        return {
            idArtista: id,
            artista: (r.get('nombre') || '') + ' ' + (r.get('apellido') || ''),
            fotoArtista: fotosMap[id] || '',
            obrasVendidas: neoRepo.toNum(r.get('obrasVendidas')),
            totalVistas: neoRepo.toNum(r.get('totalVistas')),
            obras: topObras
        };
    });
}

async function generosPopulares() {
    const records = await neoRepo.findPopularGenres();
    return records.map(r => ({
        Genero: r.get('Genero'),
        ObrasVendidas: neoRepo.toNum(r.get('ObrasVendidas')),
        CompradoresDistintos: neoRepo.toNum(r.get('CompradoresDistintos')),
        PrecioPromedio: r.get('PrecioPromedio'),
        IngresoTotal: r.get('IngresoTotal')
    }));
}

async function obrasPorGenero(genero) {
    const records = await neoRepo.findObrasByGenero(genero);
    return records.map(r => ({
        id_Obra: neoRepo.toNum(r.get('id_Obra')),
        Nombre: r.get('Nombre'),
        Precio: r.get('Precio'),
        fotografia: r.get('fotografia') || ''
    }));
}

async function estadisticas() {
    const { nodos, relaciones } = await neoRepo.getGraphStats();
    const traducciones = {
        'CREO': 'Obras por artista',
        'PERTENECE_A_EPOCA': 'Obras por época',
        'SIMILAR_A': 'Obras similares detectadas',
        'TIENE_ESTILO': 'Obras por estilo',
        'TRABAJA_EN': 'Artistas por género',
        'USA_PALETA': 'Obras por paleta de color',
        'USA_TECNICA': 'Obras por técnica'
    };
    return {
        nodos: nodos.map(r => ({ tipo: r.get('Tipo')[0], cantidad: neoRepo.toNum(r.get('Cantidad')) })),
        relaciones: relaciones.map(r => ({
            tipo: traducciones[r.get('Tipo')] || r.get('Tipo'),
            cantidad: neoRepo.toNum(r.get('Cantidad'))
        }))
    };
}

async function registrarActividad(idUsuario, idObra, tipo) {
    await neoRepo.registrarActividad(idUsuario, idObra, tipo);
    return { success: true };
}

async function porSimilitudIA(idObra) {
    const session = require('../config/database').getSession();
    try {
        const result = await session.run(
            `MATCH (o:Obra {id_obra: $idObra})-[r:SIMILAR_A]->(similar:Obra)
             WHERE similar.estado = 'Disponible'
             RETURN similar.id_obra AS idObra,
                    similar.nombre AS nombre,
                    similar.precio AS precio,
                    similar.fotografia AS fotografia,
                    r.score AS similitud
             ORDER BY r.score DESC
             LIMIT 5`,
            { idObra: parseInt(idObra) }
        );

        return result.records.map(r => ({
            idObra: neoRepo.toNum(r.get('idObra')),
            nombre: r.get('nombre'),
            precio: neoRepo.toNum(r.get('precio')),
            fotografia: r.get('fotografia') || '',
            similitud: Math.round(neoRepo.toNum(r.get('similitud')) * 100),
            label: getSimilitudLabel(Math.round(neoRepo.toNum(r.get('similitud')) * 100))
        }));
    } catch (err) {
        console.error('Error en similitud IA:', err);
        return [];
    } finally {
        await session.close();
    }
}

async function porActividad(idUsuario) {
    const generosPopulares = await neoRepo.findActivityGeneros(idUsuario);
    const precios = await neoRepo.findActivityPrices(idUsuario);

    const generos = generosPopulares.map(r => r.get('genero'));
    const precioAvg = precios[0]?.get('promedio') || 1000;
    const precioMin = Math.max(0, precioAvg * 0.5);
    const precioMax = precioAvg * 2;

    let recomendaciones = [];
    if (generos.length > 0) {
        const records = await neoRepo.findRecommendedByActivity(generos, precioMin, precioMax, idUsuario);
        recomendaciones = records.map(r => ({
            idObra: r.get('idObra').toNumber(),
            nombre: r.get('nombre'),
            precio: r.get('precio'),
            genero: r.get('genero')
        }));
    }

    return {
        preferencias: { generos, precioPromedio: Math.round(precioAvg), rango: [Math.round(precioMin), Math.round(precioMax)] },
        recomendaciones
    };
}

async function paraUsuario(idUsuario) {
    const userCheck = await neoRepo.findUserById(idUsuario);
    if (userCheck.length === 0) {
        const records = await neoRepo.findPopularObras();
        return {
            tipo: 'populares',
            obras: records.map(r => ({
                idObra: r.get('idObra').toNumber(),
                nombre: r.get('nombre'),
                precio: r.get('precio')
            }))
        };
    }
    const records = await neoRepo.findForUser(idUsuario);
    return {
        tipo: 'personalizadas',
        obras: records.map(r => ({
            idObra: r.get('idObra').toNumber(),
            nombre: r.get('nombre'),
            precio: r.get('precio'),
            genero: r.get('genero'),
            artista: r.get('artista')
        }))
    };
}

async function paraTi(idUsuario) {
    const recomendaciones = [];
    const idsYaVistos = new Set();

    const colaborativo = await neoRepo.findCollabForTi(idUsuario);
    for (const r of colaborativo) {
        const id = neoRepo.toNum(r.get('idObra'));
        if (!idsYaVistos.has(id)) {
            idsYaVistos.add(id);
            recomendaciones.push({
                idObra: id, nombre: r.get('nombre'),
                precio: neoRepo.toNum(r.get('precio')),
                fotografia: r.get('fotografia') || '',
                motivo: 'A otros también les gustó', fuente: 'colaborativo'
            });
        }
    }

    const mismoArtista = await neoRepo.findSameArtist(idUsuario);
    for (const r of mismoArtista) {
        const id = neoRepo.toNum(r.get('idObra'));
        if (!idsYaVistos.has(id) && recomendaciones.length < 8) {
            idsYaVistos.add(id);
            recomendaciones.push({
                idObra: id, nombre: r.get('nombre'),
                precio: neoRepo.toNum(r.get('precio')),
                fotografia: r.get('fotografia') || '',
                motivo: 'De ' + r.get('artista'), fuente: 'artista'
            });
        }
    }

    const mismoGenero = await neoRepo.findSameGenreForTi(idUsuario);
    for (const r of mismoGenero) {
        const id = neoRepo.toNum(r.get('idObra'));
        if (!idsYaVistos.has(id) && recomendaciones.length < 10) {
            idsYaVistos.add(id);
            recomendaciones.push({
                idObra: id, nombre: r.get('nombre'),
                precio: neoRepo.toNum(r.get('precio')),
                fotografia: r.get('fotografia') || '',
                motivo: 'Del género ' + r.get('genero'), fuente: 'genero'
            });
        }
    }

    return recomendaciones.slice(0, 10);
}

async function guestLogin(req) {
    await neoRepo.createGuestUser();
    req.session.usuario = {
        id_usuario: 9999, Nombre: 'Invitado',
        Email: 'guest@museo.com', Rol: 'comprador'
    };
    req.session.id_usuario = 9999;
}

async function obrasDestacadas() {
    const records = await neoRepo.findDestacadas();
    return records.map(r => ({
        idObra: neoRepo.toNum(r.get('idObra')),
        nombre: r.get('nombre'),
        precio: neoRepo.toNum(r.get('precio')),
        fotografia: r.get('fotografia') || '',
        autor: r.get('autor') || 'Anónimo',
        clicks: neoRepo.toNum(r.get('clicks'))
    }));
}

module.exports = {
    mismoGenero, colaborativo, personalizadas, artistasPopulares,
    generosPopulares, obrasPorGenero, estadisticas, registrarActividad,
    porSimilitudIA, porActividad, paraUsuario, paraTi, guestLogin,
    obrasDestacadas
};