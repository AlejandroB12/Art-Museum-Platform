const { z } = require('zod');

const generoSchema = z.object({
    nombre: z.string().min(1, "El nombre es requerido"),
    atributos: z.array(z.object({
        nombre: z.string(),
        tipo: z.enum(['string', 'number', 'boolean']),
        requerido: z.boolean().optional()
    })).optional()
});

module.exports = generoSchema;
