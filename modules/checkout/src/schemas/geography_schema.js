const { z } = require('zod');

const idEstadoParamSchema = z.object({
    id_estado: z.coerce.number().int().positive("ID de estado inválido")
});

const idMunicipioParamSchema = z.object({
    id_municipio: z.coerce.number().int().positive("ID de municipio inválido")
});

module.exports = { idEstadoParamSchema, idMunicipioParamSchema };
