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
-- =============================================================================
-- Sprint 2 — Tarea 3: Consultas de ejemplo para la Bitácora de Seguridad
-- =============================================================================
-- Todos los INSERT usan TIMESTAMP de ahora y UUID aleatorio.
-- Las consultas aprovechan el ordenamiento DESC para mostrar eventos recientes.
-- =============================================================================

-- =============================================================================
-- INSERTS DE EJEMPLO
-- =============================================================================

-- 1. Registro de inicio de sesión exitoso
INSERT INTO eventos_seguridad_por_usuario (id_usuario, timestamp_evento, id_evento, tipo_evento, descripcion, ip_origen, user_agent, metadata)
VALUES (42, toTimestamp(now()), uuid(), 'LOGIN_EXITOSO',
        'Inicio de sesión exitoso desde aplicación web',
        '192.168.1.100',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
        '{"metodo_autenticacion": "password", "origen": "web"}');

-- 2. Registro de intento de inicio de sesión fallido
INSERT INTO eventos_seguridad_por_usuario (id_usuario, timestamp_evento, id_evento, tipo_evento, descripcion, ip_origen, user_agent, metadata)
VALUES (0, toTimestamp(now()), uuid(), 'LOGIN_FALLIDO',
        'Intento de inicio de sesión con credenciales incorrectas',
        '203.0.113.50',
        'Mozilla/5.0 (Linux; Android 13)',
        '{"motivo": "credenciales_incorrectas", "intentos_consecutivos": 3}');

-- 3. Registro de nueva cuenta de usuario
INSERT INTO eventos_seguridad_por_usuario (id_usuario, timestamp_evento, id_evento, tipo_evento, descripcion, ip_origen, user_agent, metadata)
VALUES (43, toTimestamp(now()), uuid(), 'REGISTRO_USUARIO',
        'Registro de nuevo usuario comprador',
        '10.0.0.25',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15',
        '{"rol": "comprador", "metodo_registro": "formulario_web"}');

-- 4. Registro de activación de cuenta por administrador
INSERT INTO eventos_seguridad_por_usuario (id_usuario, timestamp_evento, id_evento, tipo_evento, descripcion, ip_origen, user_agent, metadata)
VALUES (43, toTimestamp(now()), uuid(), 'ACTIVACION_CUENTA',
        'Cuenta activada por administrador',
        '192.168.1.1',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
        '{"id_admin": 1, "metodo_activacion": "patch_aprobar_usuario"}');

-- 5. Registro de cambio de contraseña
INSERT INTO eventos_seguridad_por_usuario (id_usuario, timestamp_evento, id_evento, tipo_evento, descripcion, ip_origen, user_agent, metadata)
VALUES (42, toTimestamp(now()), uuid(), 'CAMBIO_PASSWORD',
        'Solicitud de cambio de contraseña procesada',
        '192.168.1.100',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
        '{"metodo": "recuperacion_correo", "origen_solicitud": "enlace_recuperacion"}');

-- 6. Registro de solicitud de pago de membresía
INSERT INTO eventos_seguridad_por_usuario (id_usuario, timestamp_evento, id_evento, tipo_evento, descripcion, ip_origen, user_agent, metadata)
VALUES (42, toTimestamp(now()), uuid(), 'SOLICITUD_PAGO',
        'Solicitud de aprobación de pago de membresía',
        '192.168.1.100',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
        '{"monto": 10.00, "moneda": "USD", "metodo_pago": "pendiente"}');

-- 7. Registro de aprobación de pago por administrador
INSERT INTO eventos_seguridad_por_usuario (id_usuario, timestamp_evento, id_evento, tipo_evento, descripcion, ip_origen, user_agent, metadata)
VALUES (42, toTimestamp(now()), uuid(), 'APROBACION_PAGO',
        'Pago de membresía aprobado por administrador',
        '192.168.1.1',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
        '{"id_admin": 1, "id_solicitud": 15, "monto_aprobado": 10.00, "dias_extension": 30}');

-- 8. Registro de generación de factura
INSERT INTO eventos_seguridad_por_usuario (id_usuario, timestamp_evento, id_evento, tipo_evento, descripcion, ip_origen, user_agent, metadata)
VALUES (42, toTimestamp(now()), uuid(), 'GENERACION_FACTURA',
        'Factura generada por venta de obra reservada',
        '192.168.1.1',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
        '{"id_admin": 1, "id_obra": 88, "precio_neto": 1500.00, "comision": 10, "iva": 12, "total": 1848.00}');

