const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { connectCassandra, client } = require('../config/cassandra');

const seedData = [
    {
        query: `INSERT INTO obras_vendidas_por_periodo (anio_mes, fecha_venta, id_factura, id_obra, nombre_obra, precio_venta, iva, total_pagado, ganancia_museo_usd, porcentaje_comision, id_comprador, comprador_nombre, comprador_apellido, comprador_email, comprador_cedula, id_admin, admin_nombre)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        params: ['2026-01', '2026-01-15T10:30:00Z', 1, 38, 'Balloon Dog Orange', 58400000.00, 0.00, 58400000.00, 5840000.00, 10.00, 3, 'María', 'González', 'maria@example.com', 12345678, 2, 'Admin Principal']
    },
    {
        query: `INSERT INTO obras_vendidas_por_periodo (anio_mes, fecha_venta, id_factura, id_obra, nombre_obra, precio_venta, iva, total_pagado, ganancia_museo_usd, porcentaje_comision, id_comprador, comprador_nombre, comprador_apellido, comprador_email, comprador_cedula, id_admin, admin_nombre)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        params: ['2026-01', '2026-01-20T14:00:00Z', 2, 64, 'Pumpkin', 4000000.00, 760000.00, 4760000.00, 400000.00, 10.00, 5, 'Carlos', 'Mendoza', 'carlos@example.com', 87654321, 2, 'Admin Principal']
    },
    {
        query: `INSERT INTO obras_vendidas_por_periodo (anio_mes, fecha_venta, id_factura, id_obra, nombre_obra, precio_venta, iva, total_pagado, ganancia_museo_usd, porcentaje_comision, id_comprador, comprador_nombre, comprador_apellido, comprador_email, comprador_cedula, id_admin, admin_nombre)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        params: ['2026-02', '2026-02-05T09:15:00Z', 3, 52, '727', 3800000.00, 722000.00, 4522000.00, 380000.00, 10.00, 3, 'María', 'González', 'maria@example.com', 12345678, 2, 'Admin Principal']
    },
    {
        query: `INSERT INTO resumen_facturacion_mensual (anio_mes, total_facturas, monto_neto_total, iva_total, total_pagado_total, ganancia_museo_total, comision_promedio, obra_mas_cara, obra_mas_barata)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        params: ['2026-01', 2, 62400000.00, 760000.00, 63160000.00, 6240000.00, 10.00, 58400000.00, 4000000.00]
    },
    {
        query: `INSERT INTO resumen_facturacion_mensual (anio_mes, total_facturas, monto_neto_total, iva_total, total_pagado_total, ganancia_museo_total, comision_promedio, obra_mas_cara, obra_mas_barata)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        params: ['2026-02', 1, 3800000.00, 722000.00, 4522000.00, 380000.00, 10.00, 3800000.00, 3800000.00]
    },
    {
        query: `INSERT INTO bitacora_seguridad (id_usuario, fecha_evento, tipo_evento, descripcion, ip_origen, dispositivo)
                VALUES (?, ?, ?, ?, ?, ?)`,
        params: [3, '2026-01-10T08:30:00Z', 'CODIGO_RECUPERACION', 'Código de recuperación enviado al email registrado', '192.168.1.100', 'Chrome/Windows']
    },
    {
        query: `INSERT INTO bitacora_seguridad (id_usuario, fecha_evento, tipo_evento, descripcion, ip_origen, dispositivo)
                VALUES (?, ?, ?, ?, ?, ?)`,
        params: [3, '2026-01-10T08:32:00Z', 'CAMBIO_CONTRASENA', 'Contraseña actualizada exitosamente', '192.168.1.100', 'Chrome/Windows']
    },
    {
        query: `INSERT INTO bitacora_seguridad (id_usuario, fecha_evento, tipo_evento, descripcion, ip_origen, dispositivo)
                VALUES (?, ?, ?, ?, ?, ?)`,
        params: [5, '2026-01-18T15:00:00Z', 'INICIO_SESION', 'Inicio de sesión desde nueva ubicación', '10.0.0.45', 'Safari/macOS']
    },
    {
        query: `INSERT INTO bitacora_seguridad (id_usuario, fecha_evento, tipo_evento, descripcion, ip_origen, dispositivo)
                VALUES (?, ?, ?, ?, ?, ?)`,
        params: [5, '2026-02-01T09:00:00Z', 'CODIGO_RECUPERACION', 'Código de verificación enviado para pago', '10.0.0.45', 'Safari/macOS']
    },
    {
        query: `INSERT INTO historial_estatus_obra (id_obra, fecha_cambio, estatus_anterior, estatus_nuevo, modificado_por, motivo)
                VALUES (?, ?, ?, ?, ?, ?)`,
        params: [38, '2026-01-15T10:00:00Z', 'Disponible', 'Reservado', 2, 'Comprador inició proceso de compra']
    },
    {
        query: `INSERT INTO historial_estatus_obra (id_obra, fecha_cambio, estatus_anterior, estatus_nuevo, modificado_por, motivo)
                VALUES (?, ?, ?, ?, ?, ?)`,
        params: [38, '2026-01-15T10:30:00Z', 'Reservado', 'Vendida', 2, 'Pago completado - Factura #1']
    },
    {
        query: `INSERT INTO historial_estatus_obra (id_obra, fecha_cambio, estatus_anterior, estatus_nuevo, modificado_por, motivo)
                VALUES (?, ?, ?, ?, ?, ?)`,
        params: [64, '2026-01-20T13:45:00Z', 'Disponible', 'Reservado', 3, 'Comprador inició proceso de compra']
    },
    {
        query: `INSERT INTO historial_estatus_obra (id_obra, fecha_cambio, estatus_anterior, estatus_nuevo, modificado_por, motivo)
                VALUES (?, ?, ?, ?, ?, ?)`,
        params: [64, '2026-01-20T14:00:00Z', 'Reservado', 'Vendida', 2, 'Pago completado - Factura #2']
    },
    {
        query: `INSERT INTO historial_estatus_obra (id_obra, fecha_cambio, estatus_anterior, estatus_nuevo, modificado_por, motivo)
                VALUES (?, ?, ?, ?, ?, ?)`,
        params: [52, '2026-02-05T09:00:00Z', 'Disponible', 'Vendida', 2, 'Pago completado - Factura #3']
    },

];

const run = async () => {
    const client = await connectCassandra();
    if (!client) {
        console.error('No se pudo conectar a Cassandra. Abortando seed.');
        process.exit(1);
    }

    console.log(`Insertando ${seedData.length} registros en Cassandra...`);

    for (const item of seedData) {
        try {
            await client.execute(item.query, item.params);
            console.log(`  OK: ${item.query.substring(0, 60)}...`);
        } catch (err) {
            console.error(`  ERROR: ${err.message}`);
        }
    }

    console.log('Seed completado.');
    await client.shutdown();
    process.exit(0);
};

run();
