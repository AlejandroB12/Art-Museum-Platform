const { z } = require('zod');

const BitacoraSeguridad = z.object({
  id_usuario: z.number().int().positive(),
  fecha_evento: z.date(),
  tipo_evento: z.string().max(50),
  descripcion: z.string().optional(),
  ip_origen: z.string().optional(),
  dispositivo: z.string().optional()
});

const RegistrarEventoSeguridadInput = z.object({
  id_usuario: z.number().int().positive(),
  tipo_evento: z.string().min(1).max(50),
  descripcion: z.string().optional(),
  ip_origen: z.string().optional(),
  dispositivo: z.string().optional()
});

module.exports = { BitacoraSeguridad, RegistrarEventoSeguridadInput };
