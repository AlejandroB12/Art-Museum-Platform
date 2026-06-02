CREATE KEYSPACE IF NOT EXISTS art_museum
WITH replication = {'class': 'SimpleStrategy', 'replication_factor': 1};

USE art_museum;

CREATE TABLE IF NOT EXISTS estatus_obra_por_obra (
    id_obra INT,
    timestamp_cambio TIMESTAMP,
    id_evento UUID,
    estado_anterior TEXT,
    estado_nuevo TEXT,
    id_usuario_responsable INT,
    id_factura INT,
    observaciones TEXT,
    nombre_obra TEXT STATIC,
    PRIMARY KEY (id_obra, timestamp_cambio, id_evento)
) WITH CLUSTERING ORDER BY (timestamp_cambio DESC, id_evento ASC);

CREATE TABLE IF NOT EXISTS estatus_obra_por_fecha (
    anio_mes TEXT,
    timestamp_cambio TIMESTAMP,
    id_obra INT,
    id_evento UUID,
    estado_anterior TEXT,
    estado_nuevo TEXT,
    id_usuario_responsable INT,
    nombre_obra TEXT,
    PRIMARY KEY (anio_mes, timestamp_cambio, id_obra, id_evento)
) WITH CLUSTERING ORDER BY (timestamp_cambio DESC, id_obra ASC, id_evento ASC);

CREATE TABLE IF NOT EXISTS obras_en_estado_actual (
    estado_actual TEXT,
    id_obra INT,
    nombre_obra TEXT,
    ultimo_cambio TIMESTAMP,
    id_usuario_responsable INT,
    PRIMARY KEY (estado_actual, id_obra)
);