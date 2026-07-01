require('dotenv').config();
const { getSession, connectNeo4j, closeNeo4j } = require('../config/database');
const mongoose = require('mongoose');
const Obra = require('../backend/models/obra_model');
const Autor = require('../backend/models/autor_model');

const MONGO_URI = process.env.MONGO_URI || process.env.MONGO_URI_FALLBACK;

async function seedNeo4j() {
    console.log('=== POBLANDO GRAFO NEO4J DESDE MONGODB ===\n');

    await connectNeo4j();
    const session = getSession();

    // 1. Conectar a MongoDB
    console.log('Conectando a MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✓ MongoDB conectado\n');

    // 2. Limpiar grafo existente
    console.log('--- Limpiando grafo existente ---');
    await session.run('MATCH (n) DETACH DELETE n');
    console.log('Grafo limpiado\n');

    // 3. Crear constraints
    console.log('--- Creando constraints ---');
    const constraints = [
        'CREATE CONSTRAINT IF NOT EXISTS FOR (o:Obra) REQUIRE o.id_obra IS UNIQUE',
        'CREATE CONSTRAINT IF NOT EXISTS FOR (a:Artista) REQUIRE a.id_artista IS UNIQUE',
        'CREATE CONSTRAINT IF NOT EXISTS FOR (g:Genero) REQUIRE g.nombre IS UNIQUE'
    ];
    for (const cypher of constraints) {
        try { await session.run(cypher); } catch (e) { /* ignorar */ }
    }
    console.log('Constraints creados\n');

    // 4. Cargar obras desde MongoDB
    console.log('--- Cargando obras desde MongoDB ---');
    const obras = await Obra.find().lean();
    for (const o of obras) {
        await session.run(
            `CREATE (:Obra {
                id_obra: $id,
                nombre: $nombre,
                precio: $precio,
                estado: $estado,
                fotografia: $fotografia
            })`,
            {
                id: o._id,
                nombre: o.nombre,
                precio: o.precio || 0,
                estado: o.estado_obra || 'Disponible',
                fotografia: o.fotografia || ''
            }
        );
    }
    console.log(`  ${obras.length} obras creadas\n`);

    // 5. Cargar autores desde MongoDB
    console.log('--- Cargando autores desde MongoDB ---');
    const autores = await Autor.find().lean();
    for (const a of autores) {
        await session.run(
            `CREATE (:Artista {
                id_artista: $id,
                nombre: $nombre,
                apellido: $apellido,
                nacionalidad: $nacionalidad
            })`,
            {
                id: a._id,
                nombre: a.nombre,
                apellido: a.apellido || '',
                nacionalidad: a.nacionalidad || ''
            }
        );
    }
    console.log(`  ${autores.length} autores creados\n`);

    // 6. Crear géneros y relaciones
    console.log('--- Creando géneros y relaciones ---');
    const generosSet = new Set();
    let relacionesCreadas = 0;

    for (const o of obras) {
        if (!o.genero?.nombre) continue;
        const generoNombre = o.genero.nombre;
        generosSet.add(generoNombre);

        // Crear género
        await session.run(
            `MERGE (g:Genero {nombre: $nombre})`,
            { nombre: generoNombre }
        );

        // Relacionar autores con obra
        if (o.autores && o.autores.length > 0) {
            for (const autorId of o.autores) {
                try {
                    await session.run(
                        `MATCH (a:Artista {id_artista: $autorId})
                         MATCH (ob:Obra {id_obra: $obraId})
                         MATCH (g:Genero {nombre: $genero})
                         MERGE (a)-[:CREO]->(ob)
                         MERGE (a)-[:TRABAJA_EN]->(g)`,
                        { autorId, obraId: o._id, genero: generoNombre }
                    );
                    relacionesCreadas++;
                } catch (e) {
                    // Saltar si el autor no existe
                }
            }
        }
    }
    console.log(`  ${generosSet.size} géneros creados`);
    console.log(`  ${relacionesCreadas} relaciones creadas\n`);

    // 7. Estadísticas
    console.log('=== ESTADÍSTICAS DEL GRAFO ===');
    const stats = await session.run(
        `MATCH (n) RETURN labels(n) AS tipo, count(n) AS cantidad ORDER BY tipo`
    );
    for (const record of stats.records) {
        console.log(`  ${record.get('tipo')[0]}: ${record.get('cantidad').toNumber()} nodos`);
    }

    const relStats = await session.run(
        `MATCH ()-[r]->() RETURN type(r) AS tipo, count(r) AS cantidad ORDER BY tipo`
    );
    for (const record of relStats.records) {
        console.log(`  ${record.get('tipo')}: ${record.get('cantidad').toNumber()} relaciones`);
    }

    console.log('\n=== GRAFO POBLADO EXITOSAMENTE ===');

    await session.close();
    await closeNeo4j();
    await mongoose.disconnect();
    process.exit(0);
}

seedNeo4j().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});