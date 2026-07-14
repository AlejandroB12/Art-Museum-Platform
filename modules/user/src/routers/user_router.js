const express = require('express');
const router = express.Router();

router.use(require('./precio-membresia-route'));
router.use(require('./membresia-usuario-route'));
router.use(require('./solicitar-pago-route'));
router.use(require('./mis-compras-route'));
router.use(require('./datos-envio-pago-route'));
router.use(require('./tarjeta-route'));
router.use(require('./favorito-route'));
router.use(require('./perfil-route'));

module.exports = router;
