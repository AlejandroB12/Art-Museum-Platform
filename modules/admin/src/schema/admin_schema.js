const facturaSchema = require('./factura.schema');
const { obraCreateSchema, obraUpdateSchema } = require('./obra.schema');
const generoSchema = require('./genero.schema');
const autorCreateSchema = require('./autor.schema');
const envioSchema = require('./envio.schema');

module.exports = {
    facturaSchema,
    obraCreateSchema,
    obraUpdateSchema,
    generoSchema,
    autorCreateSchema,
    envioSchema
};
