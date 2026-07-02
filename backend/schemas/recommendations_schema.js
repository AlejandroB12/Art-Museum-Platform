const { z } = require('zod');

/**
 * @openapi
 * /api/recomendaciones/mismo-genero/{idUsuario}:
 *   get:
 *     tags: [Recomendaciones]
 *     parameters:
 *       - in: path
 *         name: idUsuario
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Recomendaciones del mismo género
 * /api/recomendaciones/colaborativo/{idUsuario}:
 *   get:
 *     tags: [Recomendaciones]
 *     parameters:
 *       - in: path
 *         name: idUsuario
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Recomendaciones colaborativas
 * /api/recomendaciones/para-ti/{idUsuario}:
 *   get:
 *     tags: [Recomendaciones]
 *     parameters:
 *       - in: path
 *         name: idUsuario
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Recomendaciones personalizadas
 * /api/buscar:
 *   get:
 *     tags: [Búsqueda]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Resultados de búsqueda
 * /api/actividad/registrar:
 *   post:
 *     tags: [Recomendaciones]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [idObra]
 *             properties:
 *               idUsuario: { type: integer }
 *               idObra: { type: integer }
 *               tipo: { type: string }
 *     responses:
 *       200:
 *         description: Actividad registrada
 */

const actividadSchema = z.object({
    idUsuario: z.number().int().optional().default(9999),
    idObra: z.number().int().positive("ID de obra requerido"),
    tipo: z.string().optional().default('vista_detalle')
});

module.exports = { actividadSchema };
