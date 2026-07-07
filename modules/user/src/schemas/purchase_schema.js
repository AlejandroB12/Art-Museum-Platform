const { z } = require('zod');

const purchaseHistorySchema = z.object({
    id_usuario: z.number().int().positive().optional()
});

const shippingDataSchema = z.object({
    id_usuario: z.number().int().positive().optional()
});

module.exports = { purchaseHistorySchema, shippingDataSchema };
