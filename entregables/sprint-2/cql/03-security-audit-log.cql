-- ============================================================
-- SPRINT 2 — Tarea 3: Rolannys
-- Modelo CQL para Bitácora Inmutable de Eventos de Seguridad
-- Append-only: INSERT, nunca UPDATE/DELETE
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
