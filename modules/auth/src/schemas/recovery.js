const { z } = require('zod');

const recoverySchema = z.object({
    correo: z.string().email("Debe ser un email válido")
});

module.exports = { recoverySchema };
