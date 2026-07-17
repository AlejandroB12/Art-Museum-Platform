const { z } = require('zod');

const ROLES_VALIDOS = ['comprador', 'administrador', 'vendedor'];

const UsuarioActualRequest = z.object({}).strict();

const EstadoUsuarioRequest = z.object({}).strict();

const LogoutRequest = z.object({}).strict();

const SessionUserSchema = z.object({
    id_usuario: z.number().int().positive('ID de usuario inválido'),
    nombre: z.string()
        .trim()
        .min(1, 'El nombre es requerido')
        .max(80, 'El nombre no puede exceder 80 caracteres'),
    email: z.string()
        .trim()
        .toLowerCase()
        .email('Debe ser un correo electrónico válido'),
    rol: z.enum(ROLES_VALIDOS, {
        errorMap: () => ({ message: `El rol debe ser uno de: ${ROLES_VALIDOS.join(', ')}` })
    })
}).strict();

const EstadoUsuarioResponse = z.object({
    autenticado: z.boolean(),
    puedeAdquirir: z.boolean().optional(),
    id_usuario: z.number().int().positive().optional(),
    rol: z.enum(ROLES_VALIDOS).optional()
}).strict();

module.exports = {
    UsuarioActualRequest,
    EstadoUsuarioRequest,
    LogoutRequest,
    SessionUserSchema,
    EstadoUsuarioResponse,
    ROLES_VALIDOS
};
