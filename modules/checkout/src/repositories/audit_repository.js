const { client } = require('../config/database');

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

module.exports = { registrarEvento, registrarCambioEstatus };
