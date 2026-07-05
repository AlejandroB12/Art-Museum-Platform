const express = require('express');
const router = express.Router();
const { getMisCompras } = require('../services/get-mis-compras-service');

/**
 * @swagger
 * /mis-compras:
 *   get:
 *     summary: Retorna el historial de compras del usuario autenticado
 *     tags: [Usuario - Compras]
 *     responses:
 *       200:
 *         description: Historial de compras y reservas
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   Nombre:
 *                     type: string
 *                     description: Nombre de la obra
 *                   Precio:
 *                     type: number
 *                   Fecha_emision:
 *                     type: string
 *                     format: date
 *                   Genero:
 *                     type: string
 *                   Estado:
 *                     type: string
 *                     enum: [Pagado, Reservado]
 *       401:
 *         description: Sesión no válida
 */
router.get('/mis-compras', async (req, res) => {
    const idUsuario = req.session.id_usuario;
    if (!idUsuario) return res.status(401).json({ error: "Sesión no válida" });
    try {
        const compras = await getMisCompras(idUsuario);
        res.json(compras);
    } catch (err) {
        console.error('Error en mis-compras:', err);
        res.status(500).json({ error: "Error en la consulta: " + err.message });
    }
});

module.exports = router;
