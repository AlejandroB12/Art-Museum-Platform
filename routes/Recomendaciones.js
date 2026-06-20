const express = require('express');
const router = express.Router();
const { getSession } = require('../config/neo4j');

const toNum = (v) => v != null ? Number(v) : 0;

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
            id_Obra: toNum(r.get('id_Obra')),
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
            id_Obra: toNum(r.get('id_Obra')),
            Nombre: r.get('Nombre'),
            Precio: r.get('Precio'),
            CantidadCoincidencias: toNum(r.get('CantidadCoincidencias'))
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
            id_Obra: toNum(r.get('id_Obra')),
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
            id_Artista: toNum(r.get('id_Artista')),
            Artista: r.get('Artista'),
            ObrasVendidas: toNum(r.get('ObrasVendidas')),
            CompradoresUnicos: toNum(r.get('CompradoresUnicos'))
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
            ObrasVendidas: toNum(r.get('ObrasVendidas')),
            CompradoresDistintos: toNum(r.get('CompradoresDistintos')),
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

router.get('/recomendaciones/obras-por-genero/:genero', async (req, res) => {
    const { genero } = req.params;
    const session = getSession();
    try {
        const result = await session.run(`
            MATCH (g:Genero {nombre: $genero})<-[:TRABAJA_EN]-(:Artista)-[:CREO]->(o:Obra)
            WHERE o.estado = 'Disponible'
            RETURN o.id_obra AS id_Obra,
                   o.nombre AS Nombre,
                   o.precio AS Precio
            ORDER BY o.precio ASC
            LIMIT 6
        `, { genero });
        res.json(result.records.map(r => ({
            id_Obra: toNum(r.get('id_Obra')),
            Nombre: r.get('Nombre'),
            Precio: r.get('Precio')
        })));
    } catch (err) {
        console.error('Error en obras por genero:', err);
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
                cantidad: toNum(r.get('Cantidad'))
            })),
            relaciones: relaciones.records.map(r => ({
                tipo: r.get('Tipo'),
                cantidad: toNum(r.get('Cantidad'))
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
