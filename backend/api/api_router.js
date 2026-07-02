const express = require('express');
const router = express.Router();

// Módulos
const authRoutes = require('./routers/auth_router');
const catalogRoutes = require('./routers/catalog_router');
const userRoutes = require('./routers/user_router');
const checkoutRoutes = require('./routers/checkout_router');
const adminRoutes = require('./routers/admin_router');
const recommendationRoutes = require('./routers/recommendations_router');
const geographyRoutes = require('./routers/geography_router');
const witcherRoutes = require('../witcher_bot/witcher_router');

router.use(authRoutes);
router.use(userRoutes);
router.use(checkoutRoutes);
router.use(adminRoutes);
router.use('/api', catalogRoutes);
router.use('/api', geographyRoutes);
router.use('/api', recommendationRoutes);
router.use('/api', witcherRoutes);

module.exports = router;
