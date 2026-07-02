const { getSession } = require('../config/database');
const neo4j = require('neo4j-driver');

function toNum(value) {
    if (value == null) return null;
    if (typeof value === 'object' && value.toNumber) return value.toNumber();
    return Number(value);
}

async function findSameGenre(idUsuario) {
    const session = getSession();
    try {
        const result = await session.run(`
            MATCH (u:Usuario {id_usuario: $idUsuario})-[:VIO|COMPRO]->(o:Obra)-[:PERTENECE_A_EPOCA]->(e:Epoca)
            MATCH (o2:Obra)-[:PERTENECE_A_EPOCA]->(e)
            WHERE o2.id_obra <> o.id_obra AND o2.estado = 'Disponible'
            RETURN DISTINCT o2.id_obra AS id_Obra, o2.nombre AS Nombre, o2.precio AS Precio, e.nombre AS Genero
            LIMIT 10
        `, { idUsuario: parseInt(idUsuario) });
        return result.records;
    } finally { await session.close(); }
}

async function findCollaborative(idUsuario) {
    const session = getSession();
    try {
        const result = await session.run(`
            MATCH (u:Usuario {id_usuario: $idUsuario})-[:VIO|COMPRO]->(o:Obra)
            MATCH (o)<-[:VIO|COMPRO]-(otros:Usuario)-[:VIO|COMPRO]->(rec:Obra)
            WHERE rec.id_obra <> o.id_obra AND rec.estado = 'Disponible'
            RETURN rec.id_obra AS id_Obra, rec.nombre AS Nombre, rec.precio AS Precio,
                   COUNT(DISTINCT otros) AS CantidadCoincidencias
            ORDER BY CantidadCoincidencias DESC LIMIT 10
        `, { idUsuario: parseInt(idUsuario) });
        return result.records;
    } finally { await session.close(); }
}

async function findPersonalized(idUsuario) {
    const session = getSession();
    try {
        const result = await session.run(`
            MATCH (u:Usuario {id_usuario: $idUsuario})-[:VIO|COMPRO]->(o:Obra)
            MATCH (o)-[:PERTENECE_A_EPOCA]->(e:Epoca)
            MATCH (rec:Obra)-[:PERTENECE_A_EPOCA]->(e)
            WHERE rec.id_obra <> o.id_obra AND rec.estado = 'Disponible'
            RETURN DISTINCT rec.id_obra AS id_Obra, rec.nombre AS Nombre, rec.precio AS Precio, e.nombre AS Genero
            ORDER BY e.nombre LIMIT 10
        `, { idUsuario: parseInt(idUsuario) });
        return result.records;
    } finally { await session.close(); }
}

async function findPopularArtists() {
    const session = getSession();
    try {
        const result = await session.run(`
            MATCH (a:Artista)<-[:CREO]-(o:Obra)<-[:COMPRO]-(:Usuario)
            RETURN a.id_artista AS id_Artista, a.nombre + ' ' + a.apellido AS Artista,
                   COUNT(o) AS ObrasVendidas, COUNT(DISTINCT o) AS CompradoresUnicos
            ORDER BY ObrasVendidas DESC LIMIT 10
        `);
        return result.records;
    } finally { await session.close(); }
}

async function findPopularGenres() {
    const session = getSession();
    try {
        const result = await session.run(`
            MATCH (o:Obra)<-[:COMPRO]-(:Usuario)
            WITH o.genero AS Genero, COUNT(o) AS ObrasVendidas,
                 COUNT(DISTINCT o) AS CompradoresDistintos, AVG(o.precio) AS PrecioPromedio
            RETURN Genero, ObrasVendidas, CompradoresDistintos, PrecioPromedio,
                   ObrasVendidas * PrecioPromedio AS IngresoTotal
            ORDER BY IngresoTotal DESC
        `);
        return result.records;
    } finally { await session.close(); }
}

async function findObrasByGenero(genero) {
    const session = getSession();
    try {
        const result = await session.run(`
            MATCH (o:Obra {genero: $genero})
            RETURN o.id_obra AS id_Obra, o.nombre AS Nombre, o.precio AS Precio
            LIMIT 10
        `, { genero });
        return result.records;
    } finally { await session.close(); }
}

async function getGraphStats() {
    const session = getSession();
    try {
        const nodos = await session.run("MATCH (n) RETURN labels(n)[0] AS Tipo, COUNT(n) AS Cantidad");
        const relaciones = await session.run("MATCH ()-[r]->() RETURN type(r) AS Tipo, COUNT(r) AS Cantidad");
        return { nodos: nodos.records, relaciones: relaciones.records };
    } finally { await session.close(); }
}

async function findSimilarIA(idObra) {
    const session = getSession();
    try {
        const result = await session.run(
            "MATCH (o:Obra {id_obra: $idObra}) RETURN o.embedding AS embedding, o.tagsClip AS tagsClip",
            { idObra: parseInt(idObra) }
        );
        return result.records;
    } finally { await session.close(); }
}

