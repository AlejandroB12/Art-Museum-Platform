const { z } = require('zod');

const artworkFilterSchema = z.object({
    
    genero: z.string().optional(),
    artista: z.string().regex(/^\d+$/).optional(),
    orden: z.enum(['asc', 'desc']).optional(),
    pagina: z.string().regex(/^\d+$/).default('1'),
    limite: z.string().regex(/^\d+$/).default('12')
});

module.exports = artworkFilterSchema;
