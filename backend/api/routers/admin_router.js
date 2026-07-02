const express = require('express');
const router = express.Router();
const { db } = require('../../../config/database');

// Startup: asegurar columnas de Factura
db.query("ALTER TABLE Factura MODIFY COLUMN Fecha_Venta timestamp NULL DEFAULT CURRENT_TIMESTAMP", (errMod) => {
    if (errMod) {
        db.query("ALTER TABLE Factura ADD COLUMN Fecha_Venta timestamp NULL DEFAULT CURRENT_TIMESTAMP", (errAdd) => {
            if (errAdd) console.error('Error creando Fecha_Venta:', errAdd.message);
        });
    }
});

db.query("UPDATE Factura SET Fecha_Venta = NOW() WHERE Fecha_Venta IS NULL OR Fecha_Venta = '0000-00-00 00:00:00'", (errUpd) => {
    if (errUpd) console.error('Error actualizando Fecha_Venta NULL:', errUpd.message);
});

const userRoutes = require('./admin_user_router');
const obraRoutes = require('./admin_obra_router');
const reportRoutes = require('./admin_report_router');
const shippingRoutes = require('./admin_shipping_router');

router.use(userRoutes);
router.use(obraRoutes);
router.use(reportRoutes);
router.use(shippingRoutes);

module.exports = router;
