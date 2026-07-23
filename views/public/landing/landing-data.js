// ============================================================
// Datos reales extraídos de Art-Museum-Platform (rama develop)
// Fuente: docker-compose.yml, shared/database/*, api/src/gateway.js,
// modules/*/src/routers/*, cassandra schemas, package.json
// ============================================================

const SERVICES = [
  { name: "gateway",         port: 3000, label: "API Gateway",  db: null },
  { name: "auth",            port: 3001, label: "Auth",         db: "postgres" },
  { name: "catalog",         port: 3002, label: "Catalog",      db: "mongo" },
  { name: "user",            port: 3003, label: "User",         db: "postgres" },
  { name: "checkout",        port: 3004, label: "Checkout",     db: "postgres" },
  { name: "recommendations", port: 3005, label: "Recommendations", db: "neo4j" },
  { name: "chatbot",         port: 3006, label: "Chatbot",       db: null, external: "OpenRouter / Gemini" },
  { name: "admin",           port: 3007, label: "Admin",        db: "cassandra" }
];

const SCHEMAS = {
  sql: {
    title: "PostgreSQL (Supabase) — Core Transaccional (CP)",
    note: "Migrado de MySQL a PostgreSQL sobre Supabase, con Sequelize como ORM. Sigue siendo el motor de mayor consistencia: facturas, obras y reservas no admiten condiciones de carrera.",
    tables: [
`-- Conexión real: shared/database/supabase.js
const pool = new Pool({
  connectionString: process.env.SUPABASE_URL,
  ssl: { rejectUnauthorized: false }
});
-- Pool con transacciones ACID vía
-- beginTransaction() / commit() / rollback()`,
`Obra
  id_obra         INT PK
  nombre          VARCHAR(150)
  fecha_creacion  DATE
  precio          DECIMAL(15,2)
  estado_obra     VARCHAR(50)   -- Disponible | Reservado | Vendida
  id_genero       INT FK -> Genero`,
`Factura
  id_factura          INT PK
  fecha_venta         TIMESTAMP
  monto_neto          DECIMAL(15,2)
  iva                 DECIMAL(15,2)
  total_pagado        DECIMAL(15,2)
  ganancia_museo_usd  DECIMAL(15,2)
  id_obra             INT FK -> Obra
  id_comprador        INT FK -> Comprador`,
`Usuario
  id_usuario   INT PK
  email        VARCHAR UNIQUE
  contraseña   VARCHAR (bcryptjs hash)
  rol          ENUM('administrador','comprador')`
    ]
  },
  mongo: {
    title: "MongoDB — Catálogo (AP)",
    note: "Documentos polimórficos por género de obra (Pintura, Escultura, Cerámica, Orfebrería). Consistencia eventual aceptable: el catálogo público prioriza disponibilidad sobre lectura estrictamente actualizada.",
    tables: [
`// Colección: artworks
{
  _id: ObjectId,
  nombre: String,
  precio: Number,
  estado_obra: "Disponible" | "Reservado" | "Vendida",
  fotografia: String,
  genero: {                 // embebido
    nombre: "Pintura",
    tecnica: "Óleo",
    soporte: "Lienzo",
    largo_cm: Number,
    ancho_cm: Number
  },
  autor_ids: [ObjectId]     // referenciado
}`,
`// Colección: artists
{
  _id: ObjectId,
  nombre: String,
  apellido: String,
  nacionalidad: String,
  biografia: String,
  fotografia: String
}`
    ]
  },
  cassandra: {
    title: "Cassandra (DataStax Astra) — Auditoría y Reportes (AP)",
    note: "Query-Driven Modeling real del proyecto: cada tabla nace de una consulta gerencial específica, no de la normalización. Partition key = primer campo de cada PRIMARY KEY.",
    tables: [
`-- Q1: obras vendidas en un periodo
-- Partition key: anio_mes (permite SELECT O(1) por mes)
CREATE TABLE obras_vendidas_por_periodo (
  anio_mes            text,
  fecha_venta         timestamp,
  id_factura          int,
  id_obra             int,
  nombre_obra         text,
  precio_venta        decimal,
  ganancia_museo_usd  decimal,
  comprador_nombre    text,
  admin_nombre        text,
  PRIMARY KEY (anio_mes, fecha_venta, id_factura)
) WITH CLUSTERING ORDER BY (fecha_venta DESC);`,
`-- Q2: resumen de facturación mensual (agregado)
CREATE TABLE resumen_facturacion_mensual (
  anio_mes             text PRIMARY KEY,
  total_facturas       int,
  monto_neto_total     decimal,
  ganancia_museo_total decimal,
  comision_promedio    decimal
);`,
`-- Q3: bitácora de seguridad (solo-append, inmutable)
CREATE TABLE bitacora_seguridad (
  id_usuario   int,
  fecha_evento timestamp,
  tipo_evento  text,
  ip_origen    text,
  dispositivo  text,
  PRIMARY KEY (id_usuario, fecha_evento, tipo_evento)
) WITH CLUSTERING ORDER BY (fecha_evento DESC);`,
`-- Q4: historial de cambios de estatus de obra
CREATE TABLE historial_estatus_obra (
  id_obra          int,
  fecha_cambio     timestamp,
  estatus_anterior text,
  estatus_nuevo    text,
  modificado_por   int,
  PRIMARY KEY (id_obra, fecha_cambio)
) WITH CLUSTERING ORDER BY (fecha_cambio DESC);`
    ]
  },
  neo4j: {
    title: "Neo4j (Aura DB) — Grafo de Recomendaciones (CP)",
    note: "Topología: (Comprador)-[:COMPRO]->(Obra)<-[:CREO]-(Artista)-[:TRABAJA_EN]->(Genero). Usa neo4j-driver + neode como ODM.",
    tables: [
`// Nodos
(:Comprador {id_usuario, nombre, apellido, email})
(:Obra {id_obra, nombre, precio, estado, embedding, tagsClip})
(:Artista {id_artista, nombre, apellido})
(:Genero {nombre})

// Relaciones
(Comprador)-[:COMPRO {fecha}]->(Obra)
(Comprador)-[:INTERACTUO {tipo, timestamp}]->(Obra)
(Artista)-[:CREO]->(Obra)
(Artista)-[:TRABAJA_EN]->(Genero)`,
`// Cypher real: recomendación por mismo género
MATCH (c:Comprador {id_usuario:$id})-[:COMPRO]->(:Obra)
      <-[:CREO]-(:Artista)-[:TRABAJA_EN]->(g:Genero)
MATCH (g)<-[:TRABAJA_EN]-(:Artista)-[:CREO]->(rec:Obra)
WHERE NOT EXISTS { (c)-[:COMPRO]->(rec) }
  AND rec.estado = 'Disponible'
RETURN DISTINCT rec.nombre, rec.precio, g.nombre
ORDER BY rec.precio DESC LIMIT 50`
    ]
  }
};

