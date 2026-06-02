/**
 * Script de migración histórica: MySQL + MongoDB → Cassandra
 * Reconstruye la bitácora de estatus de obras desde las bases de datos existentes.
 * 
 * Usa las mismas variables de entorno que config/database.js
 * Ejecutar con: node scripts/migrate-estatus-to-cassandra.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const mysql = require('mysql2');
const mongoose = require('mongoose');
const cassandra = require('cassandra-driver');
const { v4: uuidv4 } = require('uuid');

// ============================================
// CONFIGURACIÓN DE CONEXIONES
// ============================================

// MySQL (usa las mismas variables que config/database.js)
const mysqlConnection = mysql.createConnection({
    host: process.env.DB_HOST_MYSQL,
    user: process.env.DB_USER_MYSQL,
    password: process.env.DB_PASSWORD_MYSQL,
    database: process.env.DB_NAME_MYSQL,
    multipleStatements: true
});

// MongoDB
const Obra = require('../models/Obra');

// Cassandra
const cassandraClient = new cassandra.Client({
    contactPoints: (process.env.CASSANDRA_CONTACT_POINTS || 'localhost').split(','),
    localDataCenter: process.env.CASSANDRA_LOCAL_DATACENTER || 'datacenter1',
    keyspace: process.env.CASSANDRA_KEYSPACE || 'art_museum'
});

// ============================================
// FUNCIONES AUXILIARES
// ============================================

async function insertarEvento(params) {
    const {
        id_obra,
        timestamp_cambio,
        estado_anterior,
        estado_nuevo,
        id_usuario_responsable,
        id_factura = null,
        observaciones = '',
        nombre_obra
    } = params;

    const id_evento = uuidv4();
    const anio_mes = timestamp_cambio.toISOString().substring(0, 7);

    const queries = [
        {
            query: `INSERT INTO estatus_obra_por_obra 
                    (id_obra, timestamp_cambio, id_evento, estado_anterior, estado_nuevo, 
                     id_usuario_responsable, id_factura, observaciones, nombre_obra)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            params: [id_obra, timestamp_cambio, id_evento, estado_anterior, estado_nuevo,
                     id_usuario_responsable, id_factura, observaciones, nombre_obra]
        },
        {
            query: `INSERT INTO estatus_obra_por_fecha 
                    (anio_mes, timestamp_cambio, id_obra, id_evento, estado_anterior, 
                     estado_nuevo, id_usuario_responsable, nombre_obra)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            params: [anio_mes, timestamp_cambio, id_obra, id_evento, estado_anterior,
                     estado_nuevo, id_usuario_responsable, nombre_obra]
        },
        {
            query: `INSERT INTO obras_en_estado_actual 
                    (estado_actual, id_obra, nombre_obra, ultimo_cambio, id_usuario_responsable)
                    VALUES (?, ?, ?, ?, ?)`,
            params: [estado_nuevo, id_obra, nombre_obra, timestamp_cambio, id_usuario_responsable]
        }
    ];

    await cassandraClient.batch(queries, { prepare: true });
    console.log(`✓ Obra ${id_obra}: ${estado_anterior} → ${estado_nuevo} (${timestamp_cambio.toISOString()})`);
}

async function obtenerNombreObra(idObra) {
    try {
        const obra = await Obra.findOne({ _id: idObra }).select('nombre').lean();
        return obra ? obra.nombre : `Obra #${idObra}`;
    } catch (err) {
        return `Obra #${idObra}`;
    }
}

// ============================================
// MIGRACIÓN PRINCIPAL
// ============================================

async function migrarHistorial() {
    console.log('=== MIGRACIÓN HISTÓRICA A CASSANDRA ===\n');

    try {
        // 1. Conectar a MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✓ Conectado a MongoDB');

        // 2. Conectar a MySQL
        await new Promise((resolve, reject) => {
            mysqlConnection.connect((err) => {
                if (err) return reject(err);
                console.log('✓ Conectado a MySQL');
                resolve();
            });
        });

        // 3. Conectar a Cassandra
        await cassandraClient.connect();
        console.log('✓ Conectado a Cassandra\n');

        // 4. Migrar reservas (Disponible → Reservado)
        const [reservas] = await mysqlConnection.promise().query(
            `SELECT r.id_obra, r.id_usuario, r.Fecha_Reserva, o.Nombre AS nombre_obra
             FROM Reserva r
             JOIN Obra o ON r.id_Obra = o.id_Obra
             ORDER BY r.Fecha_Reserva ASC`
        );

        console.log(`Encontradas ${reservas.length} reservas en MySQL`);
        for (const reserva of reservas) {
            const fecha = new Date(reserva.Fecha_Reserva);
            if (fecha.getHours() === 0 && fecha.getMinutes() === 0) {
                fecha.setHours(12, 0, 0, 0);
            }
            await insertarEvento({
                id_obra: reserva.id_obra,
                timestamp_cambio: fecha,
                estado_anterior: 'Disponible',
                estado_nuevo: 'Reservado',
                id_usuario_responsable: reserva.id_usuario,
                observaciones: 'Migración: reserva MySQL',
                nombre_obra: reserva.nombre_obra || await obtenerNombreObra(reserva.id_obra)
            });
        }

        console.log('');

        // 5. Migrar facturas (Reservado → Vendida)
        const [facturas] = await mysqlConnection.promise().query(
            `SELECT f.id_factura, f.id_obra, f.id_comprador, f.id_admin, f.Fecha_Venta, o.Nombre AS nombre_obra
             FROM Factura f
             JOIN Obra o ON f.id_obra = o.id_Obra
             ORDER BY f.Fecha_Venta ASC`
        );

        console.log(`Encontradas ${facturas.length} facturas en MySQL`);
        for (const factura of facturas) {
            const fecha = new Date(factura.Fecha_Venta);
            if (fecha.getHours() === 0 && fecha.getMinutes() === 0) {
                fecha.setHours(12, 0, 0, 0);
            }
            await insertarEvento({
                id_obra: factura.id_obra,
                timestamp_cambio: fecha,
                estado_anterior: 'Reservado',
                estado_nuevo: 'Vendida',
                id_usuario_responsable: factura.id_admin || factura.id_comprador,
                id_factura: factura.id_factura,
                observaciones: 'Migración: factura MySQL',
                nombre_obra: factura.nombre_obra || await obtenerNombreObra(factura.id_obra)
            });
        }

        // 6. Insertar estado inicial para obras sin eventos
        console.log('\nVerificando obras sin eventos...');
        const obrasMongo = await Obra.find().select('_id nombre estado_obra').lean();
        
        for (const obra of obrasMongo) {
            const result = await cassandraClient.execute(
                'SELECT COUNT(*) AS count FROM estatus_obra_por_obra WHERE id_obra = ?',
                [obra._id],
                { prepare: true }
            );
            
            if (result.rows[0].count.low === 0) {
                await insertarEvento({
                    id_obra: obra._id,
                    timestamp_cambio: new Date('2025-01-01T12:00:00Z'),
                    estado_anterior: 'N/A',
                    estado_nuevo: obra.estado_obra || 'Disponible',
                    id_usuario_responsable: 0,
                    observaciones: 'Estado inicial desde MongoDB',
                    nombre_obra: obra.nombre
                });
            }
        }

        console.log('\n=== MIGRACIÓN COMPLETADA EXITOSAMENTE ===');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        throw error;
    } finally {
        await cassandraClient.shutdown();
        mysqlConnection.end();
        await mongoose.disconnect();
        console.log('Conexiones cerradas.');
    }
}

migrarHistorial()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));