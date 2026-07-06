const { z } = require('zod');

const idSchema = z.object({
    
    id: z.string().regex(/^\d+$/, 'El ID debe ser un numero valido')
});

module.exports = idSchema;
