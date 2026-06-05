const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const db = require('../config/database');
const { connectCassandra, executeQuery } = require('../config/cassandra');

const migrarEstatusReservas = async () => {
    console.log('Migrando historial de estatus desde Reservas...');
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT r.id_obra, r.Fecha_Reserva, r.id_usuario
            FROM Reserva r
            JOIN Obra o ON r.id_Obra = o.id_Obra
            WHERE o.Estado_obra IN ('Reservada', 'Vendida')
        `;
        db.query(sql, async (err, reservas) => {
            if (err) return reject(err);
            let count = 0;
            for (const r of reservas) {
                try {
                    await executeQuery(
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
                    await executeQuery(
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
    const client = await connectCassandra();
    if (!client) {
        console.error('No se pudo conectar a Cassandra.');
        process.exit(1);
    }

    await migrarEstatusReservas();
    await migrarEstatusFacturas();

    console.log('Migración de estatus completada.');
    await client.shutdown();
    process.exit(0);
};

run();
