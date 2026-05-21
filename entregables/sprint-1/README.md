# Sprint 1 — Catálogo Dinámico (MongoDB)

**Equipo:** Alejandro Briceño, Kelvys Concepción, Rolanny Sánchez  
**Duración:** Semanas 1 y 2  
**Enfoque:** Flexibilidad de esquemas y polimorfismo estructural

---

## 1. Diseño de Colecciones BSON

### 1.1 Colección `autores`

| Campo | Tipo | Descripción |
|---|---|---|
| `_id` | `Number` | Identificador manual (consistente con MySQL) |
| `nombre` | `String` (req.) | Nombre del autor |
| `apellido` | `String` (req.) | Apellido del autor |
| `fecha_nacimiento` | `Date` | Fecha de nacimiento |
| `fotografia` | `String` | Ruta de la imagen del autor |
| `biografia` | `String` | Biografía textual |
| `nacionalidad` | `String` | Nombre de la nacionalidad |

### 1.2 Colección `obras`

| Campo | Tipo | Descripción |
|---|---|---|
| `_id` | `Number` | Identificador manual |
| `nombre` | `String` (req.) | Nombre de la obra |
| `fecha_creacion` | `Date` | Fecha de creación |
| `precio` | `Number` (req.) | Precio en USD |
| `estado_obra` | `String` enum | `Disponible`, `Reservado`, `Vendida` |
| `fotografia` | `String` | Ruta de la imagen |
| `autores` | `[Number]` ref → `autores._id` | Arreglo de IDs de autores |
| `genero.nombre` | `String` (req.) | Nombre del género |
| `genero.detalles` | `Object` embebido | Atributos específicos según género |

#### Subdocumento `detalles` (polimórfico por género)

**Pintura:**
```json
{
  "tecnica_principal": "String",
  "soporte_base": "String",
  "requiere_enmarcado": "Boolean"
}
```

**Escultura:**
```json
{
  "material_predominante": "String",
  "requiere_pedestal": "Boolean",
  "clasificacion_espacio": "String"
}
```

**Fotografía:**
```json
{
  "formato_origen": "String",
  "tipo_impresion_estandar": "String",
  "requiere_revelado_quimico": "Boolean"
}
```

**Orfebrería:**
```json
{
  "metal_base_dominante": "String",
  "kilataje_estandar": "String",
  "requiere_certificado_autenticidad": "Boolean"
}
```

**Cerámica:**
```json
{
  "tecnica_acabado": "String",
  "tipo_arcilla_base": "String",
  "temperatura_coccion_promedio_celsius": "Number"
}
```

### 1.3 Colección `generos`

| Campo | Tipo | Descripción |
|---|---|---|
| `_id` | `Number` | Identificador manual |
| `nombre` | `String` (req., unique) | Nombre del género |
| `descripcion` | `String` | Descripción textual |

### 1.4 Colección `especializaciones`

| Campo | Tipo | Descripción |
|---|---|---|
| `_id` | `Number` | Identificador manual |
| `nombre` | `String` (req., unique) | Nombre de la especialización |
| `atributos` | `[Atributo]` embebido | Definición de atributos del género |

#### Subdocumento `atributos`:
```json
{
  "nombre": "String (req.)",
  "tipo": "String enum ['string', 'number', 'boolean']",
  "requerido": "Boolean"
}
```

### 1.5 Colección `nacionalidades`

| Campo | Tipo | Descripción |
|---|---|---|
| `_id` | `Number` | Identificador manual |
| `nombre` | `String` (req., unique) | Nombre del país |

---

## 2. Justificación: Documentos Embebidos vs Referencias

### 2.1 Relaciones con Referencias

| Relación | Tipo | Motivo |
|---|---|---|
| `obras.autores` → `autores._id` | `[Number]` ref | Un autor puede tener muchas obras y una obra puede tener varios autores (N:M). Si embebiéramos los datos del autor en cada obra, habría duplicación masiva de nombres, biografías y fotografías. Además, actualizar la biografía de un autor requeriría recorrer todas las obras. |
| `obras.genero.nombre` → `generos.nombre` | `String` (no ref formal) | Se almacena el nombre del género como string embebido para facilitar las consultas de filtrado sin necesidad de `$lookup`. La colección `generos` existe como catálogo de referencia. |

### 2.2 Relaciones Embebidas

| Relación | Tipo | Motivo |
|---|---|---|
| `obras.genero.detalles` | Objeto embebido | Los detalles específicos del género (técnica, material, formato) pertenecen exclusivamente a la obra. No se reutilizan entre obras, por lo que no tiene sentido referenciarlos. Al estar embebidos, se evitan `$lookup` innecesarios al consultar una obra. |
| `especializaciones.atributos` | `[Atributo]` embebido | Cada especialización define su propia plantilla de atributos. Los atributos solo existen en el contexto de su especialización y se acceden siempre junto con ella. |

