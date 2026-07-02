const { client } = require('../config/database');

async function registrarEvento(id_usuario, tipo_evento, descripcion, req) {
    await client.execute(
        `INSERT INTO bitacora_seguridad (id_usuario, fecha_evento, tipo_evento, descripcion, ip_origen, dispositivo)
         VALUES (?, toTimestamp(now()), ?, ?, ?, ?)`,
        [id_usuario, tipo_evento, descripcion, req?.ip || '', req?.headers?.['user-agent'] || ''],
        { prepare: true }
    );
}

async function findAllLogs() {
    const result = await client.execute('SELECT * FROM bitacora_seguridad ALLOW FILTERING');
    return result.rows;
}

module.exports = { registrarEvento, findAllLogs };
