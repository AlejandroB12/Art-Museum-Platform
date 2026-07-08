const { z } = require('zod');

const Neo4jCompro = z.object({
  fecha: z.string().datetime().optional()
});

const Neo4jInteractuo = z.object({
  tipo: z.string(),
  timestamp: z.string().datetime(),
  contador: z.number().int().nonnegative()
});

const Neo4jSimilarA = z.object({
  score: z.number().min(0).max(1)
});

const Neo4jRelacionSinPropiedades = z.object({});

module.exports = {
  Neo4jCompro,
  Neo4jInteractuo,
  Neo4jSimilarA,
  Neo4jRelacionSinPropiedades
};
