const { z } = require('zod');

const cedulaPattern = /^[VE]?-?\d{5,10}$/i;
const phonePattern = /^(\+?\d{1,3})?[-.\s]?0?(4\d{2})[-.\s]?\d{3}[-.\s]?\d{4}$/;

const RegisterRequest = z.object({
    nombre: z.string()
        .trim()
        .min(2, 'El nombre debe tener al menos 2 caracteres')
        .max(80, 'El nombre no puede exceder 80 caracteres')
        .regex(/^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s]+$/, 'El nombre solo puede contener letras y espacios'),
    apellido: z.string()
        .trim()
        .min(2, 'El apellido debe tener al menos 2 caracteres')
        .max(80, 'El apellido no puede exceder 80 caracteres')
        .regex(/^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s]+$/, 'El apellido solo puede contener letras y espacios'),
    telefono: z.string()
        .trim()
        .regex(phonePattern, 'Debe ser un número de teléfono venezolano válido (ej: 0412-1234567)')
        .optional()
        .or(z.literal('')),
    correo: z.string()
        .trim()
        .toLowerCase()
        .min(5, 'El correo debe tener al menos 5 caracteres')
        .max(120, 'El correo no puede exceder 120 caracteres')
        .email('Debe ser un correo electrónico válido'),
    password: z.string()
        .min(12, 'La contraseña debe tener al menos 12 caracteres')
        .max(64, 'La contraseña no puede exceder 64 caracteres'),
    confirmPassword: z.string()
        .min(1, 'Debe confirmar la contraseña'),
    cedula: z.string()
        .trim()
        .regex(cedulaPattern, 'Debe ser una cédula válida (ej: 12345678 o V-12345678)')
        .transform(val => val.replace(/\D/g, '')),
    parroquia: z.string()
        .trim()
        .optional()
        .or(z.literal('')),
    calle: z.string()
        .trim()
        .optional()
        .or(z.literal(''))
}).strict().refine(data => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword']
});

const RegisterResponse = z.object({
    id_usuario: z.number().int().positive(),
    nombre: z.string(),
    correo: z.string().email()
});

module.exports = { RegisterRequest, RegisterResponse };