// Endpoints reales verificados contra api/src/gateway.js (rama develop)
const API_GROUPS = [
  {
    service: "Auth (PostgreSQL)", port: 3001,
    endpoints: [
      ["POST","/login"], ["POST","/register"], ["POST","/recuperar-pw"],
      ["POST","/update-password"], ["POST","/guardar-seguridad"], ["POST","/verificar-preguntas"],
      ["GET","/api/preguntas-seguridad"], ["GET","/api/usuario-actual"],
      ["GET","/api/estado-usuario"], ["POST","/logout"]
    ]
  },
  {
    service: "Catalog (MongoDB)", port: 3002,
    endpoints: [
      ["GET","/api/artworks"], ["GET","/api/artworks/:id"],
      ["GET","/api/artists"], ["GET","/api/artists/:id"]
    ]
  },
  {
    service: "User (PostgreSQL)", port: 3003,
    endpoints: [
      ["GET","/api/precio-membresia"], ["GET","/api/membresia-usuario"],
      ["POST","/api/solicitar-pago"], ["GET","/api/mis-compras"],
      ["GET","/api/datos-envio-pago"], ["POST","/api/guardar-tarjeta"],
      ["GET","/api/favoritos"], ["GET","/api/perfil"]
    ]
  },
  {
    service: "Checkout (PostgreSQL)", port: 3004,
    endpoints: [
      ["POST","/confirmar-reserva"], ["DELETE","/cancelar-reserva"],
      ["GET","/api/estados"], ["GET","/api/municipios"],
      ["GET","/api/parroquias"], ["GET","/api/direcciones"], ["GET","/api/estados-obra"]
    ]
  },
  {
    service: "Recommendations (Neo4j)", port: 3005,
    endpoints: [
      ["GET","/api/recomendaciones/mismo-genero/:idUsuario"],
      ["GET","/api/recomendaciones/colaborativo/:idUsuario"],
      ["GET","/api/recomendaciones/personalizadas/:idUsuario"],
      ["GET","/api/recomendaciones/obras-destacadas"],
      ["GET","/api/grafo/estadisticas"], ["POST","/api/actividad/registrar"],
      ["GET","/api/auth/guest-login"]
    ]
  },
  {
    service: "Chatbot (OpenRouter / Gemini)", port: 3006,
    endpoints: [ ["POST","/api/chat"] ]
  },
  {
    service: "Admin (PostgreSQL + Cassandra)", port: 3007,
    endpoints: [
      ["GET","/consultas/obras-vendidas"], ["GET","/consultas/resumen-facturacion"],
      ["GET","/cassandra/bitacora-seguridad"], ["GET","/cassandra/historial-estatus-obra"],
      ["POST","/registrar-evento-seguridad"], ["POST","/generar-factura"],
      ["PATCH","/aprobar-usuario/:id"]
    ]
  }
];