-- 9. Registro de creación de obra de arte (admin CRUD)
INSERT INTO eventos_seguridad_por_usuario (id_usuario, timestamp_evento, id_evento, tipo_evento, descripcion, ip_origen, user_agent, metadata)
VALUES (1, toTimestamp(now()), uuid(), 'CREACION_OBRA',
        'Administrador creó una nueva obra de arte en el catálogo',
        '192.168.1.1',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
        '{"id_admin": 1, "nombre_obra": "Atardecer Andino", "precio": 2500.00, "genero": "Paisaje"}');

-- 10. Registro de eliminación de obra (admin CRUD)
INSERT INTO eventos_seguridad_por_usuario (id_usuario, timestamp_evento, id_evento, tipo_evento, descripcion, ip_origen, user_agent, metadata)
VALUES (1, toTimestamp(now()), uuid(), 'ELIMINACION_OBRA',
        'Administrador eliminó una obra del catálogo',
        '192.168.1.1',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
        '{"id_admin": 1, "id_obra": 88, "nombre_obra": "Atardecer Andino"}');

-- =============================================================================
-- CONSULTAS DE EJEMPLO
-- =============================================================================

-- -------------------------------------------------------------------------
-- 1. Historial completo de eventos de un usuario específico
--    Ordenado del más reciente al más antiguo.
-- -------------------------------------------------------------------------
SELECT id_evento, timestamp_evento, tipo_evento, descripcion, ip_origen
FROM eventos_seguridad_por_usuario
WHERE id_usuario = 42;

-- -------------------------------------------------------------------------
-- 2. Eventos de un usuario en un rango de fechas
--    Usando las clustering columns timestamp_evento con desigualdad.
-- -------------------------------------------------------------------------
SELECT id_evento, timestamp_evento, tipo_evento, descripcion
FROM eventos_seguridad_por_usuario
WHERE id_usuario = 42
  AND timestamp_evento >= '2026-01-01'
  AND timestamp_evento <  '2026-04-01';

-- -------------------------------------------------------------------------
-- 3. Todos los eventos ocurridos en un mes específico
-- -------------------------------------------------------------------------
SELECT id_evento, timestamp_evento, id_usuario, tipo_evento, descripcion, ip_origen
FROM eventos_seguridad_por_fecha
WHERE anio_mes = 202603;

-- -------------------------------------------------------------------------
-- 4. Eventos de un tipo específico dentro de un mes
-- -------------------------------------------------------------------------
SELECT id_evento, timestamp_evento, id_usuario, descripcion, ip_origen
FROM eventos_por_tipo
WHERE tipo_evento = 'LOGIN_EXITOSO'
  AND anio_mes = 202603;

-- -------------------------------------------------------------------------
-- 5. Intentos de inicio de sesión fallidos en un mes
--    Útil para detectar ataques de fuerza bruta.
-- -------------------------------------------------------------------------
SELECT id_evento, timestamp_evento, id_usuario, descripcion, ip_origen, metadata
FROM eventos_por_tipo
WHERE tipo_evento = 'LOGIN_FALLIDO'
  AND anio_mes = 202603;

-- -------------------------------------------------------------------------
-- 6. Eventos de administración (CRUD) en un mes específico
-- -------------------------------------------------------------------------
SELECT id_evento, timestamp_evento, id_usuario, tipo_evento, descripcion
FROM eventos_por_tipo
WHERE tipo_evento IN ('CREACION_OBRA', 'ELIMINACION_OBRA', 'ACTUALIZACION_OBRA')
  AND anio_mes = 202603;

-- -------------------------------------------------------------------------
-- 7. Eventos financieros (pagos y facturación) en un mes
-- -------------------------------------------------------------------------
SELECT id_evento, timestamp_evento, id_usuario, tipo_evento, descripcion, metadata
FROM eventos_por_tipo
WHERE tipo_evento IN ('SOLICITUD_PAGO', 'APROBACION_PAGO', 'RECHAZO_PAGO', 'GENERACION_FACTURA')
  AND anio_mes = 202603;

-- -------------------------------------------------------------------------
-- 8. Consultar todos los eventos desde una IP específica en un mes
--    Requiere el índice secundario idx_eventos_ip_origen.
-- -------------------------------------------------------------------------
SELECT id_evento, timestamp_evento, id_usuario, tipo_evento, descripcion
FROM eventos_seguridad_por_fecha
WHERE anio_mes = 202603
  AND ip_origen = '192.168.1.1';
