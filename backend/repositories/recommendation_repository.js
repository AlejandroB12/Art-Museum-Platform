const { getSession } = require('../../config/database');
const toNum = (v) => v != null ? Number(v) : 0;

async function runQuery(cypher, params = {}) {
    const session = getSession();
    try {
        const result = await session.run(cypher, params);
        return result.records;
    } finally {
        await session.close();
    }
}

async function findSameGenre(userId, limit = 10) {
    return runQuery(`
        MATCH (c:Comprador {id_usuario: $idUsuario})-[:COMPRO]->(:Obra)<-[:CREO]-(:Artista)-[:TRABAJA_EN]->(g:Genero)
        MATCH (g)<-[:TRABAJA_EN]-(:Artista)-[:CREO]->(recomendada:Obra)
        WHERE NOT EXISTS { MATCH (c)-[:COMPRO]->(recomendada) }
        AND recomendada.estado = 'Disponible'
        RETURN DISTINCT recomendada.id_obra AS id_Obra,
               recomendada.nombre AS Nombre,
               recomendada.precio AS Precio,
               g.nombre AS Genero
        ORDER BY recomendada.precio DESC
        LIMIT $limit
    `, { idUsuario: parseInt(userId), limit });
}

async function findCollaborative(userId, limit = 10) {
    return runQuery(`
        MATCH (c:Comprador {id_usuario: $idUsuario})-[:COMPRO]->(o:Obra)
        MATCH (c2:Comprador)-[:COMPRO]->(o)
        MATCH (c2)-[:COMPRO]->(recomendada:Obra)
        WHERE NOT EXISTS { MATCH (c)-[:COMPRO]->(recomendada) }
        AND recomendada.estado = 'Disponible'
        RETURN recomendada.id_obra AS id_Obra,
               recomendada.nombre AS Nombre,
               recomendada.precio AS Precio,
               COUNT(DISTINCT c2) AS CantidadCoincidencias
        ORDER BY CantidadCoincidencias DESC
        LIMIT $limit
    `, { idUsuario: parseInt(userId), limit });
}

async function findPersonalized(userId, limit = 10) {
    return runQuery(`
        MATCH (c:Comprador {id_usuario: $idUsuario})-[:COMPRO]->(obraComprada:Obra)
        WITH c, obraComprada
        MATCH (obraComprada)<-[:CREO]-(artistaFavorito:Artista)
        WITH c, COLLECT(DISTINCT artistaFavorito) AS artistasPreferidos
        UNWIND artistasPreferidos AS artista
        MATCH (artista)-[:TRABAJA_EN]->(g:Genero)
        WITH c, COLLECT(DISTINCT g) AS generosPreferidos
        UNWIND generosPreferidos AS genero
        MATCH (genero)<-[:TRABAJA_EN]-(:Artista)-[:CREO]->(recomendada:Obra)
        WHERE NOT EXISTS { MATCH (c)-[:COMPRO]->(recomendada) }
        AND recomendada.estado = 'Disponible'
        RETURN DISTINCT recomendada.id_obra AS id_Obra,
               recomendada.nombre AS Nombre,
               recomendada.precio AS Precio,
               genero.nombre AS Genero
        ORDER BY recomendada.precio DESC
        LIMIT $limit
    `, { idUsuario: parseInt(userId), limit });
}

async function findPopularArtists(limit = 10) {
    return runQuery(`
        MATCH (c:Comprador)-[:COMPRO]->(:Obra)<-[:CREO]-(a:Artista)
        RETURN a.id_artista AS id_Artista,
               a.nombre + ' ' + a.apellido AS Artista,
               COUNT(*) AS ObrasVendidas,
               COUNT(DISTINCT c) AS CompradoresUnicos
        ORDER BY ObrasVendidas DESC
        LIMIT $limit
    `, { limit });
}

