/**
 * Script para crear las tablas en Cassandra.
 * Si no hay Cassandra disponible, genera los archivos CQL de respaldo.
 * 
 * PRIMERO EJECUTA: node scripts/setup-cassandra.js --dry-run
 * Esto generará los archivos SQL simulados sin necesidad de Cassandra.
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const fs = require('fs');
const path = require('path');
const cassandra = require('cassandra-driver');

const KEYSPACE = process.env.CASSANDRA_KEYSPACE || 'art_museum';
const dryRun = process.argv.includes('--dry-run');

// ============================================
// SCRIPT CQL COMPLETO (respaldo)
// ============================================
const CQL_SCRIPT = `
CREATE KEYSPACE IF NOT EXISTS ${KEYSPACE}
WITH replication = {'class': 'SimpleStrategy', 'replication_factor': 1};

USE ${KEYSPACE};

CREATE TABLE IF NOT EXISTS estatus_obra_por_obra (
    id_obra INT,
    timestamp_cambio TIMESTAMP,
    id_evento UUID,
    estado_anterior TEXT,
    estado_nuevo TEXT,
    id_usuario_responsable INT,
    id_factura INT,
    observaciones TEXT,
    nombre_obra TEXT STATIC,
    PRIMARY KEY (id_obra, timestamp_cambio, id_evento)
) WITH CLUSTERING ORDER BY (timestamp_cambio DESC, id_evento ASC);

CREATE TABLE IF NOT EXISTS estatus_obra_por_fecha (
    anio_mes TEXT,
    timestamp_cambio TIMESTAMP,
    id_obra INT,
    id_evento UUID,
    estado_anterior TEXT,
    estado_nuevo TEXT,
    id_usuario_responsable INT,
    nombre_obra TEXT,
    PRIMARY KEY (anio_mes, timestamp_cambio, id_obra, id_evento)
) WITH CLUSTERING ORDER BY (timestamp_cambio DESC, id_obra ASC, id_evento ASC);

CREATE TABLE IF NOT EXISTS obras_en_estado_actual (
    estado_actual TEXT,
    id_obra INT,
    nombre_obra TEXT,
    ultimo_cambio TIMESTAMP,
    id_usuario_responsable INT,
    PRIMARY KEY (estado_actual, id_obra)
);
`;

// ============================================
// FUNCIÓN PRINCIPAL
// ============================================
async function setupCassandra() {
    console.log('=== CONFIGURANDO CASSANDRA PARA BITÁCORA DE ESTATUS ===\n');

    if (dryRun) {
        // Modo dry-run: solo genera los archivos
        const cqlDir = path.join(__dirname, '..', 'entregables', 'sprint-2', 'cql');
        if (!fs.existsSync(cqlDir)) fs.mkdirSync(cqlDir, { recursive: true });
        
        fs.writeFileSync(path.join(cqlDir, '04-artwork-status-log.cql'), CQL_SCRIPT.trim());
        console.log('✓ Archivo CQL generado en entregables/sprint-2/cql/04-artwork-status-log.cql');
        console.log('\nPara aplicar las tablas, ejecuta este archivo con cqlsh cuando Cassandra esté disponible.');
        return;
    }

    try {
        const client = new cassandra.Client({
            contactPoints: (process.env.CASSANDRA_CONTACT_POINTS || 'localhost').split(','),
            localDataCenter: process.env.CASSANDRA_LOCAL_DATACENTER || 'datacenter1'
        });

        await client.connect();
        console.log('✓ Conectado a Cassandra\n');

        // Crear keyspace
        await client.execute(`
            CREATE KEYSPACE IF NOT EXISTS ${KEYSPACE}
            WITH replication = {'class': 'SimpleStrategy', 'replication_factor': 1}
        `);
        console.log(`✓ Keyspace '${KEYSPACE}' creado`);

        await client.execute(`USE ${KEYSPACE}`);

        // Crear tablas
        console.log('Creando tabla estatus_obra_por_obra...');
        await client.execute(`
            CREATE TABLE IF NOT EXISTS estatus_obra_por_obra (
                id_obra INT,
                timestamp_cambio TIMESTAMP,
                id_evento UUID,
                estado_anterior TEXT,
                estado_nuevo TEXT,
                id_usuario_responsable INT,
                id_factura INT,
                observaciones TEXT,
                nombre_obra TEXT STATIC,
                PRIMARY KEY (id_obra, timestamp_cambio, id_evento)
            ) WITH CLUSTERING ORDER BY (timestamp_cambio DESC, id_evento ASC)
        `);
        console.log('✓ estatus_obra_por_obra');

        console.log('Creando tabla estatus_obra_por_fecha...');
        await client.execute(`
            CREATE TABLE IF NOT EXISTS estatus_obra_por_fecha (
                anio_mes TEXT,
                timestamp_cambio TIMESTAMP,
                id_obra INT,
                id_evento UUID,
                estado_anterior TEXT,
                estado_nuevo TEXT,
                id_usuario_responsable INT,
                nombre_obra TEXT,
                PRIMARY KEY (anio_mes, timestamp_cambio, id_obra, id_evento)
            ) WITH CLUSTERING ORDER BY (timestamp_cambio DESC, id_obra ASC, id_evento ASC)
        `);
        console.log('✓ estatus_obra_por_fecha');

        console.log('Creando tabla obras_en_estado_actual...');
        await client.execute(`
            CREATE TABLE IF NOT EXISTS obras_en_estado_actual (
                estado_actual TEXT,
                id_obra INT,
                nombre_obra TEXT,
                ultimo_cambio TIMESTAMP,
                id_usuario_responsable INT,
                PRIMARY KEY (estado_actual, id_obra)
            )
        `);
        console.log('✓ obras_en_estado_actual');

        await client.shutdown();
        console.log('\n=== CONFIGURACIÓN COMPLETADA ===');

    } catch (error) {
        console.error('\n❌ No se pudo conectar a Cassandra.');
        console.log('Generando archivos CQL de respaldo...\n');
        
        const cqlDir = path.join(__dirname, '..', 'entregables', 'sprint-2', 'cql');
        if (!fs.existsSync(cqlDir)) fs.mkdirSync(cqlDir, { recursive: true });
        
        fs.writeFileSync(path.join(cqlDir, '04-artwork-status-log.cql'), CQL_SCRIPT.trim());
        console.log('✓ Archivo CQL generado en entregables/sprint-2/cql/04-artwork-status-log.cql');
        console.log('\nPuedes aplicar este archivo cuando Cassandra esté disponible.');
    }
}

setupCassandra().then(() => process.exit(0)).catch(() => process.exit(1));