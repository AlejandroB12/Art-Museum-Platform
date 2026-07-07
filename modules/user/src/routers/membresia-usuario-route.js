const express = require('express');
const router = express.Router();
const { getMembresiaUsuario } = require('../services/membresia-usuario-service');

router.get('/api/membresia-usuario', async (req, res) => {
    const idUsuario = req.session.id_usuario;
    if (!idUsuario) return res.status(401).json({ error: "Sesión no iniciada" });
    try {
        const data = await getMembresiaUsuario(idUsuario);
        res.json(data);
    } catch (err) {
        console.error('Error en membresia-usuario:', err);
        res.status(500).json({ error: "Error de base de datos" });
    }
});

module.exports = router;
