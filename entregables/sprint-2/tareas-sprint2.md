# Sprint 2 — Art Museum Platform

## Alta Disponibilidad y Query-Driven Modeling con Cassandra

**Equipo:** Alejandro Briceño, Rolannys Sánchez, Yvanna, Angel, Kelvys Concepción

---

## Tarea 1 — Yvanna: Diseño de Familias de Columnas

### Descripción

Analizar todas las consultas del administrador en `routes/Admin.js` y diseñar las familias de columnas en Cassandra aplicando Query-Driven Modeling. Definir Partition Keys, Clustering Columns, y el modelo conceptual de cada tabla.

### Propósito

Base arquitectónica del sprint. Garantiza que cada tabla en Cassandra responde directamente a una consulta del administrador.

### Pasos

1. Leer `routes/Admin.js` y extraer todas las consultas SELECT/reportes del administrador.
2. Por cada consulta: identificar campos del WHERE, ORDER BY y rangos de tiempo.
3. Agrupar por patrón de acceso (fecha, obra, usuario, ubicación).
4. Diseñar una familia de columnas por patrón: definir Partition Key y Clustering Columns.
5. Documentar modelo con justificación de cada clave.
6. Validar cobertura total (ninguna consulta sin tabla).

### Tips

- Modela primero la query, luego la tabla.
- El WHERE define la Partition Key; el ORDER BY y rangos van en Clustering Columns.
- GROUP BY en SQL = tabla desnormalizada con agrupación como PK.

### Evitar

- NO normalizar al estilo MySQL.
- NO usar una sola tabla gigante.
- NO poner fecha como PK si el rango es de días (usar mes/año como PK).

### Entregables

| Archivo | Ruta |
|---|---|
| `column-family-design.md` | `entregables/sprint-2/column-family-design.md` |
| `diagrama-familias.png` | `entregables/sprint-2/diagrama-familias.png` |

### Dependencias

Ninguna. Tarea fundacional.

### Recursos

