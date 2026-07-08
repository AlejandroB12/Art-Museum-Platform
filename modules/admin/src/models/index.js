const { Obra, Artista, Genero, Nacionalidad } = require('./mongoose');
const prisma = require('./prisma');
const {
  BitacoraSeguridad, RegistrarEventoSeguridadInput,
  HistorialEstatusObra, RegistrarCambioEstatusInput,
  ObraVendidaPorPeriodo, ResumenFacturacionMensual,
  Neo4jComprador, Neo4jObra, Neo4jArtista,
  Neo4jGenero, Neo4jEstilo, Neo4jPaleta,
  Neo4jTecnica, Neo4jEpoca,
  Neo4jCompro, Neo4jInteractuo, Neo4jSimilarA,
  Neo4jRelacionSinPropiedades
} = require('./zod');

module.exports = {
  Obra, Artista, Genero, Nacionalidad,
  prisma,
  BitacoraSeguridad, RegistrarEventoSeguridadInput,
  HistorialEstatusObra, RegistrarCambioEstatusInput,
  ObraVendidaPorPeriodo, ResumenFacturacionMensual,
  Neo4jComprador, Neo4jObra, Neo4jArtista,
  Neo4jGenero, Neo4jEstilo, Neo4jPaleta,
  Neo4jTecnica, Neo4jEpoca,
  Neo4jCompro, Neo4jInteractuo, Neo4jSimilarA,
  Neo4jRelacionSinPropiedades
};
