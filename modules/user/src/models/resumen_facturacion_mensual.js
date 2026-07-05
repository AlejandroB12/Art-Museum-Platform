const { z } = require('zod');

const resumenFacturacionMensual = z.object({
  anio_mes: z.string().regex(/^\d{4}-\d{2}$/, 'Formato YYYY-MM'),
  total_facturas: z.number().int().nonnegative(),
  monto_neto_total: z.number().nonnegative(),
  iva_total: z.number().nonnegative(),
  total_pagado_total: z.number().nonnegative(),
  ganancia_museo_total: z.number(),
  comision_promedio: z.number().min(0).max(100),
  obra_mas_cara: z.number().nonnegative(),
  obra_mas_barata: z.number().nonnegative()
});

module.exports = { resumenFacturacionMensual };
