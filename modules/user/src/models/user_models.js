const { resumenFacturacionMensual } = require('./zod/resumen_facturacion_mensual');
const { obrasVendidasPorPeriodo } = require('./zod/obras_vendidas_por_periodo');
const { bitacoraSeguridad } = require('./zod/bitacora_seguridad');

module.exports = {
  resumenFacturacionMensual,
  obrasVendidasPorPeriodo,
  bitacoraSeguridad,
};
