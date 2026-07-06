const express = require('express');
const router = express.Router();
const { solicitarPago } = require('../services/solicitar-pago-service');
const { validate } = require('../../../../shared/middlewares/validate_middleware');
const { paymentRequestSchema } = require('../schemas/payment_schema');

router.post('/api/solicitar-pago', validate(paymentRequestSchema), async (req, res) => {
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
