const { client } = require('../config/database');
const { RegistrarEventoSeguridadInput, RegistrarCambioEstatusInput } = require('../models');

async function registrarEvento(id_usuario, tipo_evento, descripcion, req) {
    const payload = RegistrarEventoSeguridadInput.parse({
        id_usuario,
        tipo_evento,
        descripcion,
        ip_origen: req?.ip || '',
        dispositivo: req?.headers?.['user-agent'] || ''
    });

    await client.execute(
        `INSERT INTO bitacora_seguridad (id_usuario, fecha_evento, tipo_evento, descripcion, ip_origen, dispositivo)
         VALUES (?, toTimestamp(now()), ?, ?, ?, ?)`,
        [payload.id_usuario, payload.tipo_evento, payload.descripcion, payload.ip_origen, payload.dispositivo],
        { prepare: true }
    );
}

async function registrarCambioEstatus(id_obra, estatus_anterior, estatus_nuevo, modificado_por, motivo) {
    const payload = RegistrarCambioEstatusInput.parse({
        id_obra, estatus_anterior, estatus_nuevo,
        modificado_por: modificado_por ?? null,
        motivo: motivo || ''
    });

    await client.execute(
        `INSERT INTO historial_estatus_obra (id_obra, fecha_cambio, estatus_anterior, estatus_nuevo, modificado_por, motivo)
         VALUES (?, toTimestamp(now()), ?, ?, ?, ?)`,
        [payload.id_obra, payload.estatus_anterior, payload.estatus_nuevo, payload.modificado_por, payload.motivo],
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
