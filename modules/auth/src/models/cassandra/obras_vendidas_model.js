module.exports = {

    fields: {

        anio_mes: { type: 'text', default: null },
        fecha_venta: { type: 'timestamp', default: null },
        id_factura: { type: 'int', default: null },
        id_obra: { type: 'int', default: null },
        nombre_obra: { type: 'text', default: null },
        precio_venta: { type: 'decimal', default: null },
        iva: { type: 'decimal', default: null },
        total_pagado: { type: 'decimal', default: null },
        ganancia_museo_usd: { type: 'decimal', default: null },
        porcentaje_comision: { type: 'decimal', default: null },
        id_comprador: { type: 'int', default: null },
        comprador_nombre: { type: 'text', default: '' },
        comprador_apellido: { type: 'text', default: '' },
        comprador_email: { type: 'text', default: '' },
        comprador_cedula: { type: 'int', default: null },
        id_admin: { type: 'int', default: null },
        admin_nombre: { type: 'text', default: '' }
    },

    key: [['anio_mes'], 'fecha_venta', 'id_factura'],
    clustering_order: { fecha_venta: 'DESC', id_factura: 'ASC' },
    table_name: 'obras_vendidas_por_periodo',
    
    options: {
        timestamps: false,
        versions: false
    }
};
