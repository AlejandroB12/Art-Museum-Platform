const express = require('express');
const router = express.Router();
const { query } = require('../config/database');

router.get('/api/tarjeta', async (req, res) => {
    if (!req.session.id_usuario) return res.status(401).json({ error: "No autenticado" });
    try {
        const result = await query("SELECT * FROM tarjeta WHERE id_usuario = $1", [req.session.id_usuario]);
        if (result.length > 0) {
            const t = result[0];
            return res.json({
                numero: t.numero_tarjeta,
                enmascarado: '**** ' + t.numero_tarjeta.slice(-4),
                expiracion: t.fecha_expiracion,
                titular: t.titular
            });
        }
        res.json(null);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/api/guardar-tarjeta', async (req, res) => {
    if (!req.session.id_usuario) return res.status(401).json({ error: "No autenticado" });
    const { numero, expiracion, titular } = req.body;
    try {
        await query(
            `INSERT INTO tarjeta (id_usuario, numero_tarjeta, fecha_expiracion, titular)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (id_usuario) DO UPDATE SET
               numero_tarjeta = $2, fecha_expiracion = $3, titular = $4`,
            [req.session.id_usuario, numero, expiracion, titular]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
