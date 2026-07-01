const { client } = require('../../config/database');

async function registrarEvento(id_usuario, tipo_evento, descripcion, req) {
    await client.execute(
        `INSERT INTO bitacora_seguridad (id_usuario, fecha_evento, tipo_evento, descripcion, ip_origen, dispositivo)
         VALUES (?, toTimestamp(now()), ?, ?, ?, ?)`,
        [id_usuario, tipo_evento, descripcion, req?.ip || '', req?.headers?.['user-agent'] || ''],
        { prepare: true }
    );
}

async function registrarCambioEstatus(id_obra, estatus_anterior, estatus_nuevo, modificado_por, motivo) {
    await client.execute(
        `INSERT INTO historial_estatus_obra (id_obra, fecha_cambio, estatus_anterior, estatus_nuevo, modificado_por, motivo)
         VALUES (?, toTimestamp(now()), ?, ?, ?, ?)`,
        [id_obra, estatus_anterior, estatus_nuevo, modificado_por, motivo],
        { prepare: true }
    );
}

async function findAllLogs() {
    const result = await client.execute('SELECT * FROM bitacora_seguridad ALLOW FILTERING');
    return result.rows;
}

async function findLogsByUser(id_usuario) {
    const result = await client.execute(
        'SELECT * FROM bitacora_seguridad WHERE id_usuario = ?', [parseInt(id_usuario)]
    );
    return result.rows;
}

async function findLogsByUserAndType(id_usuario, tipo_evento) {
    const result = await client.execute(
        'SELECT * FROM bitacora_seguridad WHERE id_usuario = ? AND tipo_evento = ? ALLOW FILTERING',
        [parseInt(id_usuario), tipo_evento]
    );
    return result.rows;
}

async function findObrasConHistorial() {
    const result = await client.execute('SELECT DISTINCT id_obra FROM historial_estatus_obra');
    return result.rows.map(r => r.id_obra);
}

async function findHistorialByObra(id_obra) {
    const result = await client.execute(
        'SELECT * FROM historial_estatus_obra WHERE id_obra = ?', [parseInt(id_obra)]
    );
    return result.rows;
}

async function registrarBatch(queries) {
    await client.batch(queries, { prepare: true });
}

module.exports = {
    registrarEvento, registrarCambioEstatus, findAllLogs,
    findLogsByUser, findLogsByUserAndType, findObrasConHistorial,
    findHistorialByObra, registrarBatch
};
