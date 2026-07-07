const { z } = require('zod');

const searchSchema = z.object({
    
    q: z.string().min(2, 'La busqueda debe tener al menos 2 caracteres').max(100)
});

module.exports = searchSchema;
