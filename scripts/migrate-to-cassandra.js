const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const db = require('../config/database');
const { connectCassandra, executeQuery, executeBatch } = require('../config/cassandra');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const migrarFacturas = async () => {
    console.log('Migrando facturas de MySQL a Cassandra...');
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT f.*, o.Nombre AS nombre_obra,
                   u.Email AS comprador_email, u.Nombre AS usuario_nombre,
                   c.Nombre AS comprador_nombre, c.Apellido AS comprador_apellido,
                   c.Cedula AS comprador_cedula
            FROM Factura f
            JOIN Obra o ON f.id_obra = o.id_Obra
            JOIN Usuario u ON f.id_comprador = u.id_usuario
            LEFT JOIN Comprador c ON u.id_usuario = c.id_usuario
        `;
        db.query(sql, async (err, facturas) => {
            if (err) return reject(err);
            let count = 0;
            for (const f of facturas) {
                const fecha = new Date(f.Fecha_Venta);
                const anioMes = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
                try {
                    await executeQuery(
                        `INSERT INTO obras_vendidas_por_periodo
                         (anio_mes, fecha_venta, id_factura, id_obra, nombre_obra, precio_venta, iva, total_pagado,
                          ganancia_museo_usd, porcentaje_comision, id_comprador, comprador_nombre, comprador_apellido,
                          comprador_email, comprador_cedula, id_admin, admin_nombre)
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        [anioMes, f.Fecha_Venta, f.id_factura, f.id_obra, f.nombre_obra,
                         f.Monto_Neto, f.IVA, f.Total_Pagado, f.Ganancia_Museo_USD,
                         f.Porcentaje_Comision, f.id_comprador, f.comprador_nombre || f.usuario_nombre,
                         f.comprador_apellido || '', f.comprador_email, f.comprador_cedula,
                         f.id_admin, 'Admin']
                    );
                    count++;
                    if (count % 10 === 0) console.log(`  ${count} facturas migradas...`);
                } catch (e) {
                    console.error(`  Error factura ${f.id_factura}: ${e.message}`);
                }
            }
            console.log(`  Total: ${count} facturas migradas`);
            resolve(count);
        });
    });
};

const migrarMembresias = async () => {
    console.log('Migrando membresías de MySQL a Cassandra...');
    return new Promise((resolve, reject) => {
        const sql = 'SELECT * FROM Membresia';
        db.query(sql, async (err, membresias) => {
            if (err) return reject(err);
            let count = 0;
            for (const m of membresias) {
                try {
                    await executeQuery(
                        `INSERT INTO membresias_por_usuario (id_usuario, fecha_pago, id_membresia, monto_pagado)
                         VALUES (?, ?, ?, ?)`,
                        [m.id_usuario, m.FechaPago, m.idMembresia, m.MontoPagado]
                    );
                    count++;
                } catch (e) {
                    console.error(`  Error membresía ${m.idMembresia}: ${e.message}`);
                }
            }
            console.log(`  Total: ${count} membresías migradas`);
            resolve(count);
        });
    });
};

const migrarSolicitudesPago = async () => {
    console.log('Migrando solicitudes de pago...');
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT s.*, u.Email, u.Nombre, u.Apellido
            FROM SolicitudPago s
            JOIN Usuario u ON s.id_usuario = u.id_usuario
        `;
        db.query(sql, async (err, solicitudes) => {
            if (err) return reject(err);
            let count = 0;
            for (const s of solicitudes) {
                try {
                    await executeQuery(
                        `INSERT INTO solicitudes_pago_por_estatus
                         (estatus, fecha_solicitud, id_solicitud, id_usuario, monto, usuario_nombre, usuario_apellido, usuario_email)
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                        [s.Estatus, s.FechaSolicitud, s.id_solicitud, s.id_usuario,
                         s.Monto || 10.00, s.Nombre || '', s.Apellido || '', s.Email]
                    );
                    count++;
                } catch (e) {
                    console.error(`  Error solicitud ${s.id_solicitud}: ${e.message}`);
                }
            }
            console.log(`  Total: ${count} solicitudes migradas`);
            resolve(count);
        });
    });
};

const run = async () => {
    const client = await connectCassandra();
    if (!client) {
        console.error('No se pudo conectar a Cassandra. Abortando.');
        process.exit(1);
    }

    console.log('Iniciando migración MySQL → Cassandra...\n');
    await migrarFacturas();
    await sleep(500);
    await migrarMembresias();
    await sleep(500);
    await migrarSolicitudesPago();

    console.log('\nMigración completada.');
    await client.shutdown();
    process.exit(0);
};

run();
