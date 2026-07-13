const { z } = require('zod');

const LoginRequest = z.object({
    email: z.string().trim().toLowerCase().min(1, 'El correo es requerido').max(120, 'El correo no puede exceder 120 caracteres').email('Debe ser un correo electrónico válido'),
    password: z.string().min(1, 'La contraseña es requerida').max(64, 'La contraseña no puede exceder 64 caracteres')
}).strict();

const LoginResponse = z.object({
    id_usuario: z.number().int().positive(),
    nombre: z.string(),
    email: z.string().email(),
    rol: z.string()
});

module.exports = { LoginRequest, LoginResponse };
