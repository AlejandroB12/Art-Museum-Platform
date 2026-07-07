const { z } = require('zod');

const adminRegisterSchema = z.object({
  correo: z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  nombre: z.string().min(1, "El nombre es requerido"),
  apellido: z.string().min(1, "El apellido es requerido")
});

const userStatusSchema = z.object({
  Estatus: z.union([z.literal(0), z.literal(1)])
});

const toggleBuyerSchema = z.object({
  PuedeAdquirir: z.union([z.literal(0), z.literal(1)])
});

const searchBuyerSchema = z.object({
  email: z.string().email().optional(),
  cedula: z.string().optional()
}).refine(data => data.email || data.cedula, {
  message: "Debe proporcionar email o cédula"
});

module.exports = { adminRegisterSchema, userStatusSchema, toggleBuyerSchema, searchBuyerSchema };
