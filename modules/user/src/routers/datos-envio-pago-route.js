const express = require('express');
const router = express.Router();
const { getDatosEnvioPago } = require('../services/datos-envio-pago-service');

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
