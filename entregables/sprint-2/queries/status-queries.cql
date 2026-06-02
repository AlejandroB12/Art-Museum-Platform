-- ============================================
-- Consultas de ejemplo para reportes gerenciales
-- Art Museum Platform - Sprint 2
-- ============================================
USE art_museum;

-- --------------------------------------------
-- 1. Historial completo de una obra específica
-- --------------------------------------------
SELECT timestamp_cambio, estado_anterior, estado_nuevo, 
       id_usuario_responsable, observaciones, nombre_obra
FROM estatus_obra_por_obra
WHERE id_obra = 5
ORDER BY timestamp_cambio DESC;

-- --------------------------------------------
-- 2. Todas las obras que están actualmente 'Reservado'
-- --------------------------------------------
SELECT id_obra, nombre_obra, ultimo_cambio, id_usuario_responsable
FROM obras_en_estado_actual
WHERE estado_actual = 'Reservado';

-- --------------------------------------------
-- 3. Todas las obras vendidas en un mes específico
-- --------------------------------------------
SELECT timestamp_cambio, id_obra, nombre_obra, id_usuario_responsable
FROM estatus_obra_por_fecha
WHERE anio_mes = '2025-05'
  AND estado_nuevo = 'Vendida';

-- --------------------------------------------
-- 4. Conteo de obras por estado actual (reporte gerencial)
-- --------------------------------------------
SELECT estado_actual, COUNT(*) AS total_obras
FROM obras_en_estado_actual
GROUP BY estado_actual;

-- --------------------------------------------
-- 5. Obras que han cambiado de estado en las últimas 24 horas
-- --------------------------------------------
-- Nota: Esta consulta requiere permitir filtrado (ALLOW FILTERING)
-- solo para propósitos de ejemplo. En producción usar otra tabla.
SELECT id_obra, timestamp_cambio, estado_anterior, estado_nuevo
FROM estatus_obra_por_fecha
WHERE anio_mes = '2025-05'
  AND timestamp_cambio > toTimestamp(now()) - 1d
  AND estado_nuevo IN ('Reservado', 'Vendida')
ALLOW FILTERING;

-- --------------------------------------------
-- 6. Tiempo promedio entre 'Reservado' y 'Vendida' 
-- (consulta conceptual - requiere lógica en aplicación)
-- --------------------------------------------
-- Esta métrica se calcula en el script de migración o en la app
-- usando los timestamps de los eventos en estatus_obra_por_obra