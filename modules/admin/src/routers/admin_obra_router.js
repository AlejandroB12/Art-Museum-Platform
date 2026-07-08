const express = require('express');
const router = express.Router();
const adminService = require('../services/admin_services');
const { validate } = require('../../../../shared/middlewares/validate_middleware');
const { obraCreateSchema, obraUpdateSchema } = require('../schema/obra.schema');
const generoSchema = require('../schema/genero.schema');
const autorCreateSchema = require('../schema/autor.schema');

router.get('/api/obras', async (req, res) => {
    try {
        const obras = await adminService.listObras();
        res.json(obras);
    } catch (err) {
        res.status(500).json([]);
    }
});

router.put('/api/obras/:id', async (req, res) => {
    try {
        await adminService.updateObra(req.params.id, req.body);
        res.send("Obra actualizada");
    } catch (err) {
        if (err.message === 'Obra no encontrada') return res.status(404).send(err.message);
        res.status(500).send(err.message);
    }
});

router.delete('/api/obras/:id', async (req, res) => {
    try {
        await adminService.deleteObra(req.params.id);
        res.send("Obra eliminada");
    } catch (err) {
        res.status(500).send(err.message);
    }
});

router.get('/api/obras-reservadas', async (req, res) => {
    try {
        const obras = await adminService.listObrasReservadas();
        res.json(obras);
    } catch (err) {
        res.status(500).json([]);
    }
});

router.get('/api/obras-admin', async (req, res) => {
    try {
        const obras = await adminService.listObrasAdmin();
        res.json(obras);
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error al obtener obras' });
    }
});

router.post('/api/obras-admin', validate(obraCreateSchema), async (req, res) => {
    try {
        const result = await adminService.createObraAdmin(req.body);
        res.json({ success: true, message: 'Obra agregada correctamente', id: result.id });
    } catch (err) {
        const statusCode = err.statusCode || 500;
        res.status(statusCode).json({ success: false, message: err.message || 'Error al crear obra' });
    }
});

router.put('/api/obras-admin/:id', validate(obraUpdateSchema), async (req, res) => {
    try {
        await adminService.updateObraAdmin(parseInt(req.params.id), req.body);
        res.json({ success: true, message: 'Obra actualizada correctamente' });
    } catch (err) {
        if (err.message === "Obra no encontrada") return res.status(404).json({ success: false, message: err.message });
        res.status(500).json({ success: false, message: err.message || 'Error al actualizar obra' });
    }
});

router.delete('/api/obras-admin/:id', async (req, res) => {
    try {
        await adminService.deleteObraAdmin(parseInt(req.params.id));
        res.json({ success: true, message: 'Obra eliminada correctamente' });
    } catch (err) {
        if (err.message === "Obra no encontrada") return res.status(404).json({ success: false, message: err.message });
        res.status(500).json({ success: false, message: 'Error al eliminar obra' });
    }
});

router.put('/api/obras-admin/:id/detalles', async (req, res) => {
    try {
        await adminService.updateObraDetalles(parseInt(req.params.id), req.body.detalles);
        res.json({ success: true, message: 'Detalles de obra actualizados correctamente' });
    } catch (err) {
        const statusCode = err.statusCode || 500;
        res.status(statusCode).json({ success: false, message: err.message || 'Error al actualizar detalles de obra' });
    }
});

router.get('/api/generos', async (req, res) => {
    try {
        const generos = await adminService.listGeneros();
        res.json(generos);
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error al obtener géneros' });
    }
});

router.post('/api/generos', validate(generoSchema), async (req, res) => {
    try {
        const result = await adminService.createGenero(req.body);
        res.json({ success: true, message: 'Género agregado correctamente', id: result.id });
    } catch (err) {
        const statusCode = err.statusCode || 500;
        res.status(statusCode).json({ success: false, message: err.message || 'Error al crear género' });
    }
});

router.put('/api/generos/:id', async (req, res) => {
    try {
        await adminService.updateGenero(parseInt(req.params.id), req.body);
        res.json({ success: true, message: 'Género actualizado correctamente' });
    } catch (err) {
        if (err.message === "Género no encontrado") return res.status(404).json({ success: false, message: err.message });
        res.status(500).json({ success: false, message: 'Error al actualizar género' });
    }
});

router.delete('/api/generos/:id', async (req, res) => {
    try {
        await adminService.deleteGenero(parseInt(req.params.id));
        res.json({ success: true, message: 'Género eliminado correctamente' });
    } catch (err) {
        if (err.message === "Género no encontrado") return res.status(404).json({ success: false, message: err.message });
        res.status(500).json({ success: false, message: 'Error al eliminar género' });
    }
});

router.get('/api/nacionalidades', async (req, res) => {
    try {
        const nacionalidades = await adminService.listNacionalidades();
        res.json(nacionalidades);
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error al obtener nacionalidades' });
    }
});

router.get('/api/precargas-atributos', (req, res) => {
    res.json(adminService.getPrecargasAtributos());
});

router.get('/api/artistas-admin', async (req, res) => {
    try {
        const artistas = await adminService.listArtistasAdmin();
        res.json(artistas);
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error al obtener artistas' });
    }
});

router.post('/api/artistas-admin', validate(autorCreateSchema), async (req, res) => {
    try {
        const result = await adminService.createArtistaAdmin(req.body);
        res.json({ success: true, message: 'Artista agregado correctamente', id: result.id });
    } catch (err) {
        const statusCode = err.statusCode || 500;
        res.status(statusCode).json({ success: false, message: err.message || 'Error al crear artista' });
    }
});

router.delete('/api/artistas-admin/:id', async (req, res) => {
    try {
        await adminService.deleteArtistaAdmin(parseInt(req.params.id));
        res.json({ success: true, message: 'Artista eliminado correctamente' });
    } catch (err) {
        if (err.message === "Artista no encontrado") return res.status(404).json({ success: false, message: err.message });
        res.status(500).json({ success: false, message: 'Error al eliminar artista' });
    }
});

module.exports = router;
