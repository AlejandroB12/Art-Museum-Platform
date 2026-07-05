const express = require('express');
const router = express.Router();
const { getDatosEnvioPago } = require('../services/get-datos-envio-pago-service');

/**
 * @swagger
 * /api/datos-envio-pago:
 *   get:
 *     summary: Retorna los datos de envío y pago del usuario autenticado
 *     tags: [Usuario - Envío/Pago]
 *     responses:
 *       200:
 *         description: Datos de envío y pago
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               nullable: true
 *               properties:
 *                 Nombre:
 *                   type: string
 *                 Apellido:
 *                   type: string
 *                 Calle:
 *                   type: string
 *                   nullable: true
 *                 Parroquia:
 *                   type: string
 *                   nullable: true
 *                 Municipio:
 *                   type: string
 *                   nullable: true
 *       401:
 *         description: No iniciado
 */
router.get('/api/datos-envio-pago', async (req, res) => {
    if (!req.session.id_usuario) return res.status(401).json({ error: "No iniciado" });
    try {
        const data = await getDatosEnvioPago(req.session.id_usuario);
        res.json(data);
    } catch (err) {
        console.error('Error en datos-envio-pago:', err);
        res.status(500).json({ error: "Error al obtener datos" });
    }
});

module.exports = router;
