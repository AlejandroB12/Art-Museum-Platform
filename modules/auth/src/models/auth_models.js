const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const BitacoraModels = require('./zod/bitacora');
const HistorialModels = require('./zod/historial_estatus');
const ObrasVendidasModels = require('./zod/obras_vendidas');
const ResumenModels = require('./zod/resumen_facturacion');

const cassandraModels = { ...BitacoraModels, ...HistorialModels, ...ObrasVendidasModels, ...ResumenModels };

module.exports = { prisma, cassandraModels, ...cassandraModels };
