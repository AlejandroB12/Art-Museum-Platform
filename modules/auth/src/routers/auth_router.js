const express = require('express');
const router = express.Router();

router.use(require('./login'));
router.use(require('./recuperar_pw'));
router.use(require('./update_password'));
router.use(require('./registrar'));
router.use(require('./guardar_seguridad'));
router.use(require('./usuario_actual'));
router.use(require('./estado_usuario'));
router.use(require('./logout'));

module.exports = router;
