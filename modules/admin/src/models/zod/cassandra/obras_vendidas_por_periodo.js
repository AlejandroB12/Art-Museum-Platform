const { z } = require('zod');

const ObraVendidaPorPeriodo = z.object({
  anio_mes: z.string().regex(/^\d{4}-\d{2}$/),
  fecha_venta: z.date(),
  id_factura: z.number().int().positive(),
  id_obra: z.number().int().positive(),
  nombre_obra: z.string(),
  precio_venta: z.number().positive(),
  iva: z.number(),
  total_pagado: z.number().positive(),
  ganancia_museo_usd: z.number(),
  porcentaje_comision: z.number(),
  id_comprador: z.number().int().positive(),
  comprador_nombre: z.string().optional(),
  comprador_apellido: z.string().optional(),
  comprador_email: z.string().email().optional(),
  comprador_cedula: z.string().optional(),
  id_admin: z.number().int().positive(),
  admin_nombre: z.string().optional()
});

module.exports = { ObraVendidaPorPeriodo };
