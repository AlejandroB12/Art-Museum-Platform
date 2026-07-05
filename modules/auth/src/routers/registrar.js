const express = require('express');
const router = express.Router();
const authService = require('../../services/auth_service');

router.post('/registrar', async (req, res) => {
    try {
        const result = await authService.register(req.body, req);
        res.redirect(result.redirect);
    } catch (err) {
        console.error('Error en registro:', err.message);
        res.status(500).send("Error al crear usuario: " + err.message);
    }
});

module.exports = router;
