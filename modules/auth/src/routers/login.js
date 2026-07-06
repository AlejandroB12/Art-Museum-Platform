const express = require('express');
const router = express.Router();
const authService = require('../services/auth_services');

router.post('/login-auth', async (req, res) => {
    try {
        const result = await authService.login(req.body.username, req.body.password, req);
        if (result.error) return res.redirect(result.redirect);
        if (result.pending) return res.redirect('/public/pending-activation.html');
        res.redirect(result.redirect);
    } catch (err) {
        console.error('Error en login:', err);
        res.status(500).send("Error en el servidor");
    }
});

module.exports = router;
