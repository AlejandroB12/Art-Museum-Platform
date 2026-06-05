-- ============================================================
-- SPRINT 2: CONSULTAS GERENCIALES
-- Modelo Query-Driven: cada tabla responde UNA consulta
-- Catálogo de obras: MongoDB
-- Datos transaccionales históricos: Cassandra
-- ============================================================

USE museo_db;

-- ============================================================
-- Q1: LISTADO DE OBRAS VENDIDAS EN UN PERIODO
-- Partition Key: anio_mes para consultas O(1) por mes
-- ============================================================

-- Obras vendidas en enero 2026
SELECT * FROM obras_vendidas_por_periodo
WHERE anio_mes = '2026-01';

-- Para un rango (ej. enero-marzo 2026),
-- se consulta cada partition key por separado
-- (Cassandra no soporta range queries en partition keys)
SELECT * FROM obras_vendidas_por_periodo WHERE anio_mes = '2026-01';
SELECT * FROM obras_vendidas_por_periodo WHERE anio_mes = '2026-02';
SELECT * FROM obras_vendidas_por_periodo WHERE anio_mes = '2026-03';

-- ============================================================
-- Q2: RESUMEN DE FACTURACIÓN MENSUAL
-- ============================================================

-- Resumen de un mes específico
SELECT * FROM resumen_facturacion_mensual
WHERE anio_mes = '2026-01';

-- Comparativa entre meses
SELECT * FROM resumen_facturacion_mensual
WHERE anio_mes IN ('2026-01', '2026-02');

-- ============================================================
-- Q3: BITÁCORA DE SEGURIDAD (INMUTABLE)
-- Solo INSERT, nunca UPDATE/DELETE
-- ============================================================

-- Todos los eventos de seguridad de un usuario
SELECT * FROM bitacora_seguridad
WHERE id_usuario = 3;

-- Eventos de un tipo específico en un rango de tiempo
SELECT * FROM bitacora_seguridad
WHERE id_usuario = 3
  AND fecha_evento >= '2026-01-01'
  AND fecha_evento <= '2026-12-31'
  AND tipo_evento = 'CODIGO_RECUPERACION';

-- ============================================================
-- Q4: HISTORIAL DE CAMBIOS DE ESTATUS DE OBRAS
-- ============================================================

-- Historial completo de cambios de una obra
SELECT * FROM historial_estatus_obra
WHERE id_obra = 38;

-- FLUJO DE INSERCIÓN DESDE NODE.JS (ejemplo conceptual)
-- ============================================================
--
-- 1. Al generar factura en MySQL:
--    INSERT INTO obras_vendidas_por_periodo (...) VALUES (...);
--
-- 2. Al final del mes (cron):
--    Calcular y INSERT/UPDATE en resumen_facturacion_mensual;
--
-- 3. Al enviar código de seguridad:
--    INSERT INTO bitacora_seguridad (...) VALUES (...);
--
-- 4. Al cambiar estado de obra:
--    INSERT INTO historial_estatus_obra (...) VALUES (...);
