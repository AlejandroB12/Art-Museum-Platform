module.exports = {

    fields: {
        
        id_obra: { type: 'int', default: null },
        fecha_cambio: { type: 'timestamp', default: { $db_function: 'toTimestamp(now())' } },
        estatus_anterior: { type: 'text', default: null },
        estatus_nuevo: { type: 'text', default: null },
        modificado_por: { type: 'int', default: null },
        motivo: { type: 'text', default: '' }
    },

    key: [['id_obra'], 'fecha_cambio'],
    clustering_order: { fecha_cambio: 'DESC' },
    table_name: 'historial_estatus_obra',

    options: {
        timestamps: false,
        versions: false
    }
};
