const express = require('express');
const router = express.Router();
const adminService = require('../services/admin_service');

router.post('/registrar-admin', async (req, res) => {
    try {
        await adminService.registerAdmin(req.body);
        res.redirect('/public/login.html');
    } catch (err) {
        res.status(500).send("Error en Usuario: " + err.message);
    }
});

router.get('/api/todos-los-usuarios', async (req, res) => {
    try {
        const users = await adminService.listUsers();
        res.json(users);
    } catch (err) {
        res.status(500).json([]);
    }
});

router.get('/api/usuarios-pendientes', async (req, res) => {
    try {
        const pendientes = await adminService.listPendingUsers();
        res.json(pendientes);
    } catch (err) {
        res.status(500).json([]);
    }
});

router.patch('/aprobar-usuario/:id', async (req, res) => {
    try {
        await adminService.approveUser(req.params.id, req);
        res.send("<h2>Usuario aprobado y activo. Correo enviado.</h2>");
    } catch (err) {
        res.status(500).send("Error al aprobar usuario: " + err.message);
    }
});

router.put('/api/usuarios/:id', async (req, res) => {
    try {
        const { Estatus } = req.body;
        if (Estatus === undefined || (Estatus != 0 && Estatus != 1)) {
            return res.status(400).json({ success: false, message: "Estatus inválido" });
        }
        await adminService.toggleUserStatus(req.params.id, Estatus);
        res.json({ success: true, message: `Usuario ${Estatus == 1 ? 'activado' : 'desactivado'} correctamente` });
    } catch (err) {
        if (err.message === "Usuario no encontrado") return res.status(404).json({ success: false, message: err.message });
        res.status(500).json({ success: false, message: "Error al actualizar usuario: " + err.message });
    }
});

router.put('/api/usuarios/:id/toggle-adquirir', async (req, res) => {
    try {
        const { PuedeAdquirir } = req.body;
        if (PuedeAdquirir === undefined || (PuedeAdquirir != 0 && PuedeAdquirir != 1)) {
            return res.status(400).json({ success: false, message: "Valor inválido" });
        }
        await adminService.togglePuedeAdquirir(req.params.id, PuedeAdquirir);
        const estado = PuedeAdquirir == 1 ? 'habilitada' : 'deshabilitada';
        res.json({ success: true, message: `Compra ${estado} para este usuario` });
    } catch (err) {
        if (err.message === "Comprador no encontrado") return res.status(404).json({ success: false, message: err.message });
        res.status(500).json({ success: false, message: "Error al actualizar: " + err.message });
    }
});

router.delete('/api/usuarios/:id', async (req, res) => {
    try {
        await adminService.deleteUser(req.params.id);
        res.send("Usuario eliminado");
    } catch (err) {
        res.status(500).send(err.message);
    }
});

router.post('/api/buscar-comprador', async (req, res) => {
    try {
        const { email, cedula } = req.body;
        if (!email && !cedula) {
            return res.status(400).json({ success: false, message: "Debe proporcionar email o cédula" });
        }
        const results = await adminService.searchBuyer(email, cedula);
        if (results.length === 0) return res.json({ success: true, found: false, message: "Usuario no encontrado" });
        res.json({ success: true, found: true, usuario: results[0] });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.get('/api/solicitudes-pago', async (req, res) => {
    try {
        const solicitudes = await adminService.listPaymentRequests();
        res.json(solicitudes);
    } catch (err) {
        res.status(500).send("Error consultando pagos");
    }
});

router.post('/aprobar-pago', async (req, res) => {
    try {
        const { id_solicitud, id_usuario } = req.body;
        await adminService.approvePayment(id_solicitud, id_usuario);
        res.send("Membresía activada y días sumados");
    } catch (err) {
        res.status(500).send("Error al procesar pago: " + err.message);
    }
});

router.post('/registrar-nuevo-pago', async (req, res) => {
    try {
        await adminService.registerNewPayment(req.body.id_usuario, req);
        res.send("Membresía renovada.");
    } catch (err) {
        res.status(500).send("Error al registrar pago");
    }
});

module.exports = router;
