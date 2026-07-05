const { z } = require('zod');

const bitacoraSeguridad = z.object({
  id_usuario: z.number().int().positive(),
  fecha_evento: z.date(),
  tipo_evento: z.string().min(1),
  descripcion: z.string(),
  ip_origen: z.string().optional().default(''),
  dispositivo: z.string().optional().default('')
});

module.exports = { bitacoraSeguridad };
