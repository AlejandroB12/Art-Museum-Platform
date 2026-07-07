const { z } = require('zod');

const Neo4jComprador = z.object({
  id_usuario: z.number().int().positive(),
  nombre: z.string(),
  apellido: z.string(),
  email: z.string().email()
});

const Neo4jObra = z.object({
  id_obra: z.number().int().positive(),
  nombre: z.string(),
  precio: z.number().nonnegative(),
  estado: z.string(),
  fotografia: z.string().optional(),
  descripcionIA: z.string().optional(),
  descripcionCLIP: z.string().optional(),
  tagsClip: z.string().optional(),
  embedding: z.array(z.number()).optional(),
  tagsIA: z.array(z.string()).optional(),
  epocaReal: z.string().optional(),
  tecnicasReales: z.array(z.string()).optional(),
  rangoPrecio: z.string().optional()
});

const Neo4jArtista = z.object({
  id_artista: z.number().int().positive(),
  nombre: z.string(),
  apellido: z.string(),
  nacionalidad: z.string()
});

const Neo4jGenero = z.object({
  nombre: z.string().min(1)
});

const Neo4jEstilo = z.object({
  nombre: z.string().min(1)
});

const Neo4jPaleta = z.object({
  nombre: z.string().min(1)
});

const Neo4jTecnica = z.object({
  nombre: z.string().min(1)
});

const Neo4jEpoca = z.object({
  nombre: z.string().min(1)
});

module.exports = {
  Neo4jComprador,
  Neo4jObra,
  Neo4jArtista,
  Neo4jGenero,
  Neo4jEstilo,
  Neo4jPaleta,
  Neo4jTecnica,
  Neo4jEpoca
};
