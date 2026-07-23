const express = require('express');
const router = express.Router();
const adminService = require('../services/admin_services');
const { validate } = require('../../../../shared/middlewares/validate_middleware');
const { adminRegisterSchema, userStatusSchema, searchBuyerSchema } = require('../schema/usuario.schema');
const { approvePaymentSchema, registerPaymentSchema } = require('../schema/membresia.schema');

router.post('/registrar-admin', validate(adminRegisterSchema), async (req, res) => {
    try {
        await adminService.registerAdmin(req.body);
        res.redirect('/public/login.html');
    } catch (err) {
        res.status(500).send("Error en Usuario: " + err.message);
    }
});

router.get('/api/todos-los-usuarios', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const users = await adminService.listUsers(page, limit);
        res.json(users);
    } catch (err) {
        res.status(500).json({ data: [], total: 0, page: 1, totalPages: 1 });
    }
});

router.get('/api/usuarios-pendientes', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const pendientes = await adminService.listPendingUsers(page, limit);
        res.json(pendientes);
    } catch (err) {
        res.status(500).json({ data: [], total: 0, page: 1, totalPages: 1 });
    }
});

router.patch('/aprobar-usuario/:id', async (req, res) => {
    try {
        await adminService.approveUser(req.params.id, req);
        res.json({ success: true, message: "Usuario aprobado y activo. Correo enviado." });
    } catch (err) {
        res.status(500).json({ success: false, message: "Error al aprobar usuario: " + err.message });
    }
});

router.put('/api/usuarios/:id', validate(userStatusSchema), async (req, res) => {
    try {
        await adminService.toggleUserStatus(req.params.id, req.body.Estatus);
        res.json({ success: true, message: `Usuario ${req.body.Estatus == 1 ? 'activado' : 'desactivado'} correctamente` });
    } catch (err) {
        if (err.message === "Usuario no encontrado") return res.status(404).json({ success: false, message: err.message });
        res.status(500).json({ success: false, message: "Error al actualizar usuario: " + err.message });
    }
});

router.delete('/api/eliminar-reservas-usuario/:id', async (req, res) => {
    try {
        await adminService.deleteUserReservations(req.params.id);
        res.json({ success: true, message: "Reservas eliminadas" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.delete('/api/eliminar-membresias-usuario/:id', async (req, res) => {
    try {
        await adminService.deleteUserMemberships(req.params.id);
        res.json({ success: true, message: "Membresías eliminadas" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.delete('/api/eliminar-comprador/:id', async (req, res) => {
    try {
        await adminService.deleteComprador(req.params.id);
        res.json({ success: true, message: "Comprador eliminado" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.delete('/api/usuarios/:id', async (req, res) => {
    try {
        await adminService.deleteUser(req.params.id);
        res.json({ success: true, message: "Usuario eliminado" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.post('/api/buscar-comprador', validate(searchBuyerSchema), async (req, res) => {
    try {
        const { email, cedula } = req.body;
        const results = await adminService.searchBuyer(email, cedula);
        if (results.length === 0) return res.json({ success: true, found: false, message: "Usuario no encontrado" });
        res.json({ success: true, found: true, usuario: results[0] });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.get('/api/solicitudes-pago', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const solicitudes = await adminService.listPaymentRequests(page, limit);
        res.json(solicitudes);
    } catch (err) {
        res.status(500).json({ data: [], total: 0, page: 1, totalPages: 1 });
    }
});

router.post('/aprobar-pago', validate(approvePaymentSchema), async (req, res) => {
    try {
        const { id_solicitud, id_usuario } = req.body;
        await adminService.approvePayment(id_solicitud, id_usuario);
        res.send("Membresía activada y días sumados");
    } catch (err) {
        res.status(500).send("Error al procesar pago: " + err.message);
    }
});

router.post('/registrar-nuevo-pago', validate(registerPaymentSchema), async (req, res) => {
    try {
        await adminService.registerNewPayment(req.body.id_usuario, req);
        res.send("Membresía renovada.");
    } catch (err) {
        res.status(500).send("Error al registrar pago");
    }
});

module.exports = router;
