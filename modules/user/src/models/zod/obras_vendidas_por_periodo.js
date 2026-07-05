const { z } = require('zod');

const obrasVendidasPorPeriodo = z.object({
  anio_mes: z.string().regex(/^\d{4}-\d{2}$/, 'Formato YYYY-MM'),
  fecha_venta: z.date(),
  id_factura: z.number().int().positive(),
  id_obra: z.number().int().positive(),
  nombre_obra: z.string(),
  precio_venta: z.number().positive(),
  iva: z.number(),
  total_pagado: z.number().positive(),
  ganancia_museo_usd: z.number(),
  porcentaje_comision: z.number().min(0).max(100),
  id_comprador: z.number().int().positive(),
  comprador_nombre: z.string(),
  comprador_apellido: z.string(),
  comprador_email: z.string().email(),
  comprador_cedula: z.number().int(),
  id_admin: z.number().int().positive(),
  admin_nombre: z.string()
});

module.exports = { obrasVendidasPorPeriodo };
