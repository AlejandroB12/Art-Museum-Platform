const { z } = require('zod');

const updatePasswordSchema = z.object({
    userId: z.union([z.string(), z.number()]),
    newPassword: z.string().min(4, "La contraseña debe tener al menos 4 caracteres")
});

module.exports = { updatePasswordSchema };
