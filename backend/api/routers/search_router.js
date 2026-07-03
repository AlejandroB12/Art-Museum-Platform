const express = require('express');
const router = express.Router();
const searchService = require('../../services/search_service');

router.get('/buscar', async (req, res) => {
    try {
        const result = await searchService.buscar((req.query.q || '').trim());
        res.json(result);
    } catch (err) {
        console.error('Error en búsqueda:', err);
        res.json([]);
    }
});

module.exports = router;