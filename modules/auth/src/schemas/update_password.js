const { z } = require('zod');

const UpdatePasswordRequest = z.object({
    userId: z.union([z.string(), z.number()])
        .transform(val => Number(val))
        .pipe(z.number().int().positive('El ID de usuario debe ser un número positivo')),
    currentPassword: z.string()
        .min(1, 'La contraseña actual es requerida')
        .max(64, 'La contraseña no puede exceder 64 caracteres'),
    newPassword: z.string()
        .min(12, 'La contraseña debe tener al menos 12 caracteres')
        .max(64, 'La contraseña no puede exceder 64 caracteres'),
    confirmNewPassword: z.string()
        .min(1, 'Debe confirmar la nueva contraseña')
}).strict().refine(data => data.newPassword === data.confirmNewPassword, {
    message: 'Las contraseñas nuevas no coinciden',
    path: ['confirmNewPassword']
});

const UpdatePasswordResponse = z.object({
    message: z.string()
});

module.exports = { UpdatePasswordRequest, UpdatePasswordResponse };
