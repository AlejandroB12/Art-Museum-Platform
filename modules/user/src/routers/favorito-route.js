const express = require('express');
const router = express.Router();
const { query } = require('../config/database');

router.get('/api/favoritos', async (req, res) => {
    if (!req.session.id_usuario) return res.status(401).json({ error: "No autenticado" });
    try {
        const result = await query(
            "SELECT id_obra FROM favorito WHERE id_usuario = $1 ORDER BY created_at DESC",
            [req.session.id_usuario]
        );
        res.json(result.map(r => r.id_obra));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/api/favoritos', async (req, res) => {
    if (!req.session.id_usuario) return res.status(401).json({ error: "No autenticado" });
    const { id_obra } = req.body;
    try {
        await query(
            "INSERT INTO favorito (id_usuario, id_obra) VALUES ($1, $2) ON CONFLICT DO NOTHING",
            [req.session.id_usuario, id_obra]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/api/favoritos', async (req, res) => {
    if (!req.session.id_usuario) return res.status(401).json({ error: "No autenticado" });
    const { id_obra } = req.body;
    try {
        await query(
            "DELETE FROM favorito WHERE id_usuario = $1 AND id_obra = $2",
            [req.session.id_usuario, id_obra]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
