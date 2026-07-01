const express = require('express');
const router = express.Router();
const geoService = require('../services/geography_service');

router.get('/estados', async (req, res) => {
    try {
        const estados = await geoService.listEstados();
        res.json(estados);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/municipios/:id_estado', async (req, res) => {
    try {
        const municipios = await geoService.listMunicipios(req.params.id_estado);
        res.json(municipios);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/parroquias/:id_municipio', async (req, res) => {
    try {
        const parroquias = await geoService.listParroquias(req.params.id_municipio);
        res.json(parroquias);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
