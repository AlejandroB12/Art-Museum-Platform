const { z } = require('zod');

const actividadSchema = z.object({
    idUsuario: z.number().optional().default(9999),
    idObra: z.number().int().positive(),
    tipo: z.enum(['vista_detalle', 'compra', 'busqueda', 'click']).optional().default('vista_detalle'),
    duracion: z.number().optional()
});

const busquedaSchema = z.object({
    q: z.string().min(1)
});

module.exports = { actividadSchema, busquedaSchema };
