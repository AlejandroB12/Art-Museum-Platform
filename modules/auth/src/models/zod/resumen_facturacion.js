const { z } = require('zod');

const ResumenFacturacionMensual = z.object({
  anio_mes: z.string().regex(/^\d{4}-\d{2}$/),
  total_ventas: z.number().int().nonnegative(),
  monto_total: z.number().nonnegative(),
  comision_total: z.number().nonnegative(),
  ganancia_museo_total: z.number(),
  obras_vendidas: z.number().int().nonnegative().optional(),
  periodo_inicio: z.date().optional(),
  periodo_fin: z.date().optional()
});

module.exports = { ResumenFacturacionMensual };
