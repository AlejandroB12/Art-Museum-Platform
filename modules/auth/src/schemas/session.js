const { z } = require('zod');

const usuarioActualSchema = z.object({});

const estadoUsuarioSchema = z.object({});

const logoutSchema = z.object({});

const sessionUserSchema = z.object({
    id_usuario: z.number().int().positive(),
    Nombre: z.string(),
    Email: z.string().email(),
    Rol: z.string()
});

const estadoUsuarioResponseSchema = z.object({
    autenticado: z.boolean(),
    puedeAdquirir: z.boolean().optional(),
    id_usuario: z.number().int().positive().optional(),
    rol: z.string().optional()
});

module.exports = {
    usuarioActualSchema,
    estadoUsuarioSchema,
    logoutSchema,
    sessionUserSchema,
    estadoUsuarioResponseSchema
};
