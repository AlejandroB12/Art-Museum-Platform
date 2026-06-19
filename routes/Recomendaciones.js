const express = require('express');
const router = express.Router();
const { getSession } = require('../config/neo4j');

router.get('/recomendaciones/mismo-genero/:idUsuario', async (req, res) => {
    const { idUsuario } = req.params;
    const session = getSession();
    try {
        const result = await session.run(`
            MATCH (c:Comprador {id_usuario: $idUsuario})-[:COMPRO]->(:Obra)<-[:CREO]-(:Artista)-[:TRABAJA_EN]->(g:Genero)
            MATCH (g)<-[:TRABAJA_EN]-(:Artista)-[:CREO]->(recomendada:Obra)
            WHERE NOT EXISTS {
                MATCH (c)-[:COMPRO]->(recomendada)
            }
            AND recomendada.estado = 'Disponible'
            RETURN DISTINCT recomendada.id_obra AS id_Obra,
                   recomendada.nombre AS Nombre,
                   recomendada.precio AS Precio,
                   g.nombre AS Genero
            ORDER BY recomendada.precio DESC
            LIMIT 10
        `, { idUsuario: parseInt(idUsuario) });
        res.json(result.records.map(r => ({
            id_Obra: r.get('id_Obra').toNumber(),
            Nombre: r.get('Nombre'),
            Precio: r.get('Precio'),
            Genero: r.get('Genero')
        })));
    } catch (err) {
        console.error('Error en recomendaciones mismo genero:', err);
        res.status(500).json({ error: err.message });
    } finally {
        await session.close();
    }
});

router.get('/recomendaciones/colaborativo/:idUsuario', async (req, res) => {
    const { idUsuario } = req.params;
    const session = getSession();
    try {
        const result = await session.run(`
            MATCH (c:Comprador {id_usuario: $idUsuario})-[:COMPRO]->(o:Obra)
            MATCH (c2:Comprador)-[:COMPRO]->(o)
            MATCH (c2)-[:COMPRO]->(recomendada:Obra)
            WHERE NOT EXISTS {
                MATCH (c)-[:COMPRO]->(recomendada)
            }
            AND recomendada.estado = 'Disponible'
            RETURN recomendada.id_obra AS id_Obra,
                   recomendada.nombre AS Nombre,
                   recomendada.precio AS Precio,
                   COUNT(DISTINCT c2) AS CantidadCoincidencias
            ORDER BY CantidadCoincidencias DESC
            LIMIT 10
        `, { idUsuario: parseInt(idUsuario) });
        res.json(result.records.map(r => ({
            id_Obra: r.get('id_Obra').toNumber(),
            Nombre: r.get('Nombre'),
            Precio: r.get('Precio'),
            CantidadCoincidencias: r.get('CantidadCoincidencias').toNumber()
        })));
    } catch (err) {
        console.error('Error en recomendaciones colaborativo:', err);
        res.status(500).json({ error: err.message });
    } finally {
        await session.close();
    }
});

router.get('/recomendaciones/personalizadas/:idUsuario', async (req, res) => {
    const { idUsuario } = req.params;
    const session = getSession();
    try {
        const result = await session.run(`
            MATCH (c:Comprador {id_usuario: $idUsuario})-[:COMPRO]->(obraComprada:Obra)
            WITH c, obraComprada
            MATCH (obraComprada)<-[:CREO]-(artistaFavorito:Artista)
            WITH c, COLLECT(DISTINCT artistaFavorito) AS artistasPreferidos
            UNWIND artistasPreferidos AS artista
            MATCH (artista)-[:TRABAJA_EN]->(g:Genero)
            WITH c, COLLECT(DISTINCT g) AS generosPreferidos
            UNWIND generosPreferidos AS genero
            MATCH (genero)<-[:TRABAJA_EN]-(:Artista)-[:CREO]->(recomendada:Obra)
            WHERE NOT EXISTS {
                MATCH (c)-[:COMPRO]->(recomendada)
            }
            AND recomendada.estado = 'Disponible'
            RETURN DISTINCT recomendada.id_obra AS id_Obra,
                   recomendada.nombre AS Nombre,
                   recomendada.precio AS Precio,
                   genero.nombre AS Genero
            ORDER BY recomendada.precio DESC
            LIMIT 10
        `, { idUsuario: parseInt(idUsuario) });
        res.json(result.records.map(r => ({
            id_Obra: r.get('id_Obra').toNumber(),
            Nombre: r.get('Nombre'),
            Precio: r.get('Precio'),
            Genero: r.get('Genero')
        })));
    } catch (err) {
        console.error('Error en recomendaciones personalizadas:', err);
        res.status(500).json({ error: err.message });
    } finally {
        await session.close();
    }
});

