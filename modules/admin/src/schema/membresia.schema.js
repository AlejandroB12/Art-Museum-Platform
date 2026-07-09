const { z } = require('zod');

const approvePaymentSchema = z.object({
  id_solicitud: z.number().int().positive(),
  id_usuario: z.number().int().positive()
});

const registerPaymentSchema = z.object({
  id_usuario: z.number().int().positive()
});

module.exports = { approvePaymentSchema, registerPaymentSchema };
