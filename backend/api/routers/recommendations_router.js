const express = require('express');
const router = express.Router();
const recService = require('../../services/recommendations_service');

router.get('/recomendaciones/mismo-genero/:idUsuario', async (req, res) => {
    try {
        const result = await recService.mismoGenero(req.params.idUsuario);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/recomendaciones/colaborativo/:idUsuario', async (req, res) => {
    try {
        const result = await recService.colaborativo(req.params.idUsuario);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/recomendaciones/personalizadas/:idUsuario', async (req, res) => {
    try {
        const result = await recService.personalizadas(req.params.idUsuario);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/recomendaciones/artistas-populares', async (req, res) => {
    try {
        const result = await recService.artistasPopulares();
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/recomendaciones/generos-populares', async (req, res) => {
    try {
        const result = await recService.generosPopulares();
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/recomendaciones/obras-por-genero/:genero', async (req, res) => {
    try {
        const result = await recService.obrasPorGenero(req.params.genero);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/grafo/estadisticas', async (req, res) => {
    try {
        const result = await recService.estadisticas();
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/actividad/registrar', async (req, res) => {
    try {
        const idUsuario = req.body.idUsuario || 9999;
        const idObra = req.body.idObra;
        const tipo = req.body.tipo || 'vista_detalle';
        if (!idObra) return res.status(400).json({ error: 'Falta idObra' });
        const result = await recService.registrarActividad(idUsuario, idObra, tipo);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/recomendaciones/por-similitud-ia/:idObra', async (req, res) => {
    try {
        const result = await recService.porSimilitudIA(req.params.idObra);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/recomendaciones/por-actividad/:idUsuario', async (req, res) => {
    try {
        const result = await recService.porActividad(req.params.idUsuario);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/recomendaciones/para-usuario/:idUsuario', async (req, res) => {
    try {
        const result = await recService.paraUsuario(req.params.idUsuario);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/recomendaciones/para-ti/:idUsuario', async (req, res) => {
    try {
        const result = await recService.paraTi(req.params.idUsuario);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/auth/guest-login', async (req, res) => {
    try {
        await recService.guestLogin(req);
        res.json({ success: true, message: 'Sesión invitada iniciada', id_usuario: 9999 });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/recomendaciones/obras-destacadas', async (req, res) => {
    try {
        const result = await recService.obrasDestacadas();
        res.json(result);
    } catch (err) {
        res.json([]);
    }
});

router.get('/buscar', async (req, res) => {
    try {
        const result = await recService.buscar((req.query.q || '').trim());
        res.json(result);
    } catch (err) {
        res.json([]);
    }
});

router.get('/buscar/visual', async (req, res) => {
    try {
        const result = await recService.buscarVisual((req.query.q || '').trim());
        res.json(result);
    } catch (err) {
        res.json([]);
    }
});

module.exports = router;
