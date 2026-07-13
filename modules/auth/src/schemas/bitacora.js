const { z } = require('zod');

const TIPOS_EVENTO = [
    'REGISTRO_USUARIO',
    'INICIO_SESION',
    'CIERRE_SESION',
    'CAMBIO_CONTRASENA',
    'RECUPERACION_CONTRASENA',
    'ACTUALIZACION_PERFIL',
    'INTENTO_FALLIDO',
    'CUENTA_BLOQUEADA',
    'CUENTA_ACTIVADA',
    'SOLICITUD_PAGO',
    'PAGO_PROCESADO',
    'CAMBIO_ROL',
    'CAMBIO_ESTATUS_OBRA',
    'ELIMINACION_CUENTA'
];

const BitacoraSeguridad = z.object({
    id_usuario: z.number().int().positive('ID de usuario inválido'),
    fecha_evento: z.date({ required_error: 'La fecha del evento es requerida' }),
    tipo_evento: z.enum(TIPOS_EVENTO, {
        errorMap: () => ({ message: `El tipo de evento debe ser uno de: ${TIPOS_EVENTO.join(', ')}` })
    }),
    descripcion: z.string()
        .max(500, 'La descripción no puede exceder 500 caracteres')
        .optional()
        .default(''),
    ip_origen: z.string()
        .regex(/^(\d{1,3}\.){3}\d{1,3}$/, 'Debe ser una dirección IPv4 válida')
        .optional()
        .or(z.literal('')),
    dispositivo: z.string()
        .max(300, 'El dispositivo no puede exceder 300 caracteres')
        .optional()
        .default('')
}).strict();

const RegistrarEventoSeguridadInput = z.object({
    id_usuario: z.number().int().positive('ID de usuario inválido'),
    tipo_evento: z.enum(TIPOS_EVENTO, {
        errorMap: () => ({ message: `El tipo de evento debe ser uno de: ${TIPOS_EVENTO.join(', ')}` })
    }),
    descripcion: z.string()
        .max(500, 'La descripción no puede exceder 500 caracteres')
        .optional()
        .default(''),
    ip_origen: z.string()
        .regex(/^(\d{1,3}\.){3}\d{1,3}$/, 'Debe ser una dirección IPv4 válida')
        .optional()
        .or(z.literal('')),
    dispositivo: z.string()
        .max(300, 'El dispositivo no puede exceder 300 caracteres')
        .optional()
        .default('')
}).strict();

module.exports = { BitacoraSeguridad, RegistrarEventoSeguridadInput, TIPOS_EVENTO };
