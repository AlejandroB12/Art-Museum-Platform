const express = require('express');
const router = express.Router();
const { getMembershipConfig } = require('../services/get-membership-config-service');

/**
 * @swagger
 * /api/precio-membresia:
 *   get:
 *     summary: Retorna la configuración de precios de membresía
 *     tags: [Usuario - Membresía]
 *     responses:
 *       200:
 *         description: Configuración de membresía
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 precio:
 *                   type: number
 *                   example: 10
 *                 moneda:
 *                   type: string
 *                   example: USD
 *                 concepto:
 *                   type: string
 *                   example: Suscripción Digital
 */
router.get('/api/precio-membresia', async (req, res) => {
    try {
        const config = await getMembershipConfig();
        res.json(config);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
