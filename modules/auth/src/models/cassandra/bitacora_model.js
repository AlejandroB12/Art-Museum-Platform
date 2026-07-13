module.exports = {

    fields: {

        id_usuario: { type: 'int', default: null },
        fecha_evento: { type: 'timestamp', default: { $db_function: 'toTimestamp(now())' } },
        tipo_evento: { type: 'text', default: null },
        descripcion: { type: 'text', default: '' },
        ip_origen: { type: 'text', default: '' },
        dispositivo: { type: 'text', default: '' }
    },

    key: [['id_usuario'], 'fecha_evento', 'tipo_evento'],
    table_name: 'bitacora_seguridad',
    
    options: {
        timestamps: false,
        versions: false
    }
};
