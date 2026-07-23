const { z } = require('zod');

const reservaSchema = z.object({
    id_obra: z.coerce.number().int().positive("ID de obra inválido")
});

const cancelarReservaSchema = z.object({
    id_obra: z.coerce.number().int().positive("ID de obra inválido")
});

module.exports = { reservaSchema, cancelarReservaSchema };
