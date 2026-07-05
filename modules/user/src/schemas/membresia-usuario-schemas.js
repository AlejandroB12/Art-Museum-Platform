const { z } = require('zod');

const membresiaUsuarioParamsSchema = z.object({
  idUsuario: z.number().int().positive('El ID de usuario debe ser un entero positivo')
});

const membresiaUsuarioResponseSchema = z.object({
  Concepto: z.string(),
  FechaInicio: z.string(),
  TotalPagado: z.number(),
  FechaVencimiento: z.string().nullable(),
  EstadoPago: z.string(),
  DiasRestantes: z.number().int()
});

module.exports = { membresiaUsuarioParamsSchema, membresiaUsuarioResponseSchema };
