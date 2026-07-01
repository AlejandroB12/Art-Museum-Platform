const express = require('express');
const router = express.Router();
const userService = require('../../services/user_service');

router.get('/api/precio-membresia', async (req, res) => {
    try {
        const config = await userService.getMembershipConfig();
        res.json(config);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/api/membresia-usuario', async (req, res) => {
    const idUsuario = req.session.id_usuario;
    if (!idUsuario) return res.status(401).json({ error: "Sesión no iniciada" });
    try {
        const data = await userService.getMembresiaUsuario(idUsuario);
        res.json(data);
    } catch (err) {
        console.error('Error en membresia-usuario:', err);
        res.status(500).json({ error: "Error de base de datos" });
    }
});

router.post('/solicitar-pago', async (req, res) => {
    if (!req.session.id_usuario) return res.status(401).send("No autorizado");
    try {
        await userService.solicitarPago(req.session.id_usuario, req);
        res.send("Solicitud enviada");
    } catch (err) {
        console.error('Error en solicitar-pago:', err);
        res.status(500).send("Error al registrar");
    }
});

router.get('/mis-compras', async (req, res) => {
    const idUsuario = req.session.id_usuario;
    if (!idUsuario) return res.status(401).json({ error: "Sesión no válida" });
    try {
        const compras = await userService.getMisCompras(idUsuario);
        res.json(compras);
    } catch (err) {
        console.error('Error en mis-compras:', err);
        res.status(500).json({ error: "Error en la consulta: " + err.message });
    }
});

router.get('/api/datos-envio-pago', async (req, res) => {
    if (!req.session.id_usuario) return res.status(401).json({ error: "No iniciado" });
    try {
        const data = await userService.getDatosEnvioPago(req.session.id_usuario);
        res.json(data);
    } catch (err) {
        console.error('Error en datos-envio-pago:', err);
        res.status(500).json({ error: "Error al obtener datos" });
    }
});

module.exports = router;