async function findObraInfo(idObra) {
    const session = getSession();
    try {
        const result = await session.run(`
            MATCH (o:Obra {id_obra: $idObra})
            OPTIONAL MATCH (o)-[:PERTENECE_A_EPOCA]->(e:Epoca)
            OPTIONAL MATCH (o)<-[:CREO]-(a:Artista)
            RETURN COLLECT(DISTINCT e.nombre) AS generos, COLLECT(DISTINCT a.id_artista) AS artistas
        `, { idObra: parseInt(idObra) });
        return result.records;
    } finally { await session.close(); }
}

async function findAvailableWithEmbedding(idObra, limit = 50) {
    const session = getSession();
    try {
        const result = await session.run(`
            MATCH (o:Obra)
            WHERE o.id_obra <> $idObra AND o.estado = 'Disponible' AND o.embedding IS NOT NULL
            RETURN o.id_obra AS idObra, o.nombre AS nombre, o.precio AS precio,
                   o.fotografia AS fotografia, o.embedding AS embedding, o.tagsClip AS tagsClip,
                   o.genero AS genero, o.artistas AS artistas
            LIMIT $limit
        `, { idObra: parseInt(idObra), limit: neo4j.int(limit) });
        return result.records;
    } finally { await session.close(); }
}

async function findActivityGeneros(idUsuario) {
    const session = getSession();
    try {
        const result = await session.run(`
            MATCH (u:Usuario {id_usuario: $idUsuario})-[:VIO|COMPRO]->(o:Obra)
            RETURN o.genero AS genero, COUNT(*) AS peso
            ORDER BY peso DESC LIMIT 3
        `, { idUsuario: parseInt(idUsuario) });
        return result.records;
    } finally { await session.close(); }
}

async function findActivityPrices(idUsuario) {
    const session = getSession();
    try {
        const result = await session.run(`
            MATCH (u:Usuario {id_usuario: $idUsuario})-[:VIO|COMPRO]->(o:Obra)
            RETURN AVG(o.precio) AS promedio
        `, { idUsuario: parseInt(idUsuario) });
        return result.records;
    } finally { await session.close(); }
}

async function findRecommendedByActivity(generos, precioMin, precioMax, idUsuario) {
    const session = getSession();
    try {
        const result = await session.run(`
            MATCH (o:Obra)
            WHERE o.genero IN $generos AND o.precio >= $precioMin AND o.precio <= $precioMax
              AND o.id_obra <> $idUsuario AND o.estado = 'Disponible'
            RETURN o.id_obra AS idObra, o.nombre AS nombre, o.precio AS precio, o.genero AS genero
            LIMIT 10
        `, { generos, precioMin: neo4j.int(precioMin), precioMax: neo4j.int(precioMax), idUsuario: parseInt(idUsuario) });
        return result.records;
    } finally { await session.close(); }
}

async function findUserById(idUsuario) {
    const session = getSession();
    try {
        const result = await session.run(
            "MATCH (u:Usuario {id_usuario: $idUsuario}) RETURN u",
            { idUsuario: parseInt(idUsuario) }
        );
        return result.records;
    } finally { await session.close(); }
}

async function findPopularObras() {
    const session = getSession();
    try {
        const result = await session.run(`
            MATCH (o:Obra) WHERE o.estado = 'Disponible'
            RETURN o.id_obra AS idObra, o.nombre AS nombre, o.precio AS precio
            ORDER BY o.precio DESC LIMIT 10
        `);
        return result.records;
    } finally { await session.close(); }
}

async function findForUser(idUsuario) {
    const session = getSession();
    try {
        const result = await session.run(`
            MATCH (u:Usuario {id_usuario: $idUsuario})-[:VIO|COMPRO]->(o:Obra)
            MATCH (o)-[:PERTENECE_A_EPOCA]->(e:Epoca)
            MATCH (rec:Obra)-[:PERTENECE_A_EPOCA]->(e)
            WHERE NOT EXISTS { MATCH (u)-[:VIO|COMPRO]->(rec) }
              AND rec.estado = 'Disponible'
            RETURN DISTINCT rec.id_obra AS idObra, rec.nombre AS nombre,
                   rec.precio AS precio, e.nombre AS genero
            LIMIT 10
        `, { idUsuario: parseInt(idUsuario) });
        return result.records;
    } finally { await session.close(); }
}

async function findCollabForTi(idUsuario) {
    const session = getSession();
    try {
        const result = await session.run(`
            MATCH (u:Usuario {id_usuario: $idUsuario})-[:VIO|COMPRO]->(o:Obra)
            MATCH (o)<-[:VIO|COMPRO]-(otros:Usuario)-[:VIO|COMPRO]->(rec:Obra)
            WHERE NOT EXISTS { MATCH (u)-[:VIO|COMPRO]->(rec) }
              AND rec.estado = 'Disponible'
            RETURN rec.id_obra AS idObra, rec.nombre AS nombre,
                   rec.precio AS precio, rec.fotografia AS fotografia,
                   COUNT(DISTINCT otros) AS peso
            ORDER BY peso DESC LIMIT 15
        `, { idUsuario: parseInt(idUsuario) });
        return result.records;
    } finally { await session.close(); }
}

