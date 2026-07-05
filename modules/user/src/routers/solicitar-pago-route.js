const express = require('express');
const router = express.Router();
const { solicitarPago } = require('../services/solicitar-pago-service');
const { validate } = require('../../../../shared/middlewares/validate_middleware');
const { paymentRequestSchema } = require('../schemas/payment_schema');

/**
 * @swagger
 * /solicitar-pago:
 *   post:
 *     summary: Envía una solicitud de pago de membresía
 *     tags: [Usuario - Membresía]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               monto:
 *                 type: number
 *                 description: Monto a pagar
 *                 example: 10
 *     responses:
 *       200:
 *         description: Solicitud enviada exitosamente
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: Solicitud enviada
 *       401:
 *         description: No autorizado
 */
router.post('/solicitar-pago', validate(paymentRequestSchema), async (req, res) => {
    if (!req.session.id_usuario) return res.status(401).send("No autorizado");
    try {
        await solicitarPago(req.session.id_usuario, req.body.monto, req);
        res.send("Solicitud enviada");
    } catch (err) {
        console.error('Error en solicitar-pago:', err);
        res.status(500).send("Error al registrar");
    }
});

module.exports = router;
