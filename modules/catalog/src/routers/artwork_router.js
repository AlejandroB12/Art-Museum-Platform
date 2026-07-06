/**
 * @openapi
 * components:
 *   schemas:
 *     Obra:
 *       type: object
 *       properties:
 *         id_obra:
 *           type: integer
 *         nombre:
 *           type: string
 *         fecha_creacion:
 *           type: string
 *           format: date
 *         precio_formateado:
 *           type: string
 *         estatus:
 *           type: string
 *         fotografia:
 *           type: string
 *         artista_nombre:
 *           type: string
 *         artista_apellido:
 *           type: string
 *         genero_nombre:
 *           type: string
 *         id_artista:
 *           type: integer
 *         artista_fotografia:
 *           type: string
 *     ArtistaCatalogo:
 *       type: object
 *       properties:
 *         id_artista:
 *           type: integer
 *         nombre:
 *           type: string
 *         apellido:
 *           type: string
 *         fecha_nacimiento:
 *           type: string
 *           format: date
 *         fotografia:
 *           type: string
 *         generos:
 *           type: string
 *         nacionalidad:
 *           type: string
 *         biografia:
 *           type: string
 *     ResultadoBusqueda:
 *       type: object
 *       properties:
 *         id_obra:
 *           type: integer
 *         nombre:
 *           type: string
 *         precio_formateado:
 *           type: string
 *         fotografia:
 *           type: string
 *         artista_nombre:
 *           type: string
 *         genero_nombre:
 *           type: string
 *         id_artista:
 *           type: integer
 *         tipo:
 *           type: string
 */

const express = require('express');
const router = express.Router();
const { validateQuery, validateParams } = require('../../../../shared/middlewares/validate_middleware');
const idSchema = require('../schemas/id_schema');
const artworkFilterSchema = require('../schemas/artwork_filter_schema');
const searchSchema = require('../schemas/search_schema');
const { listObrasFiltradas, listObrasDestacadas, getObraById, buscarObras } = require('../services/artwork_service');

/**
 * @swagger
 * /api/artworks/filtered:
 *   get:
 *     summary: Listar obras filtradas con paginación
 *     tags: [Obras]
 *     parameters:
 *       - in: query
 *         name: genero
 *         schema:
 *           type: string
 *         description: Filtrar por género (nombre exacto, case-insensitive)
 *       - in: query
 *         name: artista
 *         schema:
 *           type: integer
 *         description: Filtrar por ID de artista
 *       - in: query
 *         name: orden
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: Orden por precio
 *       - in: query
 *         name: pagina
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número de página
 *       - in: query
 *         name: limite
 *         schema:
 *           type: integer
 *           default: 12
 *         description: Elementos por página
 *     responses:
 *       200:
 *         description: Lista paginada de obras
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 obras:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Obra'
 *                 total:
 *                   type: integer
 *                 pagina:
 *                   type: integer
 *                 limite:
 *                   type: integer
 */
router.get('/artworks/filtered', validateQuery(artworkFilterSchema), async (req, res, next) => {
    try {
        const { genero, artista, orden, pagina, limite } = req.query;
        const result = await listObrasFiltradas(genero, artista, orden, pagina, limite);
        res.json(result);
    } catch (err) {
        next(err);
    }
});

/**
 * @swagger
 * /api/artworks/featured:
 *   get:
 *     summary: Obtener obras destacadas (top 20 por precio)
 *     tags: [Obras]
 *     responses:
 *       200:
 *         description: Lista de las 20 obras más caras
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Obra'
 */
router.get('/artworks/featured', async (req, res, next) => {
    try {
        const obras = await listObrasDestacadas();
        res.json(obras);
    } catch (err) {
        next(err);
    }
});

/**
 * @swagger
 * /api/artworks/search:
 *   get:
 *     summary: Buscar obras por nombre, género o artista
 *     tags: [Obras]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 2
 *         description: Término de búsqueda
 *     responses:
 *       200:
 *         description: Resultados de búsqueda
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ResultadoBusqueda'
 *       400:
 *         description: Consulta demasiado corta
 */
router.get('/artworks/search', validateQuery(searchSchema), async (req, res, next) => {
    try {
        const results = await buscarObras(req.query.q);
        res.json(results);
    } catch (err) {
        next(err);
    }
});

/**
 * @swagger
 * /api/artworks/{id}:
 *   get:
 *     summary: Obtener una obra por ID
 *     tags: [Obras]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la obra
 *     responses:
 *       200:
 *         description: Obra encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Obra'
 *       404:
 *         description: Obra no encontrada
 */
router.get('/artworks/:id', validateParams(idSchema), async (req, res, next) => {
    try {
        const obra = await getObraById(req.params.id);
        if (!obra) {
            return res.status(404).json({ success: false, message: 'Obra no encontrada' });
        }
        res.json(obra);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
