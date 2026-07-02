const { z } = require('zod');

const reservaSchema = z.object({
    id_obra: z.number().int().positive("ID de obra inválido")
});

module.exports = { reservaSchema };
