const { z } = require('zod');

// POST /login-auth
const loginSchema = z.object({
    username: z.string().email("Debe ser un email válido"),
    password: z.string().min(1, "La contraseña es requerida")
});

// POST /recuperar-pw
const recoverySchema = z.object({
    correo: z.string().email("Debe ser un email válido")
});

// POST /update-password
const updatePasswordSchema = z.object({
    userId: z.union([z.string(), z.number()]),
    newPassword: z.string().min(4, "La contraseña debe tener al menos 4 caracteres")
});

// POST /registrar
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

// POST /guardar-seguridad (body es un array)
const securityQuestionsSchema = z.array(z.object({
    pregunta: z.string().min(1, "La pregunta no puede estar vacía"),
    resp: z.string().min(1, "La respuesta no puede estar vacía")
})).min(1, "Debe proporcionar al menos una pregunta");

// GET /api/usuario-actual (no requiere body, solo sesión)
const usuarioActualSchema = z.object({});

// GET /api/estado-usuario (no requiere body, solo sesión)
const estadoUsuarioSchema = z.object({});

// GET /logout (no requiere body, solo sesión)
const logoutSchema = z.object({});

// Session user shape (response)
const sessionUserSchema = z.object({
    id_usuario: z.number().int().positive(),
    Nombre: z.string(),
    Email: z.string().email(),
    Rol: z.string()
});

// Estado-usuario response shape
const estadoUsuarioResponseSchema = z.object({
    autenticado: z.boolean(),
    puedeAdquirir: z.boolean().optional(),
    id_usuario: z.number().int().positive().optional(),
    rol: z.string().optional()
});

module.exports = {
    loginSchema,
    recoverySchema,
    updatePasswordSchema,
    registerSchema,
    securityQuestionsSchema,
    usuarioActualSchema,
    estadoUsuarioSchema,
    logoutSchema,
    sessionUserSchema,
    estadoUsuarioResponseSchema
};
