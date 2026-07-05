const { z } = require('zod');

const compraUsuarioSchema = z.object({
  Nombre: z.string(),
  Precio: z.number().or(z.string()),
  Fecha_emision: z.string(),
  Genero: z.string().nullable(),
  Estado: z.enum(['Pagado', 'Reservado'])
});

const comprasUsuarioResponseSchema = z.array(compraUsuarioSchema);

module.exports = { compraUsuarioSchema, comprasUsuarioResponseSchema };
