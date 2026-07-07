const express = require('express');
const router = express.Router();
const { getMisCompras } = require('../services/mis-compras-service');

router.get('/api/mis-compras', async (req, res) => {
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
