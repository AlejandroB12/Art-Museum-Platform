const express = require('express');
const router = express.Router();
const solicitudPagoService = require('../services/solicitud-pago-services');

router.post('/solicitar-pago', async (req, res) => {
  if (!req.session.id_usuario) return res.status(401).send("No autorizado");

  try {
    await solicitudPagoService.solicitarPago(req.session.id_usuario, req);
    res.send("Solicitud enviada");
  } catch (err) {
    console.error('Error en solicitar-pago:', err);
    res.status(500).send("Error al registrar");
  }
});

module.exports = router;
