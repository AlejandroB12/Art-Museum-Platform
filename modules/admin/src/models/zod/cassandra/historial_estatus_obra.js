const { z } = require('zod');

const HistorialEstatusObra = z.object({
  id_obra: z.number().int().positive(),
  fecha_cambio: z.date(),
  estatus_anterior: z.string().max(50),
  estatus_nuevo: z.string().max(50),
  modificado_por: z.number().int().positive().nullable(),
  motivo: z.string().optional()
});

const RegistrarCambioEstatusInput = z.object({
  id_obra: z.number().int().positive(),
  estatus_anterior: z.string().min(1).max(50),
  estatus_nuevo: z.string().min(1).max(50),
  modificado_por: z.number().int().positive().nullable().optional(),
  motivo: z.string().optional()
});

module.exports = { HistorialEstatusObra, RegistrarCambioEstatusInput };
