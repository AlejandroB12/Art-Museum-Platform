# Sprint 2 — Art Museum Platform

## Históricos, Auditoría y Reportes (Cassandra)

**Duración:** Semanas 3 y 4  
**Enfoque:** Alta disponibilidad y Query-Driven Modeling

### Contexto

El museo necesita generar resúmenes de facturación masivos y mantener una
bitácora inmutable de eventos de seguridad (códigos de recuperación enviados)
y cambios de estatus de las obras.

Cassandra se incorpora como base de datos de históricos, usando un modelo
Query-Driven donde cada tabla responde a una consulta específica del
administrador.

### Metas

- Desaprender el modelo normalizado relacional y diseñar familias de columnas
  basadas estrictamente en las consultas del administrador.
- Definir correctamente Partition Keys y Clustering Columns para lecturas
  eficientes por período.
- Integrar Cassandra con Node.js/Express para reportes y auditoría.

### Arquitectura

```
MySQL (transaccional)  →  Cassandra (históricos/auditoría)
    │                            │
    ├─ Usuario                   ├─ obras_vendidas_por_periodo
    ├─ Factura                   ├─ resumen_facturacion_mensual
    ├─ Obra                      ├─ bitacora_seguridad
    ├─ Reserva                   ├─ historial_estatus_obra
    ├─ SolicitudPago             ├─ facturas_por_comprador
    ├─ Membresia                 ├─ envios_por_estado
    ├─ Envio                     ├─ solicitudes_pago_por_estatus
                                 └─ membresias_por_usuario

MongoDB (catálogo flexible)
    ├─ obras
    ├─ autores
    └─ generos / especializaciones / nacionalidades
```

### Familias de Columnas (Query-Driven)

| Tabla | Partition Key | Consulta |
|-------|--------------|----------|
| `obras_vendidas_por_periodo` | `anio_mes` | Obras vendidas en un mes |
| `resumen_facturacion_mensual` | `anio_mes` | Resumen financiero mensual |
| `bitacora_seguridad` | `id_usuario` | Auditoría de seguridad por usuario |
| `historial_estatus_obra` | `id_obra` | Timeline de cambios de estatus |
| `facturas_por_comprador` | `id_comprador` | Compras de un usuario |
| `envios_por_estado` | `estado_entrega` | Envíos por estado de entrega |
| `solicitudes_pago_por_estatus` | `estatus` | Solicitudes pendientes/aprobadas |
| `membresias_por_usuario` | `id_usuario` | Historial de pagos de membresía |

### Estructura de Carpetas

```
entregables/sprint-2/
├── README.md                        # Resumen del sprint
├── column-family-design.md          # T1: Yvanna (diseño conceptual)
├── diagrama-familias.png            # T1: Yvanna (diagrama)
├── integration-guide.md             # T5: Kelvys (guía de integración)
├── cql/
│   ├── 02-billing-summaries.cql     # T2: Alejandro (facturación)
│   ├── 03-security-audit-log.cql    # T3: Rolannys (seguridad)
│   └── 04-artwork-status-log.cql    # T4: Angel (estatus obras)
└── queries/
    ├── billing-queries.cql          # T2: Alejandro
    ├── security-queries.cql         # T3: Rolannys
    └── status-queries.cql           # T4: Angel

cassandra/
├── 01_schema.cql                    # Esquema original
├── 02_seed_data.cql                 # Datos de ejemplo
├── 03_consultas_gerenciales.cql     # Consultas de gestión
└── init.cql                         # Script maestro (T5)

config/
└── cassandra.js                     # Conexión Node.js (T5)

scripts/
└── seed-cassandra.js                # Seed desde Node.js
```

### Equipo

| Integrante | Tarea |
|------------|-------|
| Yvanna | T1: Diseño de Familias de Columnas |
| Alejandro | T2: Modelo CQL para Facturación |
| Rolannys | T3: Modelo CQL para Seguridad |
| Angel | T4: Modelo CQL para Estatus de Obras |
| Kelvys | T5: Integración General con Node.js |

### Tecnologías

- **Cassandra 4.x** con `cassandra-driver` 4.9.0 (DataStax)
- **Node.js/Express** para integración
- **Query-Driven Modeling** para diseño de tablas
