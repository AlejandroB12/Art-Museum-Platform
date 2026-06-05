-- ============================================================
-- SPRINT 2 — Tarea 2: Alejandro
-- Modelo CQL para Resúmenes de Facturación Masiva
-- Partition Keys por anio_mes para consultas O(1) por período
-- ============================================================

CREATE TABLE IF NOT EXISTS obras_vendidas_por_periodo (
    anio_mes text,
    fecha_venta timestamp,
    id_factura int,
    id_obra int,
    nombre_obra text,
    precio_venta decimal,
    iva decimal,
    total_pagado decimal,
    ganancia_museo_usd decimal,
    porcentaje_comision decimal,
    id_comprador int,
    comprador_nombre text,
    comprador_apellido text,
    comprador_email text,
    comprador_cedula int,
    id_admin int,
    admin_nombre text,
    PRIMARY KEY (anio_mes, fecha_venta, id_factura)
) WITH CLUSTERING ORDER BY (fecha_venta DESC, id_factura ASC);

CREATE TABLE IF NOT EXISTS resumen_facturacion_mensual (
    anio_mes text PRIMARY KEY,
    total_facturas int,
    monto_neto_total decimal,
    iva_total decimal,
    total_pagado_total double,
    ganancia_museo_total double,
    comision_promedio decimal,
    obra_mas_cara decimal,
    obra_mas_barata decimal
);

CREATE TABLE IF NOT EXISTS facturas_por_comprador (
    id_comprador int,
    fecha_venta timestamp,
    id_factura int,
    id_obra int,
    nombre_obra text,
    total_pagado decimal,
    estado_entrega text,
    PRIMARY KEY (id_comprador, fecha_venta, id_factura)
) WITH CLUSTERING ORDER BY (fecha_venta DESC, id_factura ASC);
