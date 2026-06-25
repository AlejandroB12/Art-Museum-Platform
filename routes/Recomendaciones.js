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

        // Traducción de nombres técnicos a legibles
        const traducciones = {
            'CREO': 'Obras por artista',
            'PERTENECE_A_EPOCA': 'Obras por época',
            'SIMILAR_A': 'Obras similares detectadas',
            'TIENE_ESTILO': 'Obras por estilo',
            'TRABAJA_EN': 'Artistas por género',
            'USA_PALETA': 'Obras por paleta de color',
            'USA_TECNICA': 'Obras por técnica'
        };

        res.json({
            nodos: nodos.records.map(r => ({
                tipo: r.get('Tipo')[0],
                cantidad: toNum(r.get('Cantidad'))
            })),
            relaciones: relaciones.records.map(r => ({
                tipo: traducciones[r.get('Tipo')] || r.get('Tipo'),
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

// ==========================================
// REGISTRO DE ACTIVIDAD DEL USUARIO
// ==========================================

router.post('/actividad/registrar', async (req, res) => {
    const { idUsuario, idObra, tipo, duracion } = req.body;

    if (!idUsuario || !idObra || !tipo) {
        return res.status(400).json({ error: 'Faltan datos requeridos' });
    }

    const session = getSession();
    try {
        await session.run(
            `MATCH (c:Comprador {id_usuario: $idUsuario})
             MATCH (o:Obra {id_obra: $idObra})
             MERGE (c)-[r:INTERACTUO {tipo: $tipo}]->(o)
             SET r.timestamp = datetime(),
                 r.duracion = $duracion,
                 r.contador = COALESCE(r.contador, 0) + 1`,
            {
                idUsuario: parseInt(idUsuario),
                idObra: parseInt(idObra),
                tipo: tipo,
                duracion: duracion || 0
            }
        );
        res.json({ success: true });
    } catch (err) {
        console.error('Error registrando actividad:', err);
        res.status(500).json({ error: err.message });
    } finally {
        await session.close();
    }
});

// ==========================================
// RECOMENDACIÓN POR SIMILITUD IA (EMBEDDING)
// ==========================================

router.get('/recomendaciones/por-similitud-ia/:idObra', async (req, res) => {
    const { idObra } = req.params;
    const session = getSession();
    try {
        // 1. Obtener la obra de referencia con su embedding
        const obraRef = await session.run(
            `MATCH (o:Obra {id_obra: $idObra}) 
             WHERE o.embedding IS NOT NULL
             RETURN o.embedding AS embedding, o.nombre AS nombre`,
            { idObra: toNum(req.params.idObra) }
        );

        if (obraRef.records.length === 0) {
            return res.json([]);
        }

        const embeddingRef = obraRef.records[0].get('embedding');

        // 2. Obtener género y autores de la obra de referencia
        const infoObra = await session.run(
            `MATCH (o:Obra {id_obra: $idObra})
             OPTIONAL MATCH (o)<-[:CREO]-(a:Artista)-[:TRABAJA_EN]->(g:Genero)
             RETURN collect(DISTINCT g.nombre) AS generos, 
                    collect(DISTINCT a.id_artista) AS artistas`,
            { idObra: toNum(req.params.idObra) }
        );

        const generosRef = infoObra.records[0]?.get('generos') || [];
        const artistasRef = infoObra.records[0]?.get('artistas').map(a => toNum(a)) || [];

        // 3. Obtener todas las obras disponibles con embedding
        const result = await session.run(
            `MATCH (o:Obra)
             OPTIONAL MATCH (o)<-[:CREO]-(a:Artista)-[:TRABAJA_EN]->(g:Genero)
             WHERE o.estado = 'Disponible' 
               AND o.embedding IS NOT NULL
               AND o.id_obra <> $idObra
             RETURN o.id_obra AS idObra, 
                    o.nombre AS nombre, 
                    o.precio AS precio,
                    o.fotografia AS fotografia,
                    o.embedding AS embedding,
                    collect(DISTINCT g.nombre) AS generos,
                    collect(DISTINCT a.id_artista) AS artistas
             LIMIT 200`,
            { idObra: toNum(req.params.idObra) }
        );

        function cosineSimilarity(a, b) {
            let dot = 0, normA = 0, normB = 0;
            for (let i = 0; i < a.length; i++) {
                dot += a[i] * b[i];
                normA += a[i] * a[i];
                normB += b[i] * b[i];
            }
            return (normA === 0 || normB === 0) ? 0 : dot / (Math.sqrt(normA) * Math.sqrt(normB));
        }

        const puntuadas = result.records.map(r => {
            const similitudBase = cosineSimilarity(embeddingRef, r.get('embedding'));
            const generosObra = r.get('generos') || [];
            const artistasObra = (r.get('artistas') || []).map(a => toNum(a));

            // Bonus por mismo género
            const bonusGenero = generosObra.some(g => generosRef.includes(g)) ? 0.20 : 0;

            // Bonus por mismo autor
            const bonusAutor = artistasObra.some(a => artistasRef.includes(a)) ? 0.30 : 0;

            // Puntuación final (máximo 1.0)
            const puntuacionFinal = Math.min(1, similitudBase + bonusGenero + bonusAutor);

            return {
                idObra: toNum(r.get('idObra')),
                nombre: r.get('nombre'),
                precio: toNum(r.get('precio')),
                fotografia: r.get('fotografia') || '',
                similitud: Math.round(similitudBase * 100),
                puntuacionFinal: Math.round(puntuacionFinal * 100)
            };
        });

        // Ordenar por puntuación final y tomar los 5 mejores (sin umbral mínimo)
        const top5 = puntuadas
            .sort((a, b) => b.puntuacionFinal - a.puntuacionFinal)
            .slice(0, 5);

        res.json(top5);

    } catch (err) {
        console.error('Error en similitud IA:', err);
        res.status(500).json({ error: err.message });
    } finally {
        await session.close();
    }
});

// ==========================================
// RECOMENDACIÓN POR ACTIVIDAD DEL USUARIO
// ==========================================

router.get('/recomendaciones/por-actividad/:idUsuario', async (req, res) => {
    const { idUsuario } = req.params;
    const session = getSession();
    try {
        // Géneros más clickeados
        const generosPopulares = await session.run(
            `MATCH (c:Comprador {id_usuario: $idUsuario})-[r:INTERACTUO]->(o:Obra)
             MATCH (o)<-[:CREO]-(:Artista)-[:TRABAJA_EN]->(g:Genero)
             RETURN g.nombre AS genero, SUM(r.contador) AS total
             ORDER BY total DESC LIMIT 3`,
            { idUsuario: parseInt(idUsuario) }
        );

        // Rango de precio preferido
        const precios = await session.run(
            `MATCH (c:Comprador {id_usuario: $idUsuario})-[r:INTERACTUO]->(o:Obra)
             RETURN AVG(o.precio) AS promedio,
                    MIN(o.precio) AS minimo,
                    MAX(o.precio) AS maximo`,
            { idUsuario: parseInt(idUsuario) }
        );

        const generos = generosPopulares.records.map(r => r.get('genero'));
        const precioAvg = precios.records[0]?.get('promedio') || 1000;
        const precioMin = Math.max(0, precioAvg * 0.5);
        const precioMax = precioAvg * 2;

        let recomendaciones = [];

        if (generos.length > 0) {
            const result = await session.run(
                `MATCH (g:Genero)<-[:TRABAJA_EN]-(:Artista)-[:CREO]->(o:Obra)
                 WHERE g.nombre IN $generos
                   AND o.estado = 'Disponible'
                   AND o.precio >= $precioMin
                   AND o.precio <= $precioMax
                   AND NOT EXISTS {
                     MATCH (:Comprador {id_usuario: $idUsuario})-[r:INTERACTUO]->(o)
                   }
                 RETURN DISTINCT o.id_obra AS idObra,
                        o.nombre AS nombre,
                        o.precio AS precio,
                        g.nombre AS genero
                 ORDER BY o.precio DESC
                 LIMIT 10`,
                { generos, precioMin, precioMax, idUsuario: parseInt(idUsuario) }
            );
            recomendaciones = result.records.map(r => ({
                idObra: r.get('idObra').toNumber(),
                nombre: r.get('nombre'),
                precio: r.get('precio'),
                genero: r.get('genero')
            }));
        }

        res.json({
            preferencias: { generos, precioPromedio: Math.round(precioAvg), rango: [Math.round(precioMin), Math.round(precioMax)] },
            recomendaciones
        });

    } catch (err) {
        console.error('Error en recomendaciones por actividad:', err);
        res.status(500).json({ error: err.message });
    } finally {
        await session.close();
    }
});

// ==========================================
// RECOMENDACIONES PARA USUARIO (COMPLETO)
// ==========================================

router.get('/recomendaciones/para-usuario/:idUsuario', async (req, res) => {
    const { idUsuario } = req.params;
    const session = getSession();
    try {
        // Verificar si el usuario existe en el grafo
        const userCheck = await session.run(
            `MATCH (c:Comprador {id_usuario: $id}) RETURN c`,
            { id: parseInt(idUsuario) }
        );

        if (userCheck.records.length === 0) {
            // Usuario sin nodo en el grafo: devolver obras populares
            const populares = await session.run(
                `MATCH (c:Comprador)-[:COMPRO]->(o:Obra)
                 WHERE o.estado = 'Disponible'
                 RETURN DISTINCT o.id_obra AS idObra,
                        o.nombre AS nombre,
                        o.precio AS precio,
                        COUNT(c) AS popularidad
                 ORDER BY popularidad DESC LIMIT 10`
            );
            return res.json({
                tipo: 'populares',
                obras: populares.records.map(r => ({
                    idObra: r.get('idObra').toNumber(),
                    nombre: r.get('nombre'),
                    precio: r.get('precio')
                }))
            });
        }

        // Usuario con compras: recomendar por artista + género
        const result = await session.run(
            `MATCH (c:Comprador {id_usuario: $idUsuario})-[:COMPRO]->(:Obra)<-[:CREO]-(a:Artista)-[:TRABAJA_EN]->(g:Genero)
             MATCH (g)<-[:TRABAJA_EN]-(:Artista)-[:CREO]->(recomendada:Obra)
             WHERE NOT EXISTS { MATCH (c)-[:COMPRO]->(recomendada) }
               AND recomendada.estado = 'Disponible'
             RETURN DISTINCT recomendada.id_obra AS idObra,
                    recomendada.nombre AS nombre,
                    recomendada.precio AS precio,
                    g.nombre AS genero,
                    a.nombre + ' ' + a.apellido AS artista
             ORDER BY recomendada.precio DESC LIMIT 10`,
            { idUsuario: parseInt(idUsuario) }
        );

        res.json({
            tipo: 'personalizadas',
            obras: result.records.map(r => ({
                idObra: r.get('idObra').toNumber(),
                nombre: r.get('nombre'),
                precio: r.get('precio'),
                genero: r.get('genero'),
                artista: r.get('artista')
            }))
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        await session.close();
    }
});

// ==========================================
// RECOMENDACIONES UNIFICADAS PARA EL USUARIO
// ==========================================

router.get('/recomendaciones/para-ti/:idUsuario', async (req, res) => {
    const { idUsuario } = req.params;
    const session = getSession();
    try {
        const recomendaciones = [];
        const idsYaVistos = new Set();

        // 1. Filtrado colaborativo (usuarios con gustos similares)
        const colaborativo = await session.run(
            `MATCH (c:Comprador {id_usuario: $idUsuario})-[:INTERACTUO|COMPRO]->(o:Obra)
             MATCH (c2:Comprador)-[:INTERACTUO|COMPRO]->(o)
             WHERE c2.id_usuario <> $idUsuario
             MATCH (c2)-[:INTERACTUO|COMPRO]->(recomendada:Obra)
             WHERE recomendada.estado = 'Disponible'
               AND NOT EXISTS { MATCH (:Comprador {id_usuario: $idUsuario})-[:INTERACTUO|COMPRO]->(recomendada) }
             RETURN recomendada.id_obra AS idObra,
                    recomendada.nombre AS nombre,
                    recomendada.precio AS precio,
                    recomendada.fotografia AS fotografia,
                    COUNT(DISTINCT c2) AS afinidad
             ORDER BY afinidad DESC LIMIT 4`,
            { idUsuario: toNum(req.params.idUsuario) }
        );

        for (const r of colaborativo.records) {
            const id = toNum(r.get('idObra'));
            if (!idsYaVistos.has(id)) {
                idsYaVistos.add(id);
                recomendaciones.push({
                    idObra: id,
                    nombre: r.get('nombre'),
                    precio: toNum(r.get('precio')),
                    fotografia: r.get('fotografia') || '',
                    motivo: 'A otros también les gustó',
                    fuente: 'colaborativo'
                });
            }
        }

        // 2. Mismo artista que las obras que le gustaron
        const mismoArtista = await session.run(
            `MATCH (c:Comprador {id_usuario: $idUsuario})-[:INTERACTUO|COMPRO]->(:Obra)<-[:CREO]-(a:Artista)
             MATCH (a)-[:CREO]->(recomendada:Obra)
             WHERE recomendada.estado = 'Disponible'
               AND NOT EXISTS { MATCH (c)-[:INTERACTUO|COMPRO]->(recomendada) }
             RETURN DISTINCT recomendada.id_obra AS idObra,
                    recomendada.nombre AS nombre,
                    recomendada.precio AS precio,
                    recomendada.fotografia AS fotografia,
                    a.nombre + ' ' + a.apellido AS artista
             ORDER BY recomendada.precio DESC LIMIT 3`,
            { idUsuario: toNum(req.params.idUsuario) }
        );

        for (const r of mismoArtista.records) {
            const id = toNum(r.get('idObra'));
            if (!idsYaVistos.has(id) && recomendaciones.length < 8) {
                idsYaVistos.add(id);
                recomendaciones.push({
                    idObra: id,
                    nombre: r.get('nombre'),
                    precio: toNum(r.get('precio')),
                    fotografia: r.get('fotografia') || '',
                    motivo: 'De ' + r.get('artista'),
                    fuente: 'artista'
                });
            }
        }

        // 3. Mismo género que sus preferencias
        const mismoGenero = await session.run(
            `MATCH (c:Comprador {id_usuario: $idUsuario})-[:INTERACTUO|COMPRO]->(:Obra)<-[:CREO]-(:Artista)-[:TRABAJA_EN]->(g:Genero)
             MATCH (g)<-[:TRABAJA_EN]-(:Artista)-[:CREO]->(recomendada:Obra)
             WHERE recomendada.estado = 'Disponible'
               AND NOT EXISTS { MATCH (c)-[:INTERACTUO|COMPRO]->(recomendada) }
             RETURN DISTINCT recomendada.id_obra AS idObra,
                    recomendada.nombre AS nombre,
                    recomendada.precio AS precio,
                    recomendada.fotografia AS fotografia,
                    g.nombre AS genero
             ORDER BY recomendada.precio DESC LIMIT 3`,
            { idUsuario: toNum(req.params.idUsuario) }
        );

        for (const r of mismoGenero.records) {
            const id = toNum(r.get('idObra'));
            if (!idsYaVistos.has(id) && recomendaciones.length < 10) {
                idsYaVistos.add(id);
                recomendaciones.push({
                    idObra: id,
                    nombre: r.get('nombre'),
                    precio: toNum(r.get('precio')),
                    fotografia: r.get('fotografia') || '',
                    motivo: 'Del género ' + r.get('genero'),
                    fuente: 'genero'
                });
            }
        }

        res.json(recomendaciones.slice(0, 10));

    } catch (err) {
        console.error('Error en recomendaciones para ti:', err);
        res.status(500).json({ error: err.message });
    } finally {
        await session.close();
    }
});

// ==========================================
// USUARIO INVITADO PARA PRUEBAS | Dejar documentado si no se va usar.
// ==========================================
// Escribir en consola
// fetch('/api/auth/guest-login').then(r => r.json()).then(d => location.reload())
/*
 router.get('/auth/guest-login', async (req, res) => {
    const session = getSession();
    try {
        await session.run(
            `MERGE (c:Comprador {id_usuario: 9999})
             SET c.nombre = 'Invitado',
                 c.apellido = 'Prueba',
                 c.email = 'guest@museo.com'
             RETURN c`
        );

        req.session.usuario = {
            id_usuario: 9999,
            Nombre: 'Invitado',
            Email: 'guest@museo.com',
            Rol: 'comprador'
        };
        req.session.id_usuario = 9999;

        res.json({ success: true, message: 'Sesión invitada iniciada', id_usuario: 9999 });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        await session.close();
    }
});
*/

// ==========================================
// OBRAS DESTACADAS (MÁS CLICKEADAS POR TODOS LOS USUARIOS)
// ==========================================

router.get('/recomendaciones/obras-destacadas', async (req, res) => {
    const session = getSession();
    try {
        // Obras disponibles con más interacciones de usuarios
        const result = await session.run(`
            MATCH (c:Comprador)-[r:INTERACTUO]->(o:Obra)
            WHERE o.estado = 'Disponible'
            WITH o, COUNT(r) AS clicks
            ORDER BY clicks DESC
            LIMIT 3
            OPTIONAL MATCH (o)<-[:CREO]-(a:Artista)
            RETURN o.id_obra AS idObra,
                   o.nombre AS nombre,
                   o.precio AS precio,
                   o.fotografia AS fotografia,
                   a.nombre + ' ' + a.apellido AS autor,
                   clicks
        `);

        res.json(result.records.map(r => ({
            idObra: toNum(r.get('idObra')),
            nombre: r.get('nombre'),
            precio: toNum(r.get('precio')),
            fotografia: r.get('fotografia') || '',
            autor: r.get('autor') || 'Anónimo',
            clicks: toNum(r.get('clicks'))
        })));
    } catch (err) {
        console.error('Error en obras destacadas:', err);
        res.json([]);
    } finally {
        await session.close();
    }
});

module.exports = router;
