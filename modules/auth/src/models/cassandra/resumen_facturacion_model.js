module.exports = {

    fields: {
        
        anio_mes: { type: 'text', default: null },
        total_facturas: { type: 'int', default: null },
        monto_neto_total: { type: 'decimal', default: null },
        iva_total: { type: 'decimal', default: null },
        total_pagado_total: { type: 'double', default: null },
        ganancia_museo_total: { type: 'double', default: null },
        comision_promedio: { type: 'decimal', default: null },
        obra_mas_cara: { type: 'decimal', default: null },
        obra_mas_barata: { type: 'decimal', default: null }
    },

    key: [['anio_mes']],
    table_name: 'resumen_facturacion_mensual',

    options: {
        timestamps: false,
        versions: false
    }
};