async function findPopularGenres() {
    return runQuery(`
        MATCH (c:Comprador)-[:COMPRO]->(o:Obra)<-[:CREO]-(:Artista)-[:TRABAJA_EN]->(g:Genero)
        RETURN g.nombre AS Genero,
               COUNT(o) AS ObrasVendidas,
               COUNT(DISTINCT c) AS CompradoresDistintos,
               ROUND(AVG(o.precio), 2) AS PrecioPromedio,
               ROUND(SUM(o.precio), 2) AS IngresoTotal
        ORDER BY ObrasVendidas DESC
    `);
}

async function findObrasByGenero(genero, limit = 6) {
    return runQuery(`
        MATCH (g:Genero {nombre: $genero})<-[:TRABAJA_EN]-(:Artista)-[:CREO]->(o:Obra)
        WHERE o.estado = 'Disponible'
        RETURN o.id_obra AS id_Obra, o.nombre AS Nombre, o.precio AS Precio
        ORDER BY o.precio ASC
        LIMIT $limit
    `, { genero, limit });
}

async function getGraphStats() {
    const nodos = await runQuery(`
        MATCH (n) RETURN labels(n) AS Tipo, count(n) AS Cantidad ORDER BY Tipo
    `);
    const relaciones = await runQuery(`
        MATCH ()-[r]->() RETURN type(r) AS Tipo, count(r) AS Cantidad ORDER BY Tipo
    `);
    return { nodos, relaciones };
}

async function registrarActividad(idUsuario, idObra, tipo) {
    return runQuery(`
        MATCH (c:Comprador {id_usuario: $idUsuario})
        MATCH (o:Obra {id_obra: $idObra})
        MERGE (c)-[r:INTERACTUO]->(o)
        SET r.tipo = $tipo, r.timestamp = datetime()
        RETURN r
    `, { idUsuario: toNum(idUsuario), idObra: toNum(idObra), tipo });
}

async function findSimilarIA(idObra, limit = 200) {
    return runQuery(`
        MATCH (o:Obra {id_obra: $idObra})
        WHERE o.embedding IS NOT NULL
        RETURN o.embedding AS embedding, o.tagsClip AS tagsClip
    `, { idObra: toNum(idObra) });
}

async function findObraInfo(idObra) {
    return runQuery(`
        MATCH (o:Obra {id_obra: $idObra})
        OPTIONAL MATCH (o)<-[:CREO]-(a:Artista)-[:TRABAJA_EN]->(g:Genero)
        RETURN collect(DISTINCT g.nombre) AS generos,
               collect(DISTINCT a.id_artista) AS artistas
    `, { idObra: toNum(idObra) });
}

async function findAvailableWithEmbedding(excludeId, limit = 200) {
    return runQuery(`
        MATCH (o:Obra)
        OPTIONAL MATCH (o)<-[:CREO]-(a:Artista)-[:TRABAJA_EN]->(g:Genero)
        WHERE o.estado = 'Disponible' AND o.embedding IS NOT NULL AND o.id_obra <> $excludeId
        RETURN o.id_obra AS idObra, o.nombre AS nombre, o.precio AS precio,
               o.fotografia AS fotografia, o.embedding AS embedding, o.tagsClip AS tagsClip,
               collect(DISTINCT g.nombre) AS generos, collect(DISTINCT a.id_artista) AS artistas
        LIMIT $limit
    `, { excludeId: toNum(excludeId), limit });
}

async function findActivityGeneros(userId) {
    return runQuery(`
        MATCH (c:Comprador {id_usuario: $idUsuario})-[r:INTERACTUO]->(o:Obra)
        MATCH (o)<-[:CREO]-(:Artista)-[:TRABAJA_EN]->(g:Genero)
        RETURN g.nombre AS genero, SUM(r.contador) AS total
        ORDER BY total DESC LIMIT 3
    `, { idUsuario: parseInt(userId) });
}