// Flujo del live demo — rutas verificadas contra el router real (gateway.js, develop)
const DEMO_STEPS = [
  { label: "Iniciar sesión", db: "PostgreSQL", method: "POST", path: "/login",
    body: { email: "demo@museo.com", password: "demo123" } },
  { label: "Comprar obra (core Postgres)", db: "PostgreSQL", method: "POST", path: "/confirmar-reserva",
    body: { id_obra: 1 } },
  { label: "Ver catálogo actualizado", db: "MongoDB", method: "GET", path: "/api/artworks" },
  { label: "Reporte histórico", db: "Cassandra", method: "GET", path: "/consultas/obras-vendidas" },
  { label: "Recomendación", db: "Neo4j", method: "GET", path: "/api/recomendaciones/obras-destacadas" }
];

const MOCK_RESPONSES = [
  {
    status: 200,
    data: { success: true, id_usuario: 11, nombre: "Demo", email: "demo@museo.com", rol: "comprador" }
  },
  {
    status: 200,
    data: { success: true, message: "Reserva confirmada y obra actualizada" }
  },
  {
    status: 200,
    data: [
      { _id: 1, nombre: "First Humanoid Sculpture", precio: 150000, estatus: "Disponible", genero: { nombre: "Escultura" } },
      { _id: 3, nombre: "Abstract Dreamscape", precio: 420000, estatus: "Disponible", genero: { nombre: "Pintura" } },
      { _id: 7, nombre: "Bronze Age Revival", precio: 890000, estatus: "Disponible", genero: { nombre: "Escultura" } }
    ]
  },
  {
    status: 200,
    data: [
      { anio_mes: "2026-01", fecha_venta: "2026-01-15", id_factura: 1, nombre_obra: "Balloon Dog Orange", precio_venta: 58400000, ganancia_museo_usd: 5840000 },
      { anio_mes: "2026-02", fecha_venta: "2026-02-05", id_factura: 3, nombre_obra: "727", precio_venta: 3800000, ganancia_museo_usd: 380000 }
    ]
  },
  {
    status: 200,
    data: [
      { nombre: "Starry Night Over the Rhone", precio: 52000000, artista: "Vincent van Gogh", genero: "Pintura" },
      { nombre: "The Persistence of Memory", precio: 48000000, artista: "Salvador Dali", genero: "Pintura" }
    ]
  }
];
