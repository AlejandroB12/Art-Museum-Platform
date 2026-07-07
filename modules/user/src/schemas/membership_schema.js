const { z } = require('zod');

const membershipQuerySchema = z.object({
    id_usuario: z.string().optional()
});

module.exports = { membershipQuerySchema };
