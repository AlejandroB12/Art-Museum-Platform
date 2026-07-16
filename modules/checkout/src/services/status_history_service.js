const auditRepo = require('../repositories/audit_repository');

async function getHistorialByObra(id_obra) {
    const rows = await auditRepo.findHistorialByObra(id_obra);
    return rows.map(row => ({
        id_obra: row.id_obra,
        fecha_cambio: row.fecha_cambio,
        estatus_anterior: row.estatus_anterior,
        estatus_nuevo: row.estatus_nuevo,
        modificado_por: row.modificado_por,
        motivo: row.motivo
    }));
}

module.exports = { getHistorialByObra };
