const express = require('express');
const router = express.Router();
const adminService = require('../../services/admin_service');

router.get('/consultas/obras-vendidas', async (req, res) => {
    try {
        const { fecha_inicio, fecha_fin } = req.query;
        const results = await adminService.getObrasVendidasReport(fecha_inicio, fecha_fin);
        res.json(results);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

router.get('/consultas/resumen-facturacion', async (req, res) => {
    try {
        const { fecha_inicio, fecha_fin } = req.query;
        const results = await adminService.getFacturacionResumen(fecha_inicio, fecha_fin);
        res.json(results);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

router.get('/consultas/resumen-membresias', async (req, res) => {
    try {
        const { fecha_inicio, fecha_fin } = req.query;
        const results = await adminService.getMembresiasResumen(fecha_inicio, fecha_fin);
        res.json(results);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/generar-factura', async (req, res) => {
    try {
        const result = await adminService.generarFactura(req.body, req);
        res.json(result);
    } catch (err) {
        const statusCode = err.statusCode || 500;
        res.status(statusCode).json({ success: false, message: err.message || "Error al generar factura" });
    }
});

router.get('/api/factura/:id', async (req, res) => {
    try {
        const factura = await adminService.getFactura(req.params.id);
        if (!factura || factura.length === 0) {
            return res.status(404).json({ success: false, message: 'Factura no encontrada' });
        }
        const direccion = await adminService.listDireccionesEnvio(req.params.id);
        res.json({ success: true, factura: factura[0], direccion });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error en BD' });
    }
});

router.get('/cassandra/obras-vendidas', async (req, res) => {
    try {
        const { anio_mes } = req.query;
        if (!anio_mes) return res.status(400).json({ success: false, message: 'anio_mes requerido' });
        const data = await adminService.consultarCassandraObrasVendidas(anio_mes);
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.get('/cassandra/obras-vendidas-rango', async (req, res) => {
    try {
        const { meses } = req.query;
        if (!meses) return res.status(400).json({ success: false, message: 'meses requerido' });
        const data = await adminService.consultarCassandraObrasVendidasRango(meses);
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.get('/cassandra/resumen-facturacion', async (req, res) => {
    try {
        const { anio_mes } = req.query;
        const data = await adminService.consultarCassandraResumenFacturacion(anio_mes);
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.get('/cassandra/bitacora-seguridad', async (req, res) => {
    try {
        const { id_usuario, tipo_evento } = req.query;
        const data = await adminService.consultarCassandraBitacora(id_usuario, tipo_evento);
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.get('/api/logs-seguridad', async (req, res) => {
    try {
        const logs = await adminService.consultarLogsSeguridad();
        res.json({ success: true, data: logs });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.get('/cassandra/obras-con-historial', async (req, res) => {
    try {
        const data = await adminService.consultarObrasConHistorial();
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.get('/cassandra/historial-estatus-obra', async (req, res) => {
    try {
        const { id_obra } = req.query;
        if (!id_obra) return res.status(400).json({ success: false, message: 'id_obra requerido' });
        const data = await adminService.consultarHistorialEstatusObra(parseInt(id_obra));
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.post('/cassandra/registrar-evento-seguridad', async (req, res) => {
    try {
        await adminService.registrarEventoSeguridad(req.body, req);
        res.json({ success: true, message: 'Evento registrado en bitácora' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.post('/cassandra/registrar-cambio-estatus', async (req, res) => {
    try {
        await adminService.registrarCambioEstatusCassandra(req.body);
        res.json({ success: true, message: 'Cambio de estatus registrado' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
