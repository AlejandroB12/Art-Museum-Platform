const express = require('express');
const router = express.Router();
const adminService = require('../../services/admin_service');

router.post('/api/registrar-envio', async (req, res) => {
    try {
        const { id_factura, municipio, parroquia, direccion_detallada } = req.body;
        if (!id_factura) return res.status(400).json({ success: false, message: 'ID de factura es requerido' });
        if (!municipio || !parroquia || !direccion_detallada) {
            return res.status(400).json({ success: false, message: 'Todos los campos de dirección son obligatorios' });
        }
        const result = await adminService.registerShipping(req.body);
        res.json({ success: true, message: 'Envío registrado exitosamente', numero_guia: result.numero_guia });
    } catch (err) {
        if (err.message.includes("ya tiene un envío")) return res.status(400).json({ success: false, message: err.message });
        if (err.message.includes("no existe")) return res.status(404).json({ success: false, message: err.message });
        res.status(500).json({ success: false, message: 'Error al registrar el envío: ' + err.message });
    }
});

module.exports = router;