async function findActivityPrices(userId) {
    return runQuery(`
        MATCH (c:Comprador {id_usuario: $idUsuario})-[r:INTERACTUO]->(o:Obra)
        RETURN AVG(o.precio) AS promedio, MIN(o.precio) AS minimo, MAX(o.precio) AS maximo
    `, { idUsuario: parseInt(userId) });
}

async function findRecommendedByActivity(generos, precioMin, precioMax, userId, limit = 10) {
    return runQuery(`
        MATCH (g:Genero)<-[:TRABAJA_EN]-(:Artista)-[:CREO]->(o:Obra)
        WHERE g.nombre IN $generos AND o.estado = 'Disponible'
          AND o.precio >= $precioMin AND o.precio <= $precioMax
          AND NOT EXISTS { MATCH (:Comprador {id_usuario: $idUsuario})-[r:INTERACTUO]->(o) }
        RETURN DISTINCT o.id_obra AS idObra, o.nombre AS nombre,
               o.precio AS precio, g.nombre AS genero
        ORDER BY o.precio DESC LIMIT $limit
    `, { generos, precioMin, precioMax, idUsuario: parseInt(userId), limit });
}

async function findUserById(userId) {
    return runQuery(`MATCH (c:Comprador {id_usuario: $id}) RETURN c`, { id: parseInt(userId) });
}

async function findPopularObras(limit = 10) {
    return runQuery(`
        MATCH (c:Comprador)-[:COMPRO]->(o:Obra)
        WHERE o.estado = 'Disponible'
        RETURN DISTINCT o.id_obra AS idObra, o.nombre AS nombre,
               o.precio AS precio, COUNT(c) AS popularidad
        ORDER BY popularidad DESC LIMIT $limit
    `, { limit });
}

async function findForUser(userId, limit = 10) {
    return runQuery(`
        MATCH (c:Comprador {id_usuario: $idUsuario})-[:COMPRO]->(:Obra)<-[:CREO]-(a:Artista)-[:TRABAJA_EN]->(g:Genero)
        MATCH (g)<-[:TRABAJA_EN]-(:Artista)-[:CREO]->(recomendada:Obra)
        WHERE NOT EXISTS { MATCH (c)-[:COMPRO]->(recomendada) }
        AND recomendada.estado = 'Disponible'
        RETURN DISTINCT recomendada.id_obra AS idObra, recomendada.nombre AS nombre,
               recomendada.precio AS precio, g.nombre AS genero,
               a.nombre + ' ' + a.apellido AS artista
        ORDER BY recomendada.precio DESC LIMIT $limit
    `, { idUsuario: parseInt(userId), limit });
}

async function findCollabForTi(userId, limit = 4) {
    return runQuery(`
        MATCH (c:Comprador {id_usuario: $idUsuario})-[:INTERACTUO|COMPRO]->(o:Obra)
        MATCH (c2:Comprador)-[:INTERACTUO|COMPRO]->(o)
        WHERE c2.id_usuario <> $idUsuario
        MATCH (c2)-[:INTERACTUO|COMPRO]->(recomendada:Obra)
        WHERE recomendada.estado = 'Disponible'
          AND NOT EXISTS { MATCH (:Comprador {id_usuario: $idUsuario})-[:INTERACTUO|COMPRO]->(recomendada) }
        RETURN recomendada.id_obra AS idObra, recomendada.nombre AS nombre,
               recomendada.precio AS precio, recomendada.fotografia AS fotografia,
               COUNT(DISTINCT c2) AS afinidad
        ORDER BY afinidad DESC LIMIT $limit
    `, { idUsuario: toNum(userId), limit });
}

