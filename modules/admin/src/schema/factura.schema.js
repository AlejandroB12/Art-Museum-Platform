const { z } = require('zod');

const facturaSchema = z.object({
    id_obra: z.number().int().positive(),
    id_admin: z.number().int().optional(),
    precio_neto: z.number().positive(),
    porcentaje_comision: z.number().min(0).max(100),
    buyer_nombre: z.string().optional(),
    buyer_apellido: z.string().optional(),
    buyer_email: z.string().optional(),
    buyer_cedula: z.string().optional()
});

module.exports = facturaSchema;
