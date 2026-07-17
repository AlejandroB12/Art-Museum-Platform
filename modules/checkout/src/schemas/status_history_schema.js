const { z } = require('zod');

const idObraParamSchema = z.object({
    id: z.coerce.number().int().positive("ID de obra inválido")
});

module.exports = { idObraParamSchema };
