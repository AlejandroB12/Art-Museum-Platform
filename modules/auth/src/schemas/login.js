const { z } = require('zod');

const loginSchema = z.object({
    username: z.string().email("Debe ser un email válido"),
    password: z.string().min(1, "La contraseña es requerida")
});

module.exports = { loginSchema };
