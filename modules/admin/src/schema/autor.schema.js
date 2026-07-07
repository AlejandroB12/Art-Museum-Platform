const { z } = require('zod');

const autorCreateSchema = z.object({
    nombre: z.string().min(1, "El nombre es requerido"),
    apellido: z.string().min(1, "El apellido es requerido"),
    nacionalidad: z.string().optional(),
    biografia: z.string().optional(),
    fotografia_base64: z.string().optional(),
    fotografia_nombre: z.string().optional()
});

module.exports = autorCreateSchema;
