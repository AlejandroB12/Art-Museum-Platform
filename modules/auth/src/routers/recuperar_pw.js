const express = require('express');
const router = express.Router();
const authService = require('../../services/auth_service');

router.post('/recuperar-pw', async (req, res) => {
    try {
        await authService.recoverPassword(req.body.correo, req);
        res.redirect('/private/password-recovery.html?success=1');
    } catch (err) {
        console.error('Error en recuperar-pw:', err.message);
        res.status(404).send(`<h2>${err.message}</h2>`);
    }
});

module.exports = router;
