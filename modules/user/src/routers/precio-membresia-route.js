const express = require('express');
const router = express.Router();
const { getMembershipConfig } = require('../services/membership-config-service');

router.get('/api/precio-membresia', async (req, res) => {
    try {
        const config = await getMembershipConfig();
        res.json(config);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
