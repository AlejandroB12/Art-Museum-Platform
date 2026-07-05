const express = require('express');
const router = express.Router();
const authService = require('../../services/auth_service');

router.post('/update-password', async (req, res) => {
    try {
        await authService.updatePassword(req.body.userId, req.body.newPassword, req);
        res.redirect('/private/password-recovery.html');
    } catch (err) {
        console.error('Error en update-password:', err);
        res.status(500).send("Error al actualizar");
    }
});

module.exports = router;
