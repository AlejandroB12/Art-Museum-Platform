const express = require('express');
const router = express.Router();
const authService = require('../services/auth_services');

router.post('/guardar-seguridad', (req, res) => {
    if (!req.session.id_usuario) {
        return res.status(401).send("Debes iniciar sesión para guardar esto.");
    }
    authService.saveSecurityQuestions(req.session.id_usuario, req.body, req)
        .then(() => res.send("Preguntas guardadas con éxito"))
        .catch(err => res.status(500).send("Error al guardar: " + err.message));
});

module.exports = router;
