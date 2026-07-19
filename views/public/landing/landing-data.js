// ============================================================
// Datos reales extraídos del proyecto Art-Museum-Platform
// (docker-compose.yml, shared/database/*, modules/*/routers/*)
// ============================================================

const SERVICES = [
  { name: "gateway",         port: 3000, label: "API Gateway", db: null },
  { name: "auth",            port: 3001, label: "Auth",            db: "mysql" },
  { name: "catalog",         port: 3002, label: "Catalog",          db: "mongo" },
  { name: "user",            port: 3003, label: "User",             db: "mysql" },
  { name: "checkout",        port: 3004, label: "Checkout",         db: "mysql" },
  { name: "recommendations", port: 3005, label: "Recommendations",  db: "neo4j" },
  { name: "chatbot",         port: 3006, label: "Chatbot (Py/FastAPI)", db: null },
  { name: "admin",           port: 3007, label: "Admin",            db: "cassandra" }
];

const SCHEMAS = {
  sql: {
    title: "MySQL — Core Transaccional (CP)",
    note: "Diseño relacional heredado de Sistemas de Bases de Datos I. Garantiza ACID en Factura, Obra, Usuario y Reserva.",
    tables: [
`Obra
  id_Obra        INT PK
  Nombre         VARCHAR(150)
  Fecha_creacion DATE
  Precio         DECIMAL(15,2)
  Estado_obra    VARCHAR(50)
  id_Genero      INT FK -> Genero`,
`Factura
  id_factura         INT PK
  Fecha_Venta        TIMESTAMP
  Monto_Neto         DECIMAL(15,2)
  IVA                DECIMAL(15,2)
  Total_Pagado       DECIMAL(15,2)
  Ganancia_Museo_USD DECIMAL(15,2)
  id_obra            INT FK -> Obra
  id_comprador       INT FK -> Comprador
  id_admin           INT FK -> Administrador`,
`Usuario
  id_usuario  INT PK
  Email       VARCHAR(45) UNIQUE
  Contraseña  VARCHAR(45)
  Rol         ENUM('administrador','comprador')`,
`Reserva
  id_reserva  INT PK
  id_obra     INT FK -> Obra
  id_usuario  INT FK -> Usuario
  Fecha_Reserva TIMESTAMP`
    ]
  },
  mongo: {
    title: "MongoDB — Catálogo (AP)",
    note: "Documentos embebidos vs. referencias: los atributos específicos por género (Pintura, Escultura, Cerámica, Orfebrería) se embeben; Autor se referencia por ObjectId para evitar duplicación entre miles de obras.",
    tables: [
`// Colección: obras (documento polimórfico)
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
  autor_ids: [ObjectId]     // referencia
}`,
`// Colección: autores
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
    title: "Cassandra — Auditoría y Reportes (AP)",
    note: "Query-Driven Modeling: cada tabla existe porque una consulta gerencial la necesita, no por normalización. Partition Key en negrita.",
    tables: [
`-- Query: "resumen de facturación por rango de fecha"
CREATE TABLE resumen_facturacion (
  fecha_venta   date,
  id_factura    int,
  obra          text,
  precio_obra   decimal,
  porcentaje_museo decimal,
  ganancia_museo   decimal,
  total_recaudado  decimal,
  PRIMARY KEY (fecha_venta, id_factura)   -- fecha_venta = partition key
) WITH CLUSTERING ORDER BY (id_factura DESC);`,
`-- Query: "bitácora inmutable de eventos de seguridad"
CREATE TABLE bitacora_seguridad (
  id_usuario   int,
  evento_ts    timestamp,
  tipo_evento  text,
  detalle      text,
  ip_origen    text,
  PRIMARY KEY (id_usuario, evento_ts)     -- id_usuario = partition key
) WITH CLUSTERING ORDER BY (evento_ts DESC);`,
`-- Query: "historial de cambios de estatus de una obra"
CREATE TABLE historial_estatus_obra (
  id_obra      int,
  cambio_ts    timestamp,
  estatus_anterior text,
  estatus_nuevo    text,
  PRIMARY KEY (id_obra, cambio_ts)
) WITH CLUSTERING ORDER BY (cambio_ts DESC);`
    ]
  },
  neo4j: {
    title: "Neo4j — Grafo de Recomendaciones (CP)",
    note: "Topología: (Comprador)-[:COMPRO]->(Obra)<-[:CREO]-(Artista)-[:TRABAJA_EN]->(Genero). Corre en Neo4j Aura.",
    tables: [
`// Nodos
(:Comprador {id_usuario, nombre, apellido, email})
(:Obra {id_obra, nombre, precio, estado, fotografia, embedding, tagsClip})
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

const API_GROUPS = [
  {
    service: "Auth", port: 3001,
    endpoints: [
      ["POST","/login-auth"], ["POST","/registrar"], ["POST","/recuperar-pw"],
      ["POST","/update-password"], ["POST","/guardar-seguridad"],
      ["GET","/api/usuario-actual"], ["GET","/api/estado-usuario"], ["GET","/logout"]
    ]
  },
  {
    service: "Catalog (MongoDB)", port: 3002,
    endpoints: [
      ["GET","/autores"], ["GET","/obras-filtradas"], ["GET","/autor-detalle/:id"],
      ["GET","/artistas-catalogo"], ["GET","/obras-destacadas"], ["GET","/obra/:id"], ["GET","/buscar"]
    ]
  },
  {
    service: "User", port: 3003,
    endpoints: [
      ["GET","/api/precio-membresia"], ["GET","/api/membresia-usuario"],
      ["POST","/solicitar-pago"], ["GET","/mis-compras"], ["GET","/api/datos-envio-pago"]
    ]
  },
  {
    service: "Checkout", port: 3004,
    endpoints: [
      ["POST","/confirmar-reserva"], ["GET","/estados"],
      ["GET","/municipios/:id_estado"], ["GET","/parroquias/:id_municipio"]
    ]
  },
  {
    service: "Recommendations (Neo4j)", port: 3005,
    endpoints: [
      ["GET","/recomendaciones/mismo-genero/:idUsuario"], ["GET","/recomendaciones/colaborativo/:idUsuario"],
      ["GET","/recomendaciones/personalizadas/:idUsuario"], ["GET","/recomendaciones/artistas-populares"],
      ["GET","/recomendaciones/generos-populares"], ["GET","/recomendaciones/obras-destacadas"],
      ["GET","/grafo/estadisticas"], ["POST","/actividad/registrar"],
      ["GET","/recomendaciones/por-similitud-ia/:idObra"], ["GET","/recomendaciones/para-ti/:idUsuario"]
    ]
  },
  {
    service: "Admin (MySQL + Cassandra)", port: 3007,
    endpoints: [
      ["GET","/api/obras-admin"], ["POST","/api/obras-admin"], ["PUT","/api/obras-admin/:id"],
      ["DELETE","/api/obras-admin/:id"], ["GET","/api/obras-reservadas"], ["POST","/generar-factura"],
      ["GET","/consultas/obras-vendidas"], ["GET","/consultas/resumen-facturacion"],
      ["GET","/cassandra/bitacora-seguridad"], ["GET","/cassandra/historial-estatus-obra"],
      ["POST","/cassandra/registrar-evento-seguridad"], ["POST","/cassandra/registrar-cambio-estatus"],
      ["GET","/api/todos-los-usuarios"], ["PATCH","/aprobar-usuario/:id"]
    ]
  }
];

// Pasos del flujo de demo en vivo (Registro -> Compra -> Catálogo -> Historial -> Recomendación)
const DEMO_STEPS = [
  { label: "Registrar / iniciar sesión", db: "MySQL", method: "POST", path: "/login-auth",
    body: { email: "demo@museo.com", password: "demo123" } },
  { label: "Comprar obra (core SQL)", db: "MySQL", method: "POST", path: "/confirmar-reserva",
    body: { id_obra: 1 } },
  { label: "Ver catálogo actualizado", db: "MongoDB", method: "GET", path: "/obras-filtradas?genero=all&artista=all&orden=desc&page=1&limit=6" },
  { label: "Reporte histórico", db: "Cassandra", method: "GET", path: "/cassandra/obras-vendidas" },
  { label: "Recomendación", db: "Neo4j", method: "GET", path: "/recomendaciones/obras-destacadas" }
];
