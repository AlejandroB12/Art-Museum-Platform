const { z } = require('zod');

const paymentRequestSchema = z.object({
    monto: z.number().positive('El monto debe ser positivo').default(10.00)
});

module.exports = { paymentRequestSchema };
