require('dotenv').config();
const { getSession, connectNeo4j, closeNeo4j } = require('../config/neo4j');
const mysql = require('mysql2');
const mongoose = require('mongoose');
const Obra = require('../models/Obra');
const Autor = require('../models/Autor');

const db = mysql.createConnection({
    host: process.env.DB_HOST_MYSQL,
    user: process.env.DB_USER_MYSQL,
    password: process.env.DB_PASSWORD_MYSQL,
    database: process.env.DB_NAME_MYSQL
});

const MONGO_URI = process.env.MONGO_URI || process.env.MONGO_URI_FALLBACK;

async function seedNeo4j() {
    console.log('=== POBLANDO GRAFO DE CONOCIMIENTO NEO4J ===\n');

    await connectNeo4j();
    const session = getSession();

    try {
        await mongoose.connect(MONGO_URI);
        console.log('MongoDB conectado para lectura de datos');
    } catch (err) {
        console.log('Usando MySQL como fuente principal (MongoDB no disponible)');
    }

    console.log('\n--- Limpiando grafo existente ---');
    await session.run('MATCH (n) DETACH DELETE n');
    console.log('Grafo limpiado');

    console.log('\n--- Creando índices y constraints ---');
    const constraints = [
        'CREATE CONSTRAINT IF NOT EXISTS FOR (c:Comprador) REQUIRE c.id_usuario IS UNIQUE',
        'CREATE CONSTRAINT IF NOT EXISTS FOR (o:Obra) REQUIRE o.id_obra IS UNIQUE',
        'CREATE CONSTRAINT IF NOT EXISTS FOR (a:Artista) REQUIRE a.id_artista IS UNIQUE',
        'CREATE CONSTRAINT IF NOT EXISTS FOR (g:Genero) REQUIRE g.nombre IS UNIQUE'
    ];
    for (const cypher of constraints) {
        try { await session.run(cypher); } catch (e) { /* ignorar si ya existen */ }
    }
    console.log('Constraints creados');

    console.log('\n--- Cargando compradores desde MySQL ---');
    const [compradores] = await db.promise().query(`
        SELECT u.id_usuario, u.Nombre, u.Apellido, u.Email
        FROM Usuario u
        INNER JOIN Comprador c ON u.id_usuario = c.id_usuario
        WHERE u.Rol = 'comprador'
    `);

    for (const c of compradores) {
        await session.run(
            `CREATE (c:Comprador {
                id_usuario: $id,
                nombre: $nombre,
                apellido: $apellido,
                email: $email
            })`,
            { id: c.id_usuario, nombre: c.Nombre, apellido: c.Apellido, email: c.Email }
        );
    }
    console.log(`  ${compradores.length} compradores creados`);

    console.log('\n--- Cargando obras desde MongoDB ---');
    let obras = [];
    try {
        obras = await Obra.find().lean();
        console.log(`  ${obras.length} obras cargadas desde MongoDB`);
    } catch (err) {
        console.log('  MongoDB no disponible, cargando desde MySQL');
        const [rows] = await db.promise().query(`
            SELECT o.id_Obra, o.Nombre, o.Precio, o.Estado_obra, g.Nombre AS GeneroNombre
            FROM Obra o
            LEFT JOIN Genero g ON o.id_Genero = g.id_Genero
        `);
        obras = rows.map(r => ({
            _id: r.id_Obra,
            nombre: r.Nombre,
            precio: r.Precio,
            estado_obra: r.Estado_obra,
            genero: r.GeneroNombre ? { nombre: r.GeneroNombre } : null
        }));
        console.log(`  ${obras.length} obras cargadas desde MySQL`);
    }

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

    console.log('\n--- Cargando artistas desde MongoDB ---');
    let artistas = [];
    try {
        artistas = await Autor.find().lean();
        console.log(`  ${artistas.length} artistas cargados desde MongoDB`);
    } catch (err) {
        console.log('  MongoDB no disponible, cargando desde MySQL');
        const [rows] = await db.promise().query(`
            SELECT a.id_Autor, a.Nombre, a.Apellido, n.Descripcion AS Nacionalidad
            FROM Autor a
            LEFT JOIN Nacionalidad n ON a.id_Nacionalidad = n.id_Nacionalidad
        `);
        artistas = rows.map(r => ({
            _id: r.id_Autor,
            nombre: r.Nombre,
            apellido: r.Apellido,
            nacionalidad: r.Nacionalidad
        }));
        console.log(`  ${artistas.length} artistas cargados desde MySQL`);
    }

    for (const a of artistas) {
        await session.run(
            `CREATE (a:Artista {
                id_artista: $id,
                nombre: $nombre,
                apellido: $apellido,
                nacionalidad: $nacionalidad
            })`,
            {
                id: a._id,
                nombre: a.nombre,
                apellido: a.apellido,
                nacionalidad: a.nacionalidad || ''
            }
        );
    }

    console.log('\n--- Creando relación :TRABAJA_EN entre artistas y géneros ---');
    for (const o of obras) {
        if (!o.genero || !o.genero.nombre) continue;

        const generoNombre = o.genero.nombre;
        await session.run(
            `MERGE (g:Genero {nombre: $nombre})`,
            { nombre: generoNombre }
        );

        let autoresObra = [];
        try {
            const obraDoc = await Obra.findById(o._id).lean();
            autoresObra = obraDoc?.autores || [];
        } catch {
            const [rows] = await db.promise().query(
                'SELECT id_Autor FROM Obra_autor WHERE id_Obra = ?',
                [o._id]
            );
            autoresObra = rows.map(r => r.id_Autor);
        }

        for (const autorId of autoresObra) {
            await session.run(
                `
                MATCH (a:Artista {id_artista: $autorId})
                MATCH (ob:Obra {id_obra: $obraId})
                MATCH (g:Genero {nombre: $genero})
                MERGE (a)-[:CREO]->(ob)
                MERGE (a)-[:TRABAJA_EN]->(g)
                `,
                { autorId: autorId, obraId: o._id, genero: generoNombre }
            );
        }
    }

    console.log('\n--- Creando relación :COMPRO entre compradores y obras ---');
    const [facturas] = await db.promise().query(`
        SELECT f.id_comprador, f.id_obra
        FROM Factura f
        WHERE f.id_comprador IS NOT NULL
    `);

    let relCount = 0;
    for (const f of facturas) {
        try {
            await session.run(
                `
                MATCH (c:Comprador {id_usuario: $compradorId})
                MATCH (o:Obra {id_obra: $obraId})
                MERGE (c)-[:COMPRO {fecha: datetime()}]->(o)
                `,
                { compradorId: f.id_comprador, obraId: f.id_obra }
            );
            relCount++;
        } catch (e) {
            // Saltar si el nodo no existe
        }
    }
    console.log(`  ${relCount} relaciones COMPRO creadas`);

    console.log('\n--- Estadísticas del grafo ---');
    const stats = await session.run(`
        MATCH (n)
        RETURN labels(n) AS tipo, count(n) AS cantidad
        ORDER BY tipo
    `);
    for (const record of stats.records) {
        const tipo = record.get('tipo')[0];
        const cantidad = record.get('cantidad').toNumber();
        console.log(`  ${tipo}: ${cantidad} nodos`);
    }

    const relStats = await session.run(`
        MATCH ()-[r]->()
        RETURN type(r) AS tipo, count(r) AS cantidad
        ORDER BY tipo
    `);
    for (const record of relStats.records) {
        console.log(`  ${record.get('tipo')}: ${record.get('cantidad').toNumber()} relaciones`);
    }

    console.log('\n=== GRAFO POBLADO EXITOSAMENTE ===');

    await session.close();
    await closeNeo4j();
    await mongoose.disconnect();
    db.end();
    process.exit(0);
}

seedNeo4j().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
