const {
  Neo4jComprador, Neo4jObra, Neo4jArtista,
  Neo4jGenero, Neo4jEstilo, Neo4jPaleta,
  Neo4jTecnica, Neo4jEpoca
} = require('./nodos');

const {
  Neo4jCompro, Neo4jInteractuo, Neo4jSimilarA,
  Neo4jRelacionSinPropiedades
} = require('./relaciones');

module.exports = {
  Neo4jComprador, Neo4jObra, Neo4jArtista,
  Neo4jGenero, Neo4jEstilo, Neo4jPaleta,
  Neo4jTecnica, Neo4jEpoca,
  Neo4jCompro, Neo4jInteractuo, Neo4jSimilarA,
  Neo4jRelacionSinPropiedades
};
