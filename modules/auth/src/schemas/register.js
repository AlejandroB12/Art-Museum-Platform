const { z } = require('zod');

const registerSchema = z.object({
    nombre: z.string().min(1, "El nombre es requerido"),
    apellido: z.string().min(1, "El apellido es requerido"),
    telefono: z.string().optional(),
    correo: z.string().email("Debe ser un email válido"),
    password: z.string().min(4, "La contraseña debe tener al menos 4 caracteres"),
    cedula: z.string().min(1, "La cédula es requerida"),
    parroquia: z.string().optional(),
    calle: z.string().optional()
});

module.exports = { registerSchema };
