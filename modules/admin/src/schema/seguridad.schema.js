const { z } = require('zod');

const eventoSeguridadSchema = z.object({
  id_usuario: z.number().int().positive(),
  tipo_evento: z.string().min(1).max(50),
  descripcion: z.string().optional(),
  ip_origen: z.string().optional(),
  dispositivo: z.string().optional()
});

const cambioEstatusSchema = z.object({
  id_obra: z.number().int().positive(),
  estatus_anterior: z.string().min(1).max(50),
  estatus_nuevo: z.string().min(1).max(50),
  modificado_por: z.number().int().positive().nullable().optional(),
  motivo: z.string().optional()
});

module.exports = { eventoSeguridadSchema, cambioEstatusSchema };
