const { z } = require('zod');

const obraCreateSchema = z.object({
    nombre: z.string().min(1, "El nombre es requerido"),
    fecha_creacion: z.string().optional(),
    precio: z.number().positive("El precio debe ser positivo"),
    estado_obra: z.enum(['Disponible', 'Reservado', 'Vendida']).optional(),
    fotografia: z.string().optional(),
    genero_nombre: z.string().optional(),
    autores_ids: z.array(z.number()).optional(),
    fotografia_base64: z.string().optional(),
    fotografia_nombre: z.string().optional()
});

const obraUpdateSchema = z.object({
    nombre: z.string().min(1, "El nombre es requerido"),
    precio: z.number().positive("El precio debe ser positivo"),
    estado_obra: z.enum(['Disponible', 'Reservado', 'Vendida']).optional()
});

module.exports = { obraCreateSchema, obraUpdateSchema };
