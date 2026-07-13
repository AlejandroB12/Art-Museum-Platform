const { z } = require('zod');

const ESTATUS_OBRA = [
    'Disponible',
    'Reservado',
    'Vendida',
    'En restauración',
    'En exhibición',
    'Prestada',
    'Dañada',
    'Perdida'
];

const HistorialEstatusObra = z.object({
    id_obra: z.number().int().positive('ID de obra inválido'),
    fecha_cambio: z.date({ required_error: 'La fecha de cambio es requerida' }),
    estatus_anterior: z.enum(ESTATUS_OBRA, {
        errorMap: () => ({ message: `El estatus anterior debe ser uno de: ${ESTATUS_OBRA.join(', ')}` })
    }),
    estatus_nuevo: z.enum(ESTATUS_OBRA, {
        errorMap: () => ({ message: `El estatus nuevo debe ser uno de: ${ESTATUS_OBRA.join(', ')}` })
    }),
    modificado_por: z.number().int().positive().nullable(),
    motivo: z.string()
        .max(500, 'El motivo no puede exceder 500 caracteres')
        .optional()
        .default('')
}).strict();

const RegistrarCambioEstatusInput = z.object({
    id_obra: z.number().int().positive('ID de obra inválido'),
    estatus_anterior: z.enum(ESTATUS_OBRA, {
        errorMap: () => ({ message: `El estatus anterior debe ser uno de: ${ESTATUS_OBRA.join(', ')}` })
    }),
    estatus_nuevo: z.enum(ESTATUS_OBRA, {
        errorMap: () => ({ message: `El estatus nuevo debe ser uno de: ${ESTATUS_OBRA.join(', ')}` })
    }),
    modificado_por: z.number().int().positive().nullable().optional(),
    motivo: z.string()
        .max(500, 'El motivo no puede exceder 500 caracteres')
        .optional()
        .default('')
}).strict();

module.exports = { HistorialEstatusObra, RegistrarCambioEstatusInput, ESTATUS_OBRA };
