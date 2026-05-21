const mongoose = require('mongoose');

const detallesSchema = new mongoose.Schema({
    // Pintura
    tecnica_principal: String,
    soporte_base: String,
    requiere_enmarcado: Boolean,
    // Escultura
    material_predominante: String,
    requiere_pedestal: Boolean,
    clasificacion_espacio: String,
    // Fotografía
    formato_origen: String,
    tipo_impresion_estandar: String,
    requiere_revelado_quimico: Boolean,
    // Orfebreria
    metal_base_dominante: String,
    kilataje_estandar: String,
    requiere_certificado_autenticidad: Boolean,
    // Ceramica
    tecnica_acabado: String,
    tipo_arcilla_base: String,
    temperatura_coccion_promedio_celsius: Number
}, { _id: false });

const obraSchema = new mongoose.Schema({
    _id: Number,
    nombre: { type: String, required: true },
    fecha_creacion: Date,
    precio: { type: Number, required: true },
    estado_obra: {
        type: String,
        enum: ['Disponible', 'Reservado', 'Vendida'],
        default: 'Disponible'
    },
    fotografia: String,
    autores: [{ type: Number, ref: 'Autor' }],
    genero: {
        nombre: {
            type: String,
            required: true
        },
        detalles: detallesSchema
    }
});

module.exports = mongoose.model('Obra', obraSchema, 'obras');
