const { z } = require('zod');

const ResumenFacturacionMensual = z.object({
    anio_mes: z.string()
        .regex(/^\d{4}-(?:0[1-9]|1[0-2])$/, 'Debe tener formato YYYY-MM con mes válido'),
    total_facturas: z.number()
        .int('El total de facturas debe ser un número entero')
        .nonnegative('El total de facturas no puede ser negativo'),
    monto_neto_total: z.number()
        .nonnegative('El monto neto total no puede ser negativo')
        .finite('El monto neto debe ser un número válido'),
    iva_total: z.number()
        .nonnegative('El IVA total no puede ser negativo')
        .finite('El IVA total debe ser un número válido'),
    total_pagado_total: z.number()
        .nonnegative('El total pagado no puede ser negativo')
        .finite('El total pagado debe ser un número válido'),
    ganancia_museo_total: z.number()
        .finite('La ganancia total debe ser un número válido'),
    comision_promedio: z.number()
        .min(0, 'La comisión promedio no puede ser negativa')
        .max(100, 'La comisión promedio no puede exceder 100%')
        .finite('La comisión promedio debe ser un número válido'),
    obra_mas_cara: z.number()
        .nonnegative('El precio de la obra más cara no puede ser negativo')
        .finite('Debe ser un número válido')
        .optional(),
    obra_mas_barata: z.number()
        .nonnegative('El precio de la obra más barata no puede ser negativo')
        .finite('Debe ser un número válido')
        .optional()
});

module.exports = { ResumenFacturacionMensual };
