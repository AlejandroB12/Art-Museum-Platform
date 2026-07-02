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
    return records.map(r => ({
        id_Artista: neoRepo.toNum(r.get('id_Artista')),
        Artista: r.get('Artista'),
        ObrasVendidas: neoRepo.toNum(r.get('ObrasVendidas')),
        CompradoresUnicos: neoRepo.toNum(r.get('CompradoresUnicos'))
    }));
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
        Precio: r.get('Precio')
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
    const obraRef = await neoRepo.findSimilarIA(idObra);
    if (obraRef.length === 0) return [];

    const embeddingRef = obraRef[0].get('embedding');
    let tagsRef = [];
    try { tagsRef = JSON.parse(obraRef[0].get('tagsClip') || '[]'); } catch (e) { }
    const palabrasRef = new Set(tagsRef.map(t => t.tag));

    const infoObra = await neoRepo.findObraInfo(idObra);
    const generosRef = infoObra[0]?.get('generos') || [];
    const artistasRef = (infoObra[0]?.get('artistas') || []).map(a => neoRepo.toNum(a));

    const result = await neoRepo.findAvailableWithEmbedding(idObra);

    const puntuadas = result.map(r => {
        const similitudBase = cosineSimilarity(embeddingRef, r.get('embedding'));
        let tagsObra = [];
        try { tagsObra = JSON.parse(r.get('tagsClip') || '[]'); } catch (e) { }
        const palabrasObra = new Set(tagsObra.map(t => t.tag));
        const interseccion = [...palabrasRef].filter(t => palabrasObra.has(t)).length;
        const bonusCLIP = palabrasRef.size > 0 ? interseccion / palabrasRef.size * 0.3 : 0;
        const generosObra = r.get('generos') || [];
        const artistasObra = (r.get('artistas') || []).map(a => neoRepo.toNum(a));
        const bonusGenero = generosObra.some(g => generosRef.includes(g)) ? 0.15 : 0;
        const bonusAutor = artistasObra.some(a => artistasRef.includes(a)) ? 0.25 : 0;
        const puntuacionFinal = Math.min(1, similitudBase + bonusCLIP + bonusGenero + bonusAutor);
        return {
            idObra: neoRepo.toNum(r.get('idObra')),
            nombre: r.get('nombre'),
            precio: neoRepo.toNum(r.get('precio')),
            fotografia: r.get('fotografia') || '',
            similitud: Math.round(puntuacionFinal * 100)
        };
    });

    return puntuadas.sort((a, b) => b.similitud - a.similitud).slice(0, 5).map(o => ({
        ...o,
        label: getSimilitudLabel(o.similitud)
    }));
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

async function buscar(q) {
    if (!q || q.length < 2) return [];
    const palabras = q.split(/\s+/).filter(p => p.length > 0);
    let cypherQuery, params;

    if (palabras.length === 1) {
        cypherQuery = `
            MATCH (o:Obra) WHERE o.estado = 'Disponible'
            AND (toLower(o.nombre) CONTAINS toLower($q)
                 OR EXISTS { MATCH (o)<-[:CREO]-(a:Artista) WHERE toLower(a.nombre) CONTAINS toLower($q) OR toLower(a.apellido) CONTAINS toLower($q) })
            OPTIONAL MATCH (o)<-[:CREO]-(a:Artista)
            RETURN o.id_obra AS idObra, o.nombre AS nombre, o.precio AS precio,
                   o.fotografia AS fotografia, a.nombre + ' ' + a.apellido AS autor
            ORDER BY o.nombre LIMIT 10`;
        params = { q };
    } else {
        const condiciones = palabras.map((p, i) => `
            (toLower(o.nombre) CONTAINS toLower($p${i})
             OR EXISTS { MATCH (o)<-[:CREO]-(a:Artista) WHERE toLower(a.nombre) CONTAINS toLower($p${i}) OR toLower(a.apellido) CONTAINS toLower($p${i}) })`).join(' AND ');
        cypherQuery = `
            MATCH (o:Obra) WHERE o.estado = 'Disponible' AND (${condiciones})
            OPTIONAL MATCH (o)<-[:CREO]-(a:Artista)
            RETURN o.id_obra AS idObra, o.nombre AS nombre, o.precio AS precio,
                   o.fotografia AS fotografia, a.nombre + ' ' + a.apellido AS autor
            ORDER BY o.nombre LIMIT 10`;
        params = {};
        palabras.forEach((p, i) => params[`p${i}`] = p);
    }

    const neoResult = await neoRepo.buscar(cypherQuery, params);
    let resultados = neoResult.map(r => ({
        id_Obra: neoRepo.toNum(r.get('idObra')),
        Nombre: r.get('nombre'),
        Precio: neoRepo.toNum(r.get('precio')),
        imagen_url: r.get('fotografia') || '',
        AutorNombre: r.get('autor') || '',
        PrecioFormateado: '$' + Number(neoRepo.toNum(r.get('precio'))).toLocaleString(),
        tipo: 'exacta'
    }));

    if (resultados.length === 0) {
        const { pipeline } = require('@xenova/transformers');
        const embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
        const embResult = await embedder(q, { pooling: 'mean', normalize: true });
        const queryEmb = Array.from(embResult.data);

        const obrasEmb = await neoRepo.findAvailableWithEmbedding(0, 200);
        resultados = obrasEmb.map(r => ({
            id_Obra: neoRepo.toNum(r.get('idObra')),
            Nombre: r.get('nombre'),
            Precio: neoRepo.toNum(r.get('precio')),
            imagen_url: r.get('fotografia') || '',
            PrecioFormateado: '$' + Number(neoRepo.toNum(r.get('precio'))).toLocaleString(),
            similitud: Math.round(cosineSimilarity(queryEmb, r.get('embedding')) * 100),
            tipo: 'semántica'
        }))
            .filter(r => r.similitud > 40)
            .sort((a, b) => b.similitud - a.similitud)
            .slice(0, 10);
    }

    return resultados;
}

async function buscarVisual(q) {
    if (!q || q.length < 2) return [];
    const result = await neoRepo.buscarVisual(q);
    return result.map(r => {
        let tags = [];
        try { tags = JSON.parse(r.get('tagsClip') || '[]'); } catch (e) { }
        const tagMatch = tags.find(t => t.tag.includes(q.toLowerCase()));
        return {
            id_Obra: neoRepo.toNum(r.get('idObra')),
            Nombre: r.get('nombre'),
            Precio: neoRepo.toNum(r.get('precio')),
            imagen_url: r.get('fotografia') || '',
            AutorNombre: r.get('autor') || '',
            PrecioFormateado: '$' + Number(neoRepo.toNum(r.get('precio'))).toLocaleString(),
            score: tagMatch ? tagMatch.score : 0,
            tipo: 'visual'
        };
    }).sort((a, b) => b.score - a.score);
}

module.exports = {
    mismoGenero, colaborativo, personalizadas, artistasPopulares,
    generosPopulares, obrasPorGenero, estadisticas, registrarActividad,
    porSimilitudIA, porActividad, paraUsuario, paraTi, guestLogin,
    obrasDestacadas, buscar, buscarVisual
};
