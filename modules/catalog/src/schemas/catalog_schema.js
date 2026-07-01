const { z } = require('zod');

const obrasFilterSchema = z.object({
    genero: z.string().optional(),
    artista: z.string().optional(),
    orden: z.enum(['asc', 'desc']).optional()
});

module.exports = { obrasFilterSchema };