### 2.3 Criterio Aplicado

| Criterio | Decisión |
|---|---|
| **Frecuencia de acceso conjunta** | Si los datos siempre se leen juntos → embebido. |
| **Cardinalidad** | Si es 1:N con pocos elementos → embebido. Si es N:M → referencia. |
| **Frecuencia de actualización** | Si los datos cambian independientemente → referencia. |
| **Límite de tamaño del documento** | Los detalles embebidos son pequeños (~3 campos). Sin riesgo de superar el límite de 16 MB. |
| **Atomicidad** | Las operaciones atómicas sobre un solo documento benefician al embebido. |

---

## 3. Migración de Datos

Archivos de migración:

- **Datos semilla:** `data/museo_seed.json` — 20 autores, 70 obras, ~140 nacionalidades, 5 géneros, 5 especializaciones.
- **Script de inserción:** `scripts/seed-mongodb.js` — Lee el JSON, limpia colecciones existentes e inserta los datos.

**Comando para ejecutar:**
```bash
npm run seed
```

### Estructura Documental Optimizada

Cada obra almacena sus detalles específicos de género como subdocumento embebido dentro de `genero.detalles`. Esto permite:

- Consultar una obra completa en una sola lectura (sin joins).
- Filtrar por atributos específicos del género (ej. `genero.detalles.material_predominante`).
- Mantener un esquema flexible: cada género tiene su propia estructura de atributos.
- Polimorfismo estructural: el mismo campo `detalles` contiene diferentes campos según el valor de `genero.nombre`.

---

## 4. Consultas con Aggregation Framework

### 4.1 Catálogo de Artistas con Especialidades

Ubicación en el proyecto: `routes/Catalogo.js:177` — ruta `GET /artistas-catalogo`

```javascript
const pipeline = [
  {
    $lookup: {
      from: "obras",
      let: { autorId: "$_id" },
      pipeline: [
        { $match: { $expr: { $in: ["$$autorId", "$autores"] } } },
        { $group: { _id: "$genero.nombre" } }
      ],
      as: "obras_info"
    }
  },
  {
    $project: {
      _id: 1,
      nombre: 1,
      apellido: 1,
      fecha_nacimiento: 1,
      fotografia: 1,
      biografia: 1,
      nacionalidad: 1,
      especialidades: {
        $reduce: {
          input: "$obras_info._id",
          initialValue: [],
          in: { $concatArrays: ["$$value", ["$$this"]] }
        }
      }
    }
  },
  { $sort: { apellido: 1 } }
];
```

### 4.2 Filtro de Obras por Precio, Género y Disponibilidad

Ubicación: `routes/Catalogo.js:69` — ruta `GET /obras-filtradas?genero&artista&orden`

```javascript
const { genero, artista, orden } = req.query;
let filter = { estado_obra: "Disponible" };

if (genero && genero !== "all") {
  filter["genero.nombre"] = GENRE_MAP[genero] || genero;
}
if (artista && artista !== "all") {
  filter.autores = parseInt(artista);
}

let query = Obra.find(filter)
  .populate("autores", "_id nombre apellido fotografia")
  .sort({ precio: orden === "desc" ? -1 : 1 })
  .lean();
```

---

## 5. Archivos de Consulta

En la carpeta `consultas/` se incluyen scripts independientes para MongoDB (formato compatibles con `mongosh`):

| Archivo | Descripción |
|---|---|
| `consultas/filtrar_por_precio.js` | Filtra obras por rango de precio, orden ascendente/descendente |
| `consultas/filtrar_por_genero.js` | Filtra obras por género (Pintura, Escultura, Fotografía, Orfebrería, Cerámica) |
| `consultas/filtrar_por_disponibilidad.js` | Filtra obras por estado (Disponible, Reservado, Vendida) |

---

## 6. Resumen de Entregables

| Entregable | Estado | Ubicación |
|---|---|---|
| Esquema de colecciones BSON | ✅ Implementado | `models/*.js` |
| Justificación embebido vs referencias | ✅ Este documento | `entregables/sprint-1/README.md` |
| Scripts de inserción | ✅ Implementado | `scripts/seed-mongodb.js` + `data/museo_seed.json` |
| Consultas Aggregation Framework (precio) | ✅ Script independiente | `entregables/sprint-1/consultas/filtrar_por_precio.js` |
| Consultas Aggregation Framework (género) | ✅ Script independiente | `entregables/sprint-1/consultas/filtrar_por_genero.js` |
| Consultas Aggregation Framework (disponibilidad) | ✅ Script independiente | `entregables/sprint-1/consultas/filtrar_por_disponibilidad.js` |
| Filtros en API | ✅ Implementado | `routes/Catalogo.js` |
