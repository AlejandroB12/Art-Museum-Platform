const { z } = require('zod');

const ObraVendidaPorPeriodo = z.object({
    anio_mes: z.string()
        .regex(/^\d{4}-(?:0[1-9]|1[0-2])$/, 'Debe tener formato YYYY-MM con mes válido'),
    fecha_venta: z.date({ required_error: 'La fecha de venta es requerida' }),
    id_factura: z.number().int().positive('ID de factura inválido'),
    id_obra: z.number().int().positive('ID de obra inválido'),
    nombre_obra: z.string()
        .trim()
        .min(1, 'El nombre de la obra es requerido')
        .max(200, 'El nombre de la obra no puede exceder 200 caracteres'),
    precio_venta: z.number()
        .positive('El precio de venta debe ser positivo')
        .finite('El precio de venta debe ser un número válido'),
    iva: z.number()
        .nonnegative('El IVA no puede ser negativo')
        .finite('El IVA debe ser un número válido'),
    total_pagado: z.number()
        .positive('El total pagado debe ser positivo')
        .finite('El total pagado debe ser un número válido'),
    ganancia_museo_usd: z.number()
        .finite('La ganancia debe ser un número válido'),
    porcentaje_comision: z.number()
        .min(0, 'La comisión no puede ser negativa')
        .max(100, 'La comisión no puede exceder 100%')
        .finite('La comisión debe ser un número válido'),
    id_comprador: z.number().int().positive('ID de comprador inválido'),
    comprador_nombre: z.string()
        .trim()
        .max(80, 'El nombre no puede exceder 80 caracteres')
        .optional()
        .default(''),
    comprador_apellido: z.string()
        .trim()
        .max(80, 'El apellido no puede exceder 80 caracteres')
        .optional()
        .default(''),
    comprador_email: z.string()
        .trim()
        .toLowerCase()
        .email('Debe ser un correo electrónico válido')
        .optional()
        .or(z.literal('')),
    comprador_cedula: z.string()
        .trim()
        .optional()
        .default(''),
    id_admin: z.number().int().positive('ID de administrador inválido'),
    admin_nombre: z.string()
        .trim()
        .max(80, 'El nombre no puede exceder 80 caracteres')
        .optional()
        .default('')
});

module.exports = { ObraVendidaPorPeriodo };
