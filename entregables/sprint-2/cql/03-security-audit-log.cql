-- =============================================================================
-- Sprint 2 — Tarea 3: Bitácora Inmutable de Eventos de Seguridad (Cassandra)
-- =============================================================================
-- Diseño append-only (INSERT-only) para auditoría forense.
-- No se permiten UPDATE ni DELETE sobre eventos ya registrados.
-- =============================================================================

-- Keyspace con SimpleStrategy para desarrollo; en producción usar NetworkTopologyStrategy
CREATE KEYSPACE IF NOT EXISTS artmuseum_security
    WITH replication = {
        'class': 'SimpleStrategy',
        'replication_factor': 1
    };

USE artmuseum_security;

-- =============================================================================
-- 1. eventos_seguridad_por_usuario
--    Permite consultar el historial completo de un usuario específico.
--    Particionado por id_usuario, ordenado por timestamp descendente.
-- =============================================================================
CREATE TABLE IF NOT EXISTS eventos_seguridad_por_usuario (
    id_usuario          int,
    timestamp_evento    timestamp,
    id_evento           uuid,
    tipo_evento         text,
    descripcion         text,
    ip_origen           text,
    user_agent          text,
    metadata            text,
    PRIMARY KEY ((id_usuario), timestamp_evento, id_evento)
) WITH CLUSTERING ORDER BY (timestamp_evento DESC, id_evento ASC);

-- =============================================================================
-- 2. eventos_seguridad_por_fecha
--    Permite consultar todos los eventos ocurridos en un año-mes específico.
--    Particionado por anio_mes (YYYYMM), ordenado por timestamp descendente.
-- =============================================================================
CREATE TABLE IF NOT EXISTS eventos_seguridad_por_fecha (
    anio_mes            int,
    timestamp_evento    timestamp,
    id_evento           uuid,
    id_usuario          int,
    tipo_evento         text,
    descripcion         text,
    ip_origen           text,
    user_agent          text,
    metadata            text,
    PRIMARY KEY ((anio_mes), timestamp_evento, id_evento)
) WITH CLUSTERING ORDER BY (timestamp_evento DESC, id_evento ASC);

-- =============================================================================
-- 3. eventos_por_tipo
--    Permite consultar eventos de un tipo específico dentro de un mes.
--    Particionado por (tipo_evento, anio_mes) para evitar hotspots.
--    Ordenado por timestamp descendente.
-- =============================================================================
CREATE TABLE IF NOT EXISTS eventos_por_tipo (
    tipo_evento         text,
    anio_mes            int,
    timestamp_evento    timestamp,
    id_evento           uuid,
    id_usuario          int,
    descripcion         text,
    ip_origen           text,
    user_agent          text,
    metadata            text,
    PRIMARY KEY ((tipo_evento, anio_mes), timestamp_evento, id_evento)
) WITH CLUSTERING ORDER BY (timestamp_evento DESC, id_evento ASC);

-- =============================================================================
-- Índices secundarios para consultas auxiliares (usar con moderación)
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_eventos_ip_origen
    ON eventos_seguridad_por_fecha (ip_origen);

-- =============================================================================
-- Vocabulario controlado de tipo_evento (referencia — CQL no permite ENUM)
-- =============================================================================
-- LOGIN_EXITOSO       : Ingreso exitoso de usuario (Login.js: /login-auth)
-- LOGIN_FALLIDO       : Intento fallido de ingreso por credenciales incorrectas
-- ADMIN_LOGIN_EXITOSO : Ingreso exitoso de administrador (Admin.js: /admin-auth)
-- ADMIN_LOGIN_FALLIDO : Intento fallido de ingreso de administrador
-- REGISTRO_USUARIO    : Creación de nueva cuenta de usuario (Login.js: /registrar)
-- REGISTRO_ADMIN      : Creación de nueva cuenta de administrador (Admin.js: /registrar-admin)
-- ACTIVACION_CUENTA   : Activación de cuenta por administrador (Admin.js: PATCH /aprobar-usuario/:id)
-- CAMBIO_PASSWORD     : Solicitud de cambio de contraseña (Login.js: /update-password)
-- SOLICITUD_PAGO      : Solicitud de aprobación de pago de membresía (Login.js: /solicitar-pago)
-- APROBACION_PAGO     : Aprobación de pago de membresía por administrador (Admin.js: /aprobar-pago)
-- RECHAZO_PAGO        : Rechazo de pago de membresía por administrador
-- GENERACION_FACTURA  : Generación de factura por venta de obra (Admin.js: /generar-factura)
-- RESERVA_CONFIRMADA  : Confirmación de reserva de obra (Login.js: /confirmar-reserva)
-- CREACION_OBRA       : Creación de nueva obra de arte (Admin.js: POST /api/obras-admin)
-- ACTUALIZACION_OBRA  : Actualización de datos de una obra (Admin.js: PUT /api/obras/:id)
-- ELIMINACION_OBRA    : Eliminación de una obra (Admin.js: DELETE /api/obras/:id)
-- CREACION_AUTOR      : Creación de nuevo autor (Admin.js: POST /api/autores-admin)
-- ELIMINACION_AUTOR   : Eliminación de un autor (Admin.js: DELETE /api/autores-admin/:id)
-- CREACION_GENERO     : Creación de nuevo género (Admin.js: POST /api/generos)
-- ELIMINACION_GENERO  : Eliminación de un género (Admin.js: DELETE /api/generos/:id)
-- ACTIVACION_USUARIO  : Activación de usuario por administrador (Admin.js: PUT /api/usuarios/:id)
-- DESACTIVACION_USUARIO: Desactivación de usuario por administrador
-- ELIMINACION_USUARIO : Eliminación de cuenta de usuario (Admin.js: DELETE /api/usuarios/:id)
-- REGISTRO_ENVIO      : Registro de envío de obra vendida (Admin.js: POST /api/registrar-envio)
