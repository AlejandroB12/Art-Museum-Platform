const { z } = require('zod');

/**
 * @openapi
 * components:
 *   schemas:
 *     Obra:
 *       type: object
 *       properties:
 *         nombre: { type: string }
 *         precio: { type: number }
 *         estado_obra: { type: string, enum: [Disponible, Reservado, Vendida] }
 *     FacturaRequest:
 *       type: object
 *       required: [id_obra, precio_neto, porcentaje_comision]
 *       properties:
 *         id_obra: { type: integer }
 *         precio_neto: { type: number }
 *         porcentaje_comision: { type: number }
 *         buyer_nombre: { type: string }
 *         buyer_apellido: { type: string }
 *         buyer_email: { type: string }
 *         buyer_cedula: { type: string }
 */

const facturaSchema = z.object({
    id_obra: z.number().int().positive(),
    id_admin: z.number().int().optional(),
    precio_neto: z.number().positive(),
    porcentaje_comision: z.number().min(0).max(100),
    buyer_nombre: z.string().optional(),
    buyer_apellido: z.string().optional(),
    buyer_email: z.string().optional(),
    buyer_cedula: z.string().optional()
});

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

const generoSchema = z.object({
    nombre: z.string().min(1, "El nombre es requerido"),
    atributos: z.array(z.object({
        nombre: z.string(),
        tipo: z.enum(['string', 'number', 'boolean']),
        requerido: z.boolean().optional()
    })).optional()
});

const autorCreateSchema = z.object({
    nombre: z.string().min(1, "El nombre es requerido"),
    apellido: z.string().min(1, "El apellido es requerido"),
    nacionalidad: z.string().optional(),
    biografia: z.string().optional(),
    fotografia_base64: z.string().optional(),
    fotografia_nombre: z.string().optional()
});

const envioSchema = z.object({
    id_factura: z.number().int().positive(),
    municipio: z.string().min(1, "El municipio es requerido"),
    parroquia: z.string().min(1, "La parroquia es requerida"),
    direccion_detallada: z.string().min(1, "La dirección es requerida"),
    numero_guia: z.string().optional()
});

module.exports = {
    facturaSchema, obraCreateSchema, obraUpdateSchema,
    generoSchema, autorCreateSchema, envioSchema
};
