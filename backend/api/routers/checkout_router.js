const express = require('express');
const router = express.Router();
const checkoutService = require('../../services/checkout_service');

router.post('/confirmar-reserva', async (req, res) => {
    if (!req.session.id_usuario) return res.status(401).json({ error: "Sesión expirada" });

    const id_obra = Number(req.body.id_obra);
    const id_usuario = req.session.id_usuario;

    try {
        const result = await checkoutService.confirmarReserva(id_obra, id_usuario, req);
        res.json(result);
    } catch (err) {
        console.error('Error en confirmar-reserva:', err);
        const statusCode = err.statusCode || 500;
        res.status(statusCode).json({ error: err.message || "Error al procesar la reserva", detalle: err.message });
    }
});

module.exports = router;
