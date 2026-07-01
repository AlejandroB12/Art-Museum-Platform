const mongoose = require('mongoose');

const detallesSchema = new mongoose.Schema({
    tecnica_principal: String,
    soporte_base: String,
    requiere_enmarcado: Boolean,
    material_predominante: String,
    requiere_pedestal: Boolean,
    clasificacion_espacio: String,
    formato_origen: String,
    tipo_impresion_estandar: String,
    requiere_revelado_quimico: Boolean,
    metal_base_dominante: String,
    kilataje_estandar: String,
    requiere_certificado_autenticidad: Boolean,
    tecnica_acabado: String,
    tipo_arcilla_base: String,
    temperatura_coccion_promedio_celsius: Number
}, { _id: false });

const obraSchema = new mongoose.Schema({
    _id: Number,
    nombre: { type: String, required: true },
    descripcion: String,
    precio: { type: Number, required: true },
    fecha_creacion: Date,
    fotografia: String,
    estado_obra: { type: String, default: 'Disponible' },
    autores: [{ type: Number, ref: 'Autor' }],
    genero: {
        nombre: String,
        detalles: detallesSchema
    }
});

module.exports = mongoose.model('Obra', obraSchema, 'obras');
