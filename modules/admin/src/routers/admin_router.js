const express = require('express');
const router = express.Router();

const userRoutes = require('./admin_user_router');
const obraRoutes = require('./admin_obra_router');
const reportRoutes = require('./admin_report_router');
const shippingRoutes = require('./admin_shipping_router');

router.use(userRoutes);
router.use(obraRoutes);
router.use(reportRoutes);
router.use(shippingRoutes);

module.exports = router;
