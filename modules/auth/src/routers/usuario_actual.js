const express = require('express');
const router = express.Router();
const authService = require('../services/auth_services');

router.get('/api/usuario-actual', (req, res) => {
    const user = authService.getUsuarioActual(req);
    if (!user) return res.status(401).json({ error: "No autenticado" });
    res.json(user);
});

module.exports = router;