- [Cassandra Query-Driven Modeling Guide](https://cassandra.apache.org/doc/latest/cassandra/data_modeling/data_modeling_conceptual.html)
- [DataStax: Basic Rules of Cassandra Data Modeling](https://www.datastax.com/blog/basic-rules-cassandra-data-modeling)
- [Partition Key vs Clustering Column](https://stackoverflow.com/questions/24949676/difference-between-partition-key-composite-key-and-clustering-key-in-cassandra)

---

## Tarea 2 — Alejandro: Modelo CQL para Resúmenes de Facturación Masiva

### Descripción

Diseñar scripts CQL para tablas de facturación en Cassandra que permitan consultas masivas de resúmenes financieros: facturas por rango de fechas, resúmenes mensuales pre-agregados y obras vendidas por período.

### Propósito

Las consultas SUM/GROUP BY en MySQL no escalan horizontalmente. Cassandra permitirá resúmenes instantáneos de ventas, ganancias, IVA y comisiones.

### Pasos

1. Analizar `Factura` en `sql/scripts.sql`: campos, tipos, relaciones.
2. Extraer consultas en `routes/Admin.js`: endpoints `/consultas/resumen-facturacion` y `/consultas/obras-vendidas`.
3. Identificar patrones de consulta:
   - Resumen por rango de fechas → tabla particionada por mes.
   - Obras vendidas en mes/año → detalle con precio y comprador.
   - Ganancia total del museo en año → agregados pre-calculados.
4. Diseñar tablas:
   - `facturas_por_fecha`: PK `(anio_mes)`, CC `(fecha_venta, id_factura)`.
   - `resumen_facturacion_mensual`: PK `(anio)`, CC `(mes)` con totales pre-agregados.
   - `obras_vendidas_por_periodo`: PK `(anio_mes)`, CC `(fecha_venta, id_obra)`.
5. Escribir scripts CQL: keyspace → tablas con tipos de datos correctos.
6. Crear consultas de ejemplo (SELECT con rangos).

### Tips

- `anio_mes` = `(anio * 100) + mes` (ej: 202506). Distribuye uniformemente.
- Usa `timeuuid` para IDs si necesitas orden temporal.
- Pre-agrega totales en `resumen_facturacion_mensual` usando Batch statements.
- Usa `WITH CLUSTERING ORDER BY (fecha_venta DESC)`.

### Evitar

- NO usar `id_factura` como PK (consulta punto-a-punto, no resumen).
- NO emular `BETWEEN` en PK; el rango solo va en Clustering Columns.
- NO olvidar que MySQL sigue siendo fuente de verdad.

### Entregables

| Archivo | Ruta |
|---|---|
| `02-billing-summaries.cql` | `entregables/sprint-2/cql/02-billing-summaries.cql` |
| `billing-queries.cql` | `entregables/sprint-2/queries/billing-queries.cql` |

### Dependencias

Tarea 1 (Yvanna).

### Recursos

- [Cassandra Time Series Data Modeling](https://cassandra.apache.org/doc/latest/cassandra/data_modeling/data_modeling_time_series.html)
- [CQL Data Types](https://cassandra.apache.org/doc/latest/cassandra/cql/types.html)
- [CQL Batch Statement](https://cassandra.apache.org/doc/latest/cassandra/cql/dml.html#batch-statement)

---

## Tarea 3 — Rolannys: Modelo CQL para Bitácora Inmutable de Eventos de Seguridad

### Descripción

Diseñar scripts CQL para bitácora inmutable (append-only) de eventos de seguridad: logins, cambios de contraseña, registros, activaciones, aprobaciones de pago y acciones admin CRUD.

### Propósito

El sprint exige "bitácora inmutable de eventos de seguridad". Actualmente no existe. Cassandra permite auditoría forense, detección de accesos no autorizados y cumplimiento.

### Pasos

1. Identificar eventos en `routes/Login.js` y `routes/Admin.js`:
   - `POST /login-auth`, `/admin-auth`, `/registrar`, `/update-password`.
   - `POST /guardar-seguridad`, `/solicitar-pago`, `/aprobar-pago`, `/generar-factura`.
   - CRUD de admin sobre obras, autores, géneros.
2. Definir vocabulario controlado: `LOGIN_EXITOSO`, `LOGIN_FALLIDO`, `REGISTRO_USUARIO`, `ACTIVACION_CUENTA`, `CAMBIO_PASSWORD`, `SOLICITUD_PAGO`, `APROBACION_PAGO`, `RECHAZO_PAGO`, `CREACION_OBRA`, `GENERACION_FACTURA`.
3. Identificar patrones de consulta:
   - Historial por usuario → PK `id_usuario`.
   - Eventos en un mes → PK `anio_mes`.
   - Eventos por tipo → PK `(tipo_evento, anio_mes)`.
4. Diseñar tablas:
   - `eventos_seguridad_por_usuario`: PK `(id_usuario)`, CC `(timestamp DESC, id_evento)`.
   - `eventos_seguridad_por_fecha`: PK `(anio_mes)`, CC `(timestamp DESC, id_evento)`.
   - `eventos_por_tipo`: PK `(tipo_evento, anio_mes)`, CC `(timestamp DESC, id_evento)`.
5. Estructura del evento: `id_evento uuid`, `id_usuario int`, `tipo_evento text`, `descripcion text`, `ip_origen text`, `user_agent text`, `timestamp_evento timestamp`, `metadata text`.
6. Escribir scripts CQL y consultas de ejemplo.

### Tips

- Usa `DESC` en Clustering Columns para eventos recientes primero.
- Particiona `eventos_por_tipo` también por mes para evitar hotspots.
- `metadata` como JSON permite flexibilidad por tipo de evento.
- Captura siempre `ip_origen` y `user_agent`.

### Evitar

- NO permitir UPDATE/DELETE. Debe ser inmutable.
- NO registrar contraseñas, hashes ni respuestas de seguridad.
- NO usar PK = solo `tipo_evento` sin particionar por tiempo.
- NO asumir que `id_usuario` siempre existe (login fallido).

### Entregables

| Archivo | Ruta |
|---|---|
| `03-security-audit-log.cql` | `entregables/sprint-2/cql/03-security-audit-log.cql` |
| `security-queries.cql` | `entregables/sprint-2/queries/security-queries.cql` |

### Dependencias

Tarea 1 (Yvanna).

### Recursos

- [Cassandra Append-Only Data Modeling](https://cassandra.apache.org/doc/latest/cassandra/data_modeling/data_modeling_audit_log.html)
- [DataStax Audit Logging](https://www.datastax.com/blog/audit-logging-cassandra)
- [Timeuuid vs UUID](https://docs.datastax.com/en/cql-oss/3.3/cql/cql_reference/uuid_type_r.html)

---

## Tarea 4 — Angel: Modelo CQL para Bitácora de Estatus de Obras

### Descripción

Diseñar scripts CQL para bitácora inmutable de cambios de estatus de obras (Disponible → Reservado → Vendida), preservando el histórico completo.

### Propósito

MySQL solo guarda el estado actual. La bitácora permite consultar el ciclo de vida completo de cualquier obra, calcular tiempos promedio en cada estado y generar reportes gerenciales.

### Pasos

1. Entender flujo actual:
   - `POST /confirmar-reserva` (Login.js): Disponible → Reservado.
   - `POST /generar-factura` (Admin.js): Reservado → Vendida.
   - Tablas `Obra` (Estado_obra), `Reserva`, `Factura`.
2. Identificar transiciones: Disponible → Reservado → Vendida. Considerar Reservado → Disponible para futuro.
3. Identificar patrones:
   - Timeline de una obra → PK `id_obra`.
   - Eventos por fecha → PK `anio_mes`.
   - Snapshot estado actual → PK `estado_actual`.
4. Diseñar tablas:
   - `estatus_obra_por_obra`: PK `(id_obra)`, CC `(timestamp_cambio DESC, id_evento)`. Columnas: `estado_anterior`, `estado_nuevo`, `id_usuario_responsable`, `id_factura`, `observaciones`.
   - `estatus_obra_por_fecha`: PK `(anio_mes)`, CC `(timestamp_cambio DESC, id_obra)`. Columna extra: `nombre_obra` (desnormalizado).
   - `obras_en_estado_actual`: PK `(estado_actual)`, CC `(id_obra)`. Columnas: `nombre_obra`, `ultimo_cambio`, `id_usuario_responsable`.
5. Migración histórica: script Node.js que lea `Reserva` y `Factura` de MySQL y reconstruya los eventos en Cassandra.
6. Escribir CQL y consultas de ejemplo para reportes gerenciales.

### Tips

- Actualiza `obras_en_estado_actual` en el mismo batch que el evento de cambio.
- Desnormaliza `nombre_obra` para evitar consultas a MySQL/MongoDB.
- Usa timestamp con milisegundos para orden correcto.

### Evitar

- NO usar una sola tabla para timeline + fecha + estado actual (tres patrones distintos).
- NO olvidar insertar evento en Cassandra al actualizar `Estado_obra` en MySQL.
- NO incluir datos de facturación (montos, IVA) aquí.

### Entregables

| Archivo | Ruta |
|---|---|
| `04-artwork-status-log.cql` | `entregables/sprint-2/cql/04-artwork-status-log.cql` |
| `status-queries.cql` | `entregables/sprint-2/queries/status-queries.cql` |
| `migrate-estatus-to-cassandra.js` | `scripts/migrate-estatus-to-cassandra.js` |

### Dependencias

Tarea 1 (Yvanna), Tarea 5 (Kelvys — coordinación).

### Recursos

- [Event Sourcing with Cassandra](https://www.datastax.com/blog/event-sourcing-cassandra)
- [Cassandra UPSERT](https://cassandra.apache.org/doc/latest/cassandra/cql/dml.html#update)
- [Migrating MySQL to Cassandra](https://www.datastax.com/blog/migrating-mysql-cassandra)

---

## Tarea 5 — Kelvys: Integración General de Cassandra con Node.js/Express

### Descripción

Implementar la capa de integración que conecta Cassandra con Node.js/Express: archivo de configuración, script maestro de inicialización, guía de integración y coordinación técnica del equipo.

### Propósito

Convertir los scripts CQL del equipo en una solución funcional. Pegamento que une todo el sprint.

### Pasos

**Parte A — Configuración (`config/cassandra.js`):**

1. Investigar driver `cassandra-driver` de DataStax.
2. Definir variables en `.env`: `CASSANDRA_CONTACT_POINTS`, `CASSANDRA_LOCAL_DC`, `CASSANDRA_KEYSPACE`.
3. Crear `config/cassandra.js` con `Client`, `connectCassandra()`, manejo de errores, funciones helper `executeQuery()` y `executeBatch()`.

**Parte B — Script maestro (`cassandra/init.cql`):**

1. Recibir y unificar CQL de Alejandro, Rolannys y Angel.
2. Verificar keyspace común (`museo_audit`) y sin conflictos de nombres.
3. Crear `init.cql` con orden: keyspace → facturación → seguridad → estatus obras.

**Parte C — Guía de integración (`integration-guide.md`):**

1. Documentar instalación: `npm install cassandra-driver`.
2. Documentar cómo usar `config/cassandra.js` en rutas.
3. Ejemplos de integración en `Admin.js` y `Login.js`.
4. Estrategia de errores: si Cassandra cae, no bloquear MySQL.
5. Checklist de verificación.

**Parte D — Coordinación:**

1. Definir keyspace `museo_audit`, convención `snake_case`, replication factor.
2. Revisar consistencia de tipos entre tablas.
3. Ser punto de contacto técnico.

### Tips

- Usa `prepare: true` en el driver para consultas preparadas.
- `consistency: LOCAL_QUORUM` para datos críticos, `LOCAL_ONE` para lecturas de baja prioridad.
- `IF NOT EXISTS` en `init.cql` para idempotencia.

### Evitar

- NO hardcodear IPs o credenciales.
- NO exponer client como variable global.
- NO ignorar `ResponseError` o `NoHostAvailableException`.

### Entregables

| Archivo | Ruta |
|---|---|
| `config/cassandra.js` | `config/cassandra.js` |
| `cassandra/init.cql` | `cassandra/init.cql` |
| `integration-guide.md` | `entregables/sprint-2/integration-guide.md` |
| `README.md` | `entregables/sprint-2/README.md` |

### Dependencias

Tarea 1 (Yvanna), Tarea 2 (Alejandro), Tarea 3 (Rolannys), Tarea 4 (Angel).

### Recursos

- [DataStax Node.js Driver](https://docs.datastax.com/en/developer/nodejs-driver/latest/)
- [cassandra-driver npm](https://www.npmjs.com/package/cassandra-driver)
- [Node.js Driver Examples](https://github.com/datastax/nodejs-driver/tree/master/examples)
- [CQLSH Documentation](https://cassandra.apache.org/doc/latest/cassandra/tools/cqlsh.html)

---

## Estructura de Carpetas

```
entregables/sprint-2/
├── README.md                        # T5: Kelvys
├── column-family-design.md          # T1: Yvanna
├── diagrama-familias.png            # T1: Yvanna
├── integration-guide.md             # T5: Kelvys
├── cql/
│   ├── 02-billing-summaries.cql     # T2: Alejandro
│   ├── 03-security-audit-log.cql    # T3: Rolannys
│   └── 04-artwork-status-log.cql    # T4: Angel
└── queries/
    ├── billing-queries.cql          # T2: Alejandro
    ├── security-queries.cql         # T3: Rolannys
    └── status-queries.cql           # T4: Angel

cassandra/
└── init.cql                         # T5: Kelvys

config/
└── cassandra.js                     # T5: Kelvys

scripts/
└── migrate-estatus-to-cassandra.js  # T4: Angel
```

## Diagrama de Dependencias

```
T1 — Yvanna (Diseño conceptual)
 ├──> T2 — Alejandro (Facturación)
 ├──> T3 — Rolannys (Seguridad)
 ├──> T4 — Angel (Estatus obras)
 └──> T5 — Kelvys (Integración)
           (T5 depende de T1, T2, T3, T4)
```
