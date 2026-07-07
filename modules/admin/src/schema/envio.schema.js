const { z } = require('zod');

const envioSchema = z.object({
    id_factura: z.number().int().positive(),
    municipio: z.string().min(1, "El municipio es requerido"),
    parroquia: z.string().min(1, "La parroquia es requerida"),
    direccion_detallada: z.string().min(1, "La dirección es requerida"),
    numero_guia: z.string().optional()
});

module.exports = envioSchema;
