const express = require('express');
const router = express.Router();
const path = require('path');
const authService = require('../../services/auth_service');

router.post('/login-auth', async (req, res) => {
    try {
        const result = await authService.login(req.body.username, req.body.password, req);
        if (result.error) return res.redirect(result.redirect);
        if (result.pending) return res.sendFile(path.join(__dirname, '..', '..', 'views', 'user', 'pending-activation.html'));
        res.redirect(result.redirect);
    } catch (err) {
        console.error('Error en login:', err);
        res.status(500).send("Error en el servidor");
    }
});

router.post('/recuperar-pw', async (req, res) => {
    try {
        await authService.recoverPassword(req.body.correo, req);
        res.redirect('/private/password-recovery.html?success=1');
    } catch (err) {
        console.error('Error en recuperar-pw:', err.message);
        res.status(404).send(`<h2>${err.message}</h2>`);
    }
});

router.post('/update-password', async (req, res) => {
    try {
        await authService.updatePassword(req.body.userId, req.body.newPassword, req);
        res.redirect('/private/password-recovery.html');
    } catch (err) {
        console.error('Error en update-password:', err);
        res.status(500).send("Error al actualizar");
    }
});

router.post('/registrar', async (req, res) => {
    try {
        const result = await authService.register(req.body, req);
        res.redirect(result.redirect);
    } catch (err) {
        console.error('Error en registro:', err.message);
        res.status(500).send("Error al crear usuario: " + err.message);
    }
});

router.post('/guardar-seguridad', (req, res) => {
    if (!req.session.id_usuario) {
        return res.status(401).send("Debes iniciar sesión para guardar esto.");
    }
    authService.saveSecurityQuestions(req.session.id_usuario, req.body, req)
        .then(() => res.send("Preguntas guardadas con éxito"))
        .catch(err => res.status(500).send("Error al guardar: " + err.message));
});

router.get('/api/usuario-actual', (req, res) => {
    const user = authService.getUsuarioActual(req);
    if (!user) return res.status(401).json({ error: "No autenticado" });
    res.json(user);
});

router.get('/api/estado-usuario', async (req, res) => {
    if (!req.session?.id_usuario) {
        return res.json({ autenticado: false, puedeAdquirir: false });
    }
    try {
        const results = await require('../../repositories/user_repository').findWithMembresiaStatus(req.session.id_usuario);
        if (!results || results.length === 0) {
            return res.json({ autenticado: true, puedeAdquirir: true });
        }
        const r = results[0];
        let puedeAdquirir = r.PuedeAdquirir == 1;
        const membresiaActiva = r.MembresiaActiva == 1;
        if (!membresiaActiva && puedeAdquirir) {
            await require('../../repositories/user_repository').updatePuedeAdquirir(req.session.id_usuario, 0);
            puedeAdquirir = false;
        }
        res.json({ autenticado: true, puedeAdquirir, id_usuario: req.session.id_usuario, rol: r.Rol || 'comprador' });
    } catch (err) {
        console.error('Error en estado-usuario:', err);
        res.json({ autenticado: true, puedeAdquirir: true });
    }
});

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
