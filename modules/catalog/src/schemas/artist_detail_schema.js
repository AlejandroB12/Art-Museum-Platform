const { z } = require('zod');

// Schema para validar los parámetros de consulta de la ruta /artista-detalle/:id
const artistDetailSchema = z.object({

    orden_fecha: z.enum(['asc', 'desc']).optional()
});

module.exports = artistDetailSchema;
