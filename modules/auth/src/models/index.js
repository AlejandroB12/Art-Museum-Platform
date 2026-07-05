const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const BitacoraModels = require('./bitacora');
const HistorialModels = require('./historial_estatus');
const ObrasVendidasModels = require('./obras_vendidas');
const ResumenModels = require('./resumen_facturacion');

const cassandraModels = { ...BitacoraModels, ...HistorialModels, ...ObrasVendidasModels, ...ResumenModels };

module.exports = { prisma, cassandraModels, ...cassandraModels };
