const express = require('express');
const router = express.Router();
const { PreguntaSeguridad } = require('../models');

router.get('/api/preguntas-seguridad', async (req, res) => {
    if (!req.session.id_usuario) return res.status(401).json({ error: "No autenticado" });
    try {
        const preguntas = await PreguntaSeguridad.findAll({
            where: { id_usuario: req.session.id_usuario },
            attributes: ['pregunta', 'respuesta']
        });
        res.json(preguntas.map(p => ({
            pregunta: p.pregunta,
            respuesta: p.respuesta
        })));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
