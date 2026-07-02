const { z } = require('zod');

/**
 * @openapi
 * /api/obras-filtradas:
 *   get:
 *     tags: [Catálogo]
 *     summary: Listar obras filtradas
 *     parameters:
 *       - in: query
 *         name: genero
 *         schema: { type: string }
 *       - in: query
 *         name: artista
 *         schema: { type: string }
 *       - in: query
 *         name: orden
 *         schema: { type: string, enum: [asc, desc] }
 *     responses:
 *       200:
 *         description: Lista de obras
 * /api/autores:
 *   get:
 *     tags: [Catálogo]
 *     summary: Listar autores
 *     responses:
 *       200:
 *         description: Lista de autores
 * /api/autor-detalle/{id}:
 *   get:
 *     tags: [Catálogo]
 *     summary: Detalle de autor con sus obras
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *       - in: query
 *         name: ordenDate
 *         schema: { type: string, enum: [asc, desc] }
 *     responses:
 *       200:
 *         description: Autor y obras
 * /api/artistas-catalogo:
 *   get:
 *     tags: [Catálogo]
 *     summary: Listar artistas con especialidades
 *     responses:
 *       200:
 *         description: Lista de artistas
 */

const obrasFilterSchema = z.object({
    genero: z.string().optional(),
    artista: z.string().optional(),
    orden: z.enum(['asc', 'desc']).optional()
});

module.exports = { obrasFilterSchema };
