-- ============================================================
-- SPRINT 2 — Tarea 3: Rolannys
-- Consultas de Seguridad y Auditoría
-- ============================================================

-- Q3a: Todos los eventos de seguridad de un usuario
SELECT * FROM bitacora_seguridad
WHERE id_usuario = 3;

-- Q3b: Eventos de un tipo específico en un rango de tiempo
SELECT * FROM bitacora_seguridad
WHERE id_usuario = 3
  AND fecha_evento >= '2026-01-01'
  AND fecha_evento <= '2026-12-31'
  AND tipo_evento = 'CODIGO_RECUPERACION';