router.get('/recomendaciones/artistas-populares', async (req, res) => {
    const session = getSession();
    try {
        const result = await session.run(`
            MATCH (c:Comprador)-[:COMPRO]->(:Obra)<-[:CREO]-(a:Artista)
            RETURN a.id_artista AS id_Artista,
                   a.nombre + ' ' + a.apellido AS Artista,
                   COUNT(*) AS ObrasVendidas,
                   COUNT(DISTINCT c) AS CompradoresUnicos
            ORDER BY ObrasVendidas DESC
            LIMIT 10
        `);
        res.json(result.records.map(r => ({
            id_Artista: r.get('id_Artista').toNumber(),
            Artista: r.get('Artista'),
            ObrasVendidas: r.get('ObrasVendidas').toNumber(),
            CompradoresUnicos: r.get('CompradoresUnicos').toNumber()
        })));
    } catch (err) {
        console.error('Error en artistas populares:', err);
        res.status(500).json({ error: err.message });
    } finally {
        await session.close();
    }
});

router.get('/recomendaciones/generos-populares', async (req, res) => {
    const session = getSession();
    try {
        const result = await session.run(`
            MATCH (c:Comprador)-[:COMPRO]->(o:Obra)<-[:CREO]-(:Artista)-[:TRABAJA_EN]->(g:Genero)
            RETURN g.nombre AS Genero,
                   COUNT(o) AS ObrasVendidas,
                   COUNT(DISTINCT c) AS CompradoresDistintos,
                   ROUND(AVG(o.precio), 2) AS PrecioPromedio,
                   ROUND(SUM(o.precio), 2) AS IngresoTotal
            ORDER BY ObrasVendidas DESC
        `);
        res.json(result.records.map(r => ({
            Genero: r.get('Genero'),
            ObrasVendidas: r.get('ObrasVendidas').toNumber(),
            CompradoresDistintos: r.get('CompradoresDistintos').toNumber(),
            PrecioPromedio: r.get('PrecioPromedio'),
            IngresoTotal: r.get('IngresoTotal')
        })));
    } catch (err) {
        console.error('Error en generos populares:', err);
        res.status(500).json({ error: err.message });
    } finally {
        await session.close();
    }
});

router.get('/grafo/estadisticas', async (req, res) => {
    const session = getSession();
    try {
        const nodos = await session.run(`
            MATCH (n)
            RETURN labels(n) AS Tipo, count(n) AS Cantidad
            ORDER BY Tipo
        `);
        const relaciones = await session.run(`
            MATCH ()-[r]->()
            RETURN type(r) AS Tipo, count(r) AS Cantidad
            ORDER BY Tipo
        `);
        res.json({
            nodos: nodos.records.map(r => ({
                tipo: r.get('Tipo')[0],
                cantidad: r.get('Cantidad').toNumber()
            })),
            relaciones: relaciones.records.map(r => ({
                tipo: r.get('Tipo'),
                cantidad: r.get('Cantidad').toNumber()
            }))
        });
    } catch (err) {
        console.error('Error en estadisticas:', err);
        res.status(500).json({ error: err.message });
    } finally {
        await session.close();
    }
});

module.exports = router;
