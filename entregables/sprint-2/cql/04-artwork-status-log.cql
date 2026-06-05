-- ============================================================
-- SPRINT 2 — Tarea 4: Angel
-- Modelo CQL para Bitácora de Cambios de Estatus de Obras
-- Ciclo de vida: Disponible → Reservado → Vendida
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
