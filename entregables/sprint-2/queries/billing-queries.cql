-- ============================================================
-- SPRINT 2 — Tarea 2: Alejandro
-- Consultas Gerenciales de Facturación
-- ============================================================

-- Q1: Listado de obras vendidas en un período (mes específico)
SELECT * FROM obras_vendidas_por_periodo
WHERE anio_mes = '2026-01';

-- Q1b: Rango de meses (se consulta cada partition key por separado)
SELECT * FROM obras_vendidas_por_periodo WHERE anio_mes = '2026-01';
SELECT * FROM obras_vendidas_por_periodo WHERE anio_mes = '2026-02';
SELECT * FROM obras_vendidas_por_periodo WHERE anio_mes = '2026-03';

-- Q2: Resumen de facturación de un mes específico
SELECT * FROM resumen_facturacion_mensual
WHERE anio_mes = '2026-01';

-- Q2b: Comparativa entre meses
SELECT * FROM resumen_facturacion_mensual
WHERE anio_mes IN ('2026-01', '2026-02');


