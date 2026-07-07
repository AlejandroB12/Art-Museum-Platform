const { BitacoraSeguridad, RegistrarEventoSeguridadInput } = require('./bitacora_seguridad');
const { HistorialEstatusObra, RegistrarCambioEstatusInput } = require('./historial_estatus_obra');
const { ObraVendidaPorPeriodo } = require('./obras_vendidas_por_periodo');
const { ResumenFacturacionMensual } = require('./resumen_facturacion_mensual');

module.exports = {
  BitacoraSeguridad,
  RegistrarEventoSeguridadInput,
  HistorialEstatusObra,
  RegistrarCambioEstatusInput,
  ObraVendidaPorPeriodo,
  ResumenFacturacionMensual
};