async function findSameArtist(idUsuario) {
    const session = getSession();
    try {
        const result = await session.run(`
            MATCH (u:Usuario {id_usuario: $idUsuario})-[:VIO|COMPRO]->(o:Obra)<-[:CREO]-(a:Artista)
            MATCH (a)-[:CREO]->(rec:Obra)
            WHERE NOT EXISTS { MATCH (u)-[:VIO|COMPRO]->(rec) }
              AND rec.estado = 'Disponible'
            RETURN DISTINCT rec.id_obra AS idObra, rec.nombre AS nombre,
                   rec.precio AS precio, rec.fotografia AS fotografia,
                   a.nombre + ' ' + a.apellido AS artista
            LIMIT 5
        `, { idUsuario: parseInt(idUsuario) });
        return result.records;
    } finally { await session.close(); }
}

async function findSameGenreForTi(idUsuario) {
    const session = getSession();
    try {
        const result = await session.run(`
            MATCH (u:Usuario {id_usuario: $idUsuario})-[:VIO|COMPRO]->(o:Obra)
            MATCH (rec:Obra {genero: o.genero})
            WHERE NOT EXISTS { MATCH (u)-[:VIO|COMPRO]->(rec) }
              AND rec.estado = 'Disponible'
            RETURN DISTINCT rec.id_obra AS idObra, rec.nombre AS nombre,
                   rec.precio AS precio, rec.fotografia AS fotografia,
                   rec.genero AS genero
            LIMIT 5
        `, { idUsuario: parseInt(idUsuario) });
        return result.records;
    } finally { await session.close(); }
}

async function findDestacadas() {
    const session = getSession();
    try {
        const result = await session.run(`
            MATCH (o:Obra)
            WHERE o.estado = 'Disponible'
            OPTIONAL MATCH (o)<-[:CREO]-(a:Artista)
            RETURN o.id_obra AS idObra, o.nombre AS nombre, o.precio AS precio,
                   o.fotografia AS fotografia,
                   COALESCE(a.nombre + ' ' + a.apellido, 'Anónimo') AS autor,
                   o.clicks AS clicks
            ORDER BY o.precio DESC LIMIT 10
        `);
        return result.records;
    } finally { await session.close(); }
}

async function buscar(cypherQuery, params) {
    const session = getSession();
    try {
        const result = await session.run(cypherQuery, params);
        return result.records;
    } finally { await session.close(); }
}

async function buscarVisual(q) {
    const session = getSession();
    try {
        const result = await session.run(`
            MATCH (o:Obra) WHERE o.estado = 'Disponible'
            RETURN o.id_obra AS idObra, o.nombre AS nombre, o.precio AS precio,
                   o.fotografia AS fotografia, o.tagsClip AS tagsClip
            LIMIT 50
        `);
        return result.records;
    } finally { await session.close(); }
}

async function hasUserActivity(idUsuario) {
    const session = getSession();
    try {
        const result = await session.run(
            "MATCH (u:Usuario {id_usuario: $idUsuario})-[:VIO|COMPRO]->() RETURN COUNT(*) AS total",
            { idUsuario: parseInt(idUsuario) }
        );
        return result.records[0]?.get('total').toNumber() > 0;
    } finally { await session.close(); }
}

async function registrarActividad(idUsuario, idObra, tipo) {
    const session = getSession();
    try {
        await session.run(`
            MERGE (u:Usuario {id_usuario: $idUsuario})
            MERGE (o:Obra {id_obra: $idObra})
            MERGE (u)-[r:${tipo === 'compra' ? 'COMPRO' : 'VIO'}]->(o)
            ON CREATE SET r.fecha = datetime()
        `, { idUsuario: parseInt(idUsuario), idObra: parseInt(idObra) });
    } finally { await session.close(); }
}

async function createGuestUser() {
    const session = getSession();
    try {
        await session.run("MERGE (u:Usuario {id_usuario: 9999})");
    } finally { await session.close(); }
}

module.exports = {
    toNum, findSameGenre, findCollaborative, findPersonalized,
    findPopularArtists, findPopularGenres, findObrasByGenero, getGraphStats,
    findSimilarIA, findObraInfo, findAvailableWithEmbedding,
    findActivityGeneros, findActivityPrices, findRecommendedByActivity,
    findUserById, findPopularObras, findForUser, findCollabForTi,
    findSameArtist, findSameGenreForTi, findDestacadas, buscar, buscarVisual,
    hasUserActivity, registrarActividad,
    createGuestUser
};
