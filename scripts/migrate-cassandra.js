const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { db, connectCassandra, client } = require('../config/database');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const migrarFacturas = async () => {
    console.log('Migrando facturas de MySQL a Cassandra...');
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT f.*, o.Nombre AS nombre_obra,
                   u.Email AS comprador_email, u.Nombre AS usuario_nombre,
                   u.Nombre AS comprador_nombre, u.Apellido AS comprador_apellido,
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
                    await client.execute(
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

const migrarEstatusReservas = async () => {
    console.log('Migrando historial de estatus desde Reservas...');
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT r.id_obra, r.Fecha_Reserva, r.id_usuario
            FROM Reserva r
            JOIN Obra o ON r.id_Obra = o.id_Obra
            WHERE o.Estado_obra IN ('Reservado', 'Vendida')
        `;
        db.query(sql, async (err, reservas) => {
            if (err) return reject(err);
            let count = 0;
            for (const r of reservas) {
                try {
                    await client.execute(
                        `INSERT INTO historial_estatus_obra
                         (id_obra, fecha_cambio, estatus_anterior, estatus_nuevo, modificado_por, motivo)
                         VALUES (?, ?, ?, ?, ?, ?)`,
                        [r.id_obra, r.Fecha_Reserva, 'Disponible', 'Reservado', r.id_usuario, 'Reserva registrada en sistema']
                    );
                    count++;
                } catch (e) {
                    console.error(`  Error reserva obra ${r.id_obra}: ${e.message}`);
                }
            }
            console.log(`  ${count} eventos de reserva migrados`);
            resolve(count);
        });
    });
};

const migrarEstatusFacturas = async () => {
    console.log('Migrando historial de estatus desde Facturas...');
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT f.id_obra, f.Fecha_Venta, f.id_admin
            FROM Factura f
            JOIN Obra o ON f.id_obra = o.id_Obra
            WHERE o.Estado_obra = 'Vendida'
        `;
        db.query(sql, async (err, facturas) => {
            if (err) return reject(err);
            let count = 0;
            for (const f of facturas) {
                try {
                    await client.execute(
                        `INSERT INTO historial_estatus_obra
                         (id_obra, fecha_cambio, estatus_anterior, estatus_nuevo, modificado_por, motivo)
                         VALUES (?, ?, ?, ?, ?, ?)`,
                        [f.id_obra, f.Fecha_Venta, 'Reservado', 'Vendida', f.id_admin, 'Pago completado']
                    );
                    count++;
                } catch (e) {
                    console.error(`  Error factura obra ${f.id_obra}: ${e.message}`);
                }
            }
            console.log(`  ${count} eventos de venta migrados`);
            resolve(count);
        });
    });
};

const run = async () => {
    const cassClient = await connectCassandra();
    if (!cassClient) {
        console.error('No se pudo conectar a Cassandra. Abortando.');
        process.exit(1);
    }

    console.log('Iniciando migración MySQL → Cassandra...\n');
    await migrarFacturas();
    await sleep(500);
    await migrarEstatusReservas();
    await sleep(500);
    await migrarEstatusFacturas();

    console.log('\nMigración completada.');
    await cassClient.shutdown();
    process.exit(0);
};

run();
