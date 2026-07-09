const express = require('express');
const router = express.Router();
const { validate } = require('../../../../shared/middlewares/validate_middleware');
const envioSchema = require('../schema/envio.schema');
const shippingService = require('../services/shipping_service');

router.post('/api/registrar-envio', validate(envioSchema), async (req, res) => {
    try {
        const result = await shippingService.registerShipping(req.body);
        res.json({ success: true, message: 'Envío registrado exitosamente', numero_guia: result.numero_guia });
    } catch (err) {
        if (err.message.includes("ya tiene un envío")) return res.status(400).json({ success: false, message: err.message });
        if (err.message.includes("no existe")) return res.status(404).json({ success: false, message: err.message });
        res.status(500).json({ success: false, message: 'Error al registrar el envío: ' + err.message });
    }
});

module.exports = router;
