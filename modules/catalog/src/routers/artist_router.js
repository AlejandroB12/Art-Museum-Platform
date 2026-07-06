const express = require('express');
const router = express.Router();
const { validateQuery, validateParams } = require('../../../../shared/middlewares/validate_middleware');
const idSchema = require('../schemas/id_schema');
const artistDetailSchema = require('../schemas/artist_detail_schema');
const { listArtistas, getArtistaDetalle, listArtistasCatalogo } = require('../services/artist_service');

/**
 * @swagger
 * /api/artists:
 *   get:
 *     summary: Listar todos los artistas
 *     tags: [Artistas]
 *     responses:
 *       200:
 *         description: Lista de artistas (id, nombre, apellido)
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id_artista:
 *                     type: integer
 *                   nombre:
 *                     type: string
 *                   apellido:
 *                     type: string
 */
router.get('/artists', async (req, res, next) => {
    try {
        const artistas = await listArtistas();
        res.json(artistas);
    } catch (err) {
        next(err);
    }
});

/**
 * @swagger
 * /api/artists/{id}/detail:
 *   get:
 *     summary: Obtener detalle de un artista con sus obras
 *     tags: [Artistas]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del artista
 *       - in: query
 *         name: orden_fecha
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: Orden de las obras por fecha
 *     responses:
 *       200:
 *         description: Detalle del artista y lista de sus obras
 *       404:
 *         description: Artista no encontrado
 */
router.get('/artists/:id/detail', validateParams(idSchema), validateQuery(artistDetailSchema), async (req, res, next) => {
    try {
        const { orden_fecha } = req.query;
        const result = await getArtistaDetalle(req.params.id, orden_fecha);
        if (!result) {
            return res.status(404).json({ success: false, message: 'Artista no encontrado' });
        }
        res.json(result);
    } catch (err) {
        next(err);
    }
});

/**
 * @swagger
 * /api/artists/catalog:
 *   get:
 *     summary: Listar artistas para el catálogo (con géneros)
 *     tags: [Artistas]
 *     responses:
 *       200:
 *         description: Lista de artistas con géneros, foto y biografía
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ArtistaCatalogo'
 */
router.get('/artists/catalog', async (req, res, next) => {
    try {
        const artistas = await listArtistasCatalogo();
        res.json(artistas);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
