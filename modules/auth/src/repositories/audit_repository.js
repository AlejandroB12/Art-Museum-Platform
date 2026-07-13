const { cassandraModels } = require('../config/database');
const { RegistrarEventoSeguridadInput } = require('../schemas/bitacora');
const { RegistrarCambioEstatusInput } = require('../schemas/historial_estatus');

function getBitacora() { return cassandraModels.instance?.bitacora; }
function getHistorial() { return cassandraModels.instance?.historial_estatus; }
function getRawClient() { return cassandraModels.instance?.obras_vendidas?._driver?._properties?.cql || cassandraModels.orm?._client; }

function normalizeIp(ip) {
    if (!ip) return undefined;
    // ::ffff:127.0.0.1 → 127.0.0.1 (IPv4-mapped IPv6)
    if (ip.startsWith('::ffff:')) return ip.substring(7);
    // Pure IPv6 como ::1 → undefined (solo auditoría IPv4)
    if (/^(\d{1,3}\.){3}\d{1,3}$/.test(ip)) return ip;
    return undefined;
}

async function registrarEvento(id_usuario, tipo_evento, descripcion, req) {
    const payload = RegistrarEventoSeguridadInput.parse({
        id_usuario,
        tipo_evento,
        descripcion,
        ip_origen: normalizeIp(req?.ip),
        dispositivo: req?.headers?.['user-agent'] || ''
    });

    const Bitacora = getBitacora();
    if (!Bitacora) throw new Error('Cassandra no conectado');

    return new Promise((resolve, reject) => {
        const record = new Bitacora(payload);
        record.save((err, model) => {
            if (err) reject(err);
            else resolve(model);
        });
    });
}

async function registrarCambioEstatus(id_obra, estatus_anterior, estatus_nuevo, modificado_por, motivo) {
    const payload = RegistrarCambioEstatusInput.parse({
        id_obra, estatus_anterior, estatus_nuevo,
        modificado_por: modificado_por ?? null,
        motivo: motivo || ''
    });

    const Historial = getHistorial();
    if (!Historial) throw new Error('Cassandra no conectado');

    return new Promise((resolve, reject) => {
        const record = new Historial(payload);
        record.save((err, model) => {
            if (err) reject(err);
            else resolve(model);
        });
    });
}

async function findAllLogs() {
    const Bitacora = getBitacora();
    if (!Bitacora) throw new Error('Cassandra no conectado');

    return new Promise((resolve, reject) => {
        Bitacora.find({}, { raw: true }, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

async function findLogsByUser(id_usuario) {
    const Bitacora = getBitacora();
    if (!Bitacora) throw new Error('Cassandra no conectado');

    return new Promise((resolve, reject) => {
        Bitacora.find({ id_usuario: parseInt(id_usuario) }, { raw: true }, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

async function findLogsByUserAndType(id_usuario, tipo_evento) {
    const Bitacora = getBitacora();
    if (!Bitacora) throw new Error('Cassandra no conectado');

    return new Promise((resolve, reject) => {
        Bitacora.find(
            { id_usuario: parseInt(id_usuario), tipo_evento },
            { raw: true },
            (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            }
        );
    });
}

async function findObrasConHistorial() {
    const client = getRawClient();
    if (!client) throw new Error('Cassandra no conectado');

    const result = await client.execute('SELECT DISTINCT id_obra FROM historial_estatus_obra');
    return result.rows.map(r => r.id_obra);
}

async function findHistorialByObra(id_obra) {
    const Historial = getHistorial();
    if (!Historial) throw new Error('Cassandra no conectado');

    return new Promise((resolve, reject) => {
        Historial.find({ id_obra: parseInt(id_obra) }, { raw: true }, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

async function registrarBatch(queries) {
    const client = getRawClient();
    if (!client) throw new Error('Cassandra no conectado');

    await client.batch(queries, { prepare: true });
}

module.exports = {
    registrarEvento, registrarCambioEstatus, findAllLogs,
    findLogsByUser, findLogsByUserAndType, findObrasConHistorial,
    findHistorialByObra, registrarBatch
};
