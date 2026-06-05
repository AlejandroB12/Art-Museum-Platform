# Guía de Integración Cassandra + Node.js

## Instalación

```bash
npm install cassandra-driver
```

## Configuración

### 1. Variables de Entorno (`.env`)

```env
CASSANDRA_CONTACT_POINTS=127.0.0.1
CASSANDRA_LOCAL_DC=datacenter1
CASSANDRA_KEYSPACE=museo_db
```

### 2. Archivo de Configuración (`config/cassandra.js`)

```js
const { client, connectCassandra, executeQuery, executeBatch } = require('../config/cassandra');
```

- `client` — Instancia de `cassandra-driver.Client`
- `connectCassandra()` — Conecta y devuelve el cliente
- `executeQuery(query, params, options)` — Ejecuta una consulta preparada
- `executeBatch(queries, options)` — Ejecuta un batch de consultas

### 3. Inicialización del Keyspace

```bash
cqlsh -f cassandra/init.cql
```

O desde Node.js:

```js
const fs = require('fs');
const cql = fs.readFileSync('cassandra/init.cql', 'utf8');
// Ejecutar cada statement contra Cassandra
```

## Uso en Rutas

### Lecturas (Reportes)

```js
const { executeQuery } = require('../config/cassandra');

router.get('/consultas/obras-vendidas', async (req, res) => {
    const { anio_mes } = req.query;
    const result = await executeQuery(
        'SELECT * FROM obras_vendidas_por_periodo WHERE anio_mes = ?',
        [anio_mes]
    );
    res.json(result.rows);
});
```

### Escrituras (Auditoría)

```js
const { executeQuery } = require('../config/cassandra');

const registrarEventoSeguridad = async (id_usuario, tipo, descripcion, ip, dispositivo) => {
    await executeQuery(
        `INSERT INTO bitacora_seguridad (id_usuario, fecha_evento, tipo_evento, descripcion, ip_origen, dispositivo)
         VALUES (?, toTimestamp(now()), ?, ?, ?, ?)`,
        [id_usuario, tipo, descripcion, ip, dispositivo]
    );
};
```

### Batch (Transacciones multi-tabla)

```js
const { executeBatch } = require('../config/cassandra');

const registrarVenta = async (obraVendida, facturaComprador) => {
    await executeBatch([
        { query: 'INSERT INTO obras_vendidas_por_periodo (...) VALUES (...)', params: [...] },
        { query: 'INSERT INTO facturas_por_comprador (...) VALUES (...)', params: [...] }
    ]);
};
```

## Estrategia de Errores

- **Si Cassandra cae**: No bloquear MySQL. Capturar errores con try/catch
  y registrar en consola/logs. La operación crítica continúa en MySQL.
- **Consistencia**: `LOCAL_QUORUM` para escrituras críticas,
  `LOCAL_ONE` para lecturas de baja prioridad.
- **Idempotencia**: Usar `IF NOT EXISTS` en init.cql.

## Ejemplos de Integración

### Admin.js — Reportes desde Cassandra

```js
router.get('/consultas/obras-vendidas', async (req, res) => {
    try {
        const { anio_mes } = req.query;
        const result = await executeQuery(
            'SELECT * FROM obras_vendidas_por_periodo WHERE anio_mes = ?',
            [anio_mes]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error Cassandra:', err.message);
        // Fallback a MySQL
        const db = require('../config/database');
        db.query("SELECT ... FROM Factura ...", (err, results) => {
            res.json(results);
        });
    }
});
```

### Login.js — Bitácora de Seguridad

```js
router.post('/login-auth', (req, res) => {
    // ... lógica existente ...
    // Después del login exitoso:
    try {
        await executeQuery(
            `INSERT INTO bitacora_seguridad (id_usuario, fecha_evento, tipo_evento, descripcion, ip_origen, dispositivo)
             VALUES (?, toTimestamp(now()), 'INICIO_SESION', ?, ?, ?)`,
            [usuario.id_usuario, 'Inicio de sesión exitoso', req.ip, req.headers['user-agent']]
        );
    } catch (err) {
        console.error('Error registrando en bitácora:', err.message);
    }
});
```

## Checklist de Verificación

- [ ] `npm install cassandra-driver` ejecutado
- [ ] Variables Cassandra en `.env`
- [ ] `config/cassandra.js` creado y exporta `{ client, connectCassandra, executeQuery, executeBatch }`
- [ ] `cassandra/init.cql` ejecutado contra Cassandra
- [ ] `connectCassandra()` llamado en `server.js` antes de `listen()`
- [ ] Rutas de reportes en `Admin.js` tienen fallback a MySQL
- [ ] Eventos de seguridad se registran en `bitacora_seguridad`
- [ ] Cambios de estatus de obras se registran en `historial_estatus_obra`
- [ ] Seed data insertada (via `node scripts/seed-cassandra.js` o `cqlsh -f cassandra/02_seed_data.cql`)

## Comandos Útiles

```bash
# Inicializar esquema
cqlsh -f cassandra/init.cql

# Insertar datos de ejemplo
cqlsh -f cassandra/02_seed_data.cql

# Seed desde Node.js
node scripts/seed-cassandra.js

# Consultas gerenciales
cqlsh -f cassandra/03_consultas_gerenciales.cql

# Iniciar servidor
npm start
```
