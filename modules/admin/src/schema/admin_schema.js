const facturaSchema = require('./factura.schema');
const { obraCreateSchema, obraUpdateSchema } = require('./obra.schema');
const generoSchema = require('./genero.schema');
const autorCreateSchema = require('./autor.schema');
const envioSchema = require('./envio.schema');
const { adminRegisterSchema, userStatusSchema, toggleBuyerSchema, searchBuyerSchema } = require('./usuario.schema');
const { approvePaymentSchema, registerPaymentSchema } = require('./membresia.schema');
const { dateRangeSchema, cassandraMesSchema, cassandraMesesSchema, cassandraBitacoraSchema } = require('./reporte.schema');
const { eventoSeguridadSchema, cambioEstatusSchema } = require('./seguridad.schema');

module.exports = {
    facturaSchema,
    obraCreateSchema,
    obraUpdateSchema,
    generoSchema,
    autorCreateSchema,
    envioSchema,
    adminRegisterSchema,
    userStatusSchema,
    toggleBuyerSchema,
    searchBuyerSchema,
    approvePaymentSchema,
    registerPaymentSchema,
    dateRangeSchema,
    cassandraMesSchema,
    cassandraMesesSchema,
    cassandraBitacoraSchema,
    eventoSeguridadSchema,
    cambioEstatusSchema
};
