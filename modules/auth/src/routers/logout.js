const express = require('express');
const router = express.Router();
const authService = require('../services/auth_services');

router.get('/logout', (req, res) => {
    authService.logout(req)
        .then(() => {
            res.clearCookie('connect.sid', { path: '/' });
            res.redirect('/');
        })
        .catch(err => {
            console.error("Error al destruir sesión:", err);
            res.status(500).send("No se pudo cerrar la sesión");
        });
});

module.exports = router;
