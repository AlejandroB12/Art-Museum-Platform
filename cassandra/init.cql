-- ============================================================
-- SPRINT 2: Script maestro de inicialización Cassandra
-- Unifica los esquemas de facturación, seguridad y estatus
-- Tarea 5 — Kelvys: Integración General (Corregido para Astra DB)
-- ============================================================

-- Nota: Si el keyspace ya fue creado en la interfaz web de Astra DB, 
-- puedes comentar las siguientes dos líneas.
CREATE KEYSPACE IF NOT EXISTS museo_db
    WITH replication = {'class': 'NetworkTopologyStrategy', 'us-east1': 1};

USE museo_db;

-- ============================================================
-- TABLAS DE FACTURACIÓN (Tarea 2 — Alejandro)
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
    percentage_comision decimal,
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
    total_pagado_total decimal,      -- Corregido: de double a decimal
    ganancia_museo_total decimal,     -- Corregido: de double a decimal
    comision_promedio decimal,
    obra_mas_cara decimal,
    obra_mas_barata decimal
);

-- ============================================================
-- TABLAS DE SEGURIDAD (Tarea 3 — Rolannys)
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
-- TABLAS DE ESTATUS DE OBRAS (Tarea 4 — Angel)
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