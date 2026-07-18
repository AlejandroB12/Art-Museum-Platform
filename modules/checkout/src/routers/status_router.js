const express = require('express');
const router = express.Router();
const statusHistoryService = require('../services/status_history_service');
const { validateParams } = require('../../../../shared/middlewares/validate_middleware');
const { idObraParamSchema } = require('../schemas/status_history_schema');

router.get('/estados-obra/:id', validateParams(idObraParamSchema), async (req, res) => {
    try {
        const historial = await statusHistoryService.getHistorialByObra(req.params.id);
        res.json(historial);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
