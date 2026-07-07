const express = require('express');
const router = express.Router();
const authService = require('../services/auth_services');

router.get('/api/estado-usuario', async (req, res) => {
    try {
        const estado = await authService.getEstadoUsuario(req);
        res.json(estado);
    } catch (err) {
        console.error('Error en estado-usuario:', err);
        res.json({ autenticado: true, puedeAdquirir: true });
    }
});

module.exports = router;
