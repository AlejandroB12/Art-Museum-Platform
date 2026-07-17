const { z } = require('zod');

const PasswordRecoveryRequest = z.object({
    correo: z.string()
        .trim()
        .toLowerCase()
        .min(1, 'El correo es requerido')
        .max(120, 'El correo no puede exceder 120 caracteres')
        .email('Debe ser un correo electrónico válido')
}).strict();

const PasswordRecoveryResponse = z.object({
    success: z.literal(true),
    message: z.string()
});

module.exports = { PasswordRecoveryRequest, PasswordRecoveryResponse };
