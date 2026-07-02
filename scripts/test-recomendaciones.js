require('dotenv').config();
const { getSession, connectNeo4j, closeNeo4j } = require('../config/database');

async function testRecomendaciones() {
    console.log('=== TEST DEL SISTEMA DE RECOMENDACIONES ===\n');

    const driver = await connectNeo4j();
    if (!driver) {
        console.log('No se pudo conectar a Neo4j. Verifica credenciales en .env');
        process.exit(1);
    }

    const session = getSession();

    try {
        // 1. Estadísticas del grafo
        console.log('1. Estadísticas del grafo:');
        const nodos = await session.run(`
            MATCH (n) RETURN labels(n) AS tipo, count(n) AS cant ORDER BY tipo
        `);
        for (const r of nodos.records) {
            console.log(`   ${r.get('tipo')[0]}: ${r.get('cant').toNumber()}`);
        }

        const rels = await session.run(`
            MATCH ()-[r]->() RETURN type(r) AS tipo, count(r) AS cant ORDER BY tipo
        `);
        for (const r of rels.records) {
            console.log(`   ${r.get('tipo')}: ${r.get('cant').toNumber()}`);
        }

        // 2. Probar recomendación por género
        console.log('\n2. Recomendación por género (primer comprador):');
        const compradores = await session.run(`
            MATCH (c:Comprador) RETURN c.id_usuario AS id LIMIT 1
        `);
        if (compradores.records.length > 0) {
            const idUsuario = compradores.records[0].get('id').toNumber();
            console.log(`   Probando con comprador ID: ${idUsuario}`);

            const mismoGenero = await session.run(`
                MATCH (c:Comprador {id_usuario: $id})-[:COMPRO]->(:Obra)<-[:CREO]-(:Artista)-[:TRABAJA_EN]->(g:Genero)
                MATCH (g)<-[:TRABAJA_EN]-(:Artista)-[:CREO]->(rec:Obra)
                WHERE NOT EXISTS { MATCH (c)-[:COMPRO]->(rec) }
                AND rec.estado = 'Disponible'
                RETURN DISTINCT rec.nombre AS obra, g.nombre AS genero, rec.precio AS precio
                LIMIT 5
            `, { id: idUsuario });

            if (mismoGenero.records.length > 0) {
                for (const r of mismoGenero.records) {
                    console.log(`   - ${r.get('obra')} (${r.get('genero')}) - $${r.get('precio')}`);
                }
            } else {
                console.log('   No hay recomendaciones disponibles (el comprador ya compró todo lo disponible)');
            }
        }

        // 3. Probar artistas populares
        console.log('\n3. Artistas más populares:');
        const artistas = await session.run(`
            MATCH (c:Comprador)-[:COMPRO]->(:Obra)<-[:CREO]-(a:Artista)
            RETURN a.nombre + ' ' + a.apellido AS artista, COUNT(*) AS ventas
            ORDER BY ventas DESC LIMIT 5
        `);
        for (const r of artistas.records) {
            console.log(`   ${r.get('artista')}: ${r.get('ventas').toNumber()} obras vendidas`);
        }

        // 4. Probar géneros populares
        console.log('\n4. Géneros más populares:');
        const generos = await session.run(`
            MATCH (c:Comprador)-[:COMPRO]->(:Obra)<-[:CREO]-(:Artista)-[:TRABAJA_EN]->(g:Genero)
            RETURN g.nombre AS genero, COUNT(*) AS ventas
            ORDER BY ventas DESC
        `);
        for (const r of generos.records) {
            console.log(`   ${r.get('genero')}: ${r.get('ventas').toNumber()} ventas`);
        }

        // 5. Recorrido completo del grafo
        console.log('\n5. Recorrido completo (Comprador → Obra → Artista → Género):');
        const paths = await session.run(`
            MATCH path = (c:Comprador)-[:COMPRO]->(o:Obra)<-[:CREO]-(a:Artista)-[:TRABAJA_EN]->(g:Genero)
            RETURN c.nombre + ' ' + c.apellido AS comprador,
                   o.nombre AS obra,
                   a.nombre + ' ' + a.apellido AS artista,
                   g.nombre AS genero
            LIMIT 10
        `);
        if (paths.records.length > 0) {
            for (const r of paths.records) {
                console.log(`   ${r.get('comprador')} → "${r.get('obra')}" → ${r.get('artista')} → ${r.get('genero')}`);
            }
        } else {
            console.log('   No hay caminos completos. Verifica que existan facturas con compradores y obras con autores.');
        }

        console.log('\n=== TEST COMPLETADO EXITOSAMENTE ===');

    } catch (err) {
        console.error('ERROR:', err.message);
    } finally {
        await session.close();
        await closeNeo4j();
        process.exit(0);
    }
}

testRecomendaciones();
