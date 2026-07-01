const { z } = require('zod');

const loginSchema = z.object({
    username: z.string().email("Debe ser un email válido"),
    password: z.string().min(1, "La contraseña es requerida")
});

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

const recoverySchema = z.object({
    correo: z.string().email("Debe ser un email válido")
});

const updatePasswordSchema = z.object({
    userId: z.union([z.string(), z.number()]),
    newPassword: z.string().min(4, "La contraseña debe tener al menos 4 caracteres")
});

const securityQuestionsSchema = z.array(z.object({
    pregunta: z.string().min(1),
    resp: z.string().min(1)
})).min(1, "Debe proporcionar al menos una pregunta");

module.exports = { loginSchema, registerSchema, recoverySchema, updatePasswordSchema, securityQuestionsSchema };