async function findSameArtist(userId, limit = 3) {
    return runQuery(`
        MATCH (c:Comprador {id_usuario: $idUsuario})-[:INTERACTUO|COMPRO]->(:Obra)<-[:CREO]-(a:Artista)
        MATCH (a)-[:CREO]->(recomendada:Obra)
        WHERE recomendada.estado = 'Disponible'
          AND NOT EXISTS { MATCH (c)-[:INTERACTUO|COMPRO]->(recomendada) }
        RETURN DISTINCT recomendada.id_obra AS idObra, recomendada.nombre AS nombre,
               recomendada.precio AS precio, recomendada.fotografia AS fotografia,
               a.nombre + ' ' + a.apellido AS artista
        ORDER BY recomendada.precio DESC LIMIT $limit
    `, { idUsuario: toNum(userId), limit });
}

async function findSameGenreForTi(userId, limit = 3) {
    return runQuery(`
        MATCH (c:Comprador {id_usuario: $idUsuario})-[:INTERACTUO|COMPRO]->(:Obra)<-[:CREO]-(:Artista)-[:TRABAJA_EN]->(g:Genero)
        MATCH (g)<-[:TRABAJA_EN]-(:Artista)-[:CREO]->(recomendada:Obra)
        WHERE recomendada.estado = 'Disponible'
          AND NOT EXISTS { MATCH (c)-[:INTERACTUO|COMPRO]->(recomendada) }
        RETURN DISTINCT recomendada.id_obra AS idObra, recomendada.nombre AS nombre,
               recomendada.precio AS precio, recomendada.fotografia AS fotografia,
               g.nombre AS genero
        ORDER BY recomendada.precio DESC LIMIT $limit
    `, { idUsuario: toNum(userId), limit });
}

async function createGuestUser() {
    return runQuery(`
        MERGE (c:Comprador {id_usuario: 9999})
        SET c.nombre = 'Invitado', c.apellido = 'Prueba', c.email = 'guest@museo.com'
        RETURN c
    `);
}

async function findDestacadas() {
    return runQuery(`
        MATCH (o:Obra) WHERE o.estado = 'Disponible'
        OPTIONAL MATCH (c:Comprador)-[r:INTERACTUO]->(o)
        WITH o, COUNT(r) AS clicks ORDER BY clicks DESC
        OPTIONAL MATCH (o)<-[:CREO]-(a:Artista)
        RETURN o.id_obra AS idObra, o.nombre AS nombre, o.precio AS precio,
               o.fotografia AS fotografia, a.nombre + ' ' + a.apellido AS autor, clicks
    `);
}

async function buscar(query, params = {}) {
    return runQuery(query, params);
}

async function buscarVisual(query) {
    return runQuery(`
        MATCH (o:Obra)
        WHERE o.estado = 'Disponible' AND o.tagsClip IS NOT NULL
        AND toLower(o.tagsClip) CONTAINS $query
        OPTIONAL MATCH (o)<-[:CREO]-(a:Artista)
        RETURN o.id_obra AS idObra, o.nombre AS nombre, o.precio AS precio,
               o.fotografia AS fotografia, o.tagsClip AS tagsClip,
               a.nombre + ' ' + a.apellido AS autor
        LIMIT 15
    `, { query: query.toLowerCase() });
}

async function createCompraRelation(compradorId, obraId) {
    const session = getSession();
    try {
        await session.run(
            `MERGE (c:Comprador {id_usuario: $compradorId})
             MERGE (o:Obra {id_obra: $obraId})
             MERGE (c)-[:COMPRO {fecha: datetime()}]->(o)`,
            { compradorId: parseInt(compradorId), obraId: parseInt(obraId) }
        );
    } finally {
        await session.close();
    }
}

module.exports = {
    toNum, runQuery, findSameGenre, findCollaborative, findPersonalized,
    findPopularArtists, findPopularGenres, findObrasByGenero, getGraphStats,
    registrarActividad, findSimilarIA, findObraInfo, findAvailableWithEmbedding,
    findActivityGeneros, findActivityPrices, findRecommendedByActivity,
    findUserById, findPopularObras, findForUser, findCollabForTi,
    findSameArtist, findSameGenreForTi, createGuestUser, findDestacadas,
    buscar, buscarVisual, createCompraRelation
};
