-- ============================================================
-- SPRINT 2: Históricos, Auditoría y Reportes (Cassandra)
-- Solo tablas de facturación, auditoría y seguimiento
-- Origen: MySQL (Factura, Envio, CodigoSeguridad, etc.)
-- Catálogo de obras: MongoDB (no se replica aquí)
-- ============================================================

CREATE KEYSPACE IF NOT EXISTS museo_db
    WITH replication = {'class': 'SimpleStrategy', 'replication_factor': 1};

USE museo_db;

-- ============================================================
-- Q1: OBRAS VENDIDAS EN UN PERIODO
-- Origen MySQL: Factura + Comprador + Obra
-- Partition Key: anio_mes (ej. '2026-01')
-- Permite: SELECT * FROM obras_vendidas_por_periodo
--          WHERE anio_mes = '2026-01';
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

-- ============================================================
-- Q2: RESUMEN DE FACTURACIÓN MENSUAL
-- Origen MySQL: Factura (aggregación)
-- Partition Key: anio_mes
-- Permite: SELECT * FROM resumen_facturacion_mensual
--          WHERE anio_mes = '2026-01';
-- ============================================================
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

-- ============================================================
-- Q3: BITÁCORA DE SEGURIDAD (INMUTABLE)
-- Origen MySQL: CodigoSeguridad + eventos de recuperación
-- Solo-append: INSERT, nunca UPDATE/DELETE
-- Partition Key: id_usuario (auditoría por usuario)
-- Permite: SELECT * FROM bitacora_seguridad
--          WHERE id_usuario = 5;
-- ============================================================
CREATE TABLE IF NOT EXISTS bitacora_seguridad (
    id_usuario int,
    fecha_evento timestamp,
    tipo_evento text,
    descripcion text,
    ip_origen text,
    dispositivo text,
    PRIMARY KEY (id_usuario, fecha_evento, tipo_evento)
) WITH CLUSTERING ORDER BY (fecha_evento DESC, tipo_evento ASC);

-- ============================================================
-- Q4: HISTORIAL DE CAMBIOS DE ESTATUS DE OBRAS
-- Origen MySQL: Obra.Estado_obra (cambios)
-- Cada vez que se actualiza Estado_obra, se inserta aquí
-- Partition Key: id_obra
-- Permite: SELECT * FROM historial_estatus_obra
--          WHERE id_obra = 34;
-- ============================================================
CREATE TABLE IF NOT EXISTS historial_estatus_obra (
    id_obra int,
    fecha_cambio timestamp,
    estatus_anterior text,
    estatus_nuevo text,
    modificado_por int,
    motivo text,
    PRIMARY KEY (id_obra, fecha_cambio)
) WITH CLUSTERING ORDER BY (fecha_cambio DESC);

-- ============================================================
-- Q5: FACTURAS POR COMPRADOR
-- Origen MySQL: Factura
-- Partition Key: id_comprador
-- Permite: SELECT * FROM facturas_por_comprador
--          WHERE id_comprador = 3;
-- ============================================================
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

-- ============================================================
-- Q6: ENVÍOS POR ESTADO DE ENTREGA
-- Origen MySQL: Envio
-- Partition Key: estado_entrega
-- Permite: SELECT * FROM envios_por_estado
--          WHERE estado_entrega = 'Enviado';
-- ============================================================
CREATE TABLE IF NOT EXISTS envios_por_estado (
    estado_entrega text,
    fecha_venta timestamp,
    id_envio int,
    monto_total text,
    municipio text,
    parroquia text,
    calle text,
    id_factura int,
    comprador_nombre text,
    comprador_apellido text,
    PRIMARY KEY (estado_entrega, fecha_venta, id_envio)
) WITH CLUSTERING ORDER BY (fecha_venta DESC, id_envio ASC);

-- ============================================================
-- Q7: SOLICITUDES DE PAGO POR ESTATUS
-- Origen MySQL: SolicitudPago
-- Partition Key: estatus
-- Permite: SELECT * FROM solicitudes_pago_por_estatus
--          WHERE estatus = 'Pendiente';
-- ============================================================
CREATE TABLE IF NOT EXISTS solicitudes_pago_por_estatus (
    estatus text,
    fecha_solicitud timestamp,
    id_solicitud int,
    id_usuario int,
    monto decimal,
    usuario_nombre text,
    usuario_apellido text,
    usuario_email text,
    PRIMARY KEY (estatus, fecha_solicitud, id_solicitud)
) WITH CLUSTERING ORDER BY (fecha_solicitud DESC, id_solicitud ASC);

-- ============================================================
-- Q8: MEMBRESÍAS POR USUARIO
-- Origen MySQL: Membresia
-- Partition Key: id_usuario
-- Permite: SELECT * FROM membresias_por_usuario
--          WHERE id_usuario = 5;
-- ============================================================
CREATE TABLE IF NOT EXISTS membresias_por_usuario (
    id_usuario int,
    fecha_pago date,
    id_membresia int,
    monto_pagado decimal,
    PRIMARY KEY (id_usuario, fecha_pago, id_membresia)
) WITH CLUSTERING ORDER BY (fecha_pago DESC, id_membresia ASC);
