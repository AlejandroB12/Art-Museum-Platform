const { z } = require('zod');

const dateRangeSchema = z.object({
  fecha_inicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato YYYY-MM-DD"),
  fecha_fin: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato YYYY-MM-DD")
});

const cassandraMesSchema = z.object({
  anio_mes: z.string().regex(/^\d{4}-\d{2}$/, "Formato YYYY-MM")
});

const cassandraMesesSchema = z.object({
  meses: z.string().min(1, "Lista de meses requerida")
});

const cassandraBitacoraSchema = z.object({
  id_usuario: z.string().optional(),
  tipo_evento: z.string().optional()
});

module.exports = { dateRangeSchema, cassandraMesSchema, cassandraMesesSchema, cassandraBitacoraSchema };
