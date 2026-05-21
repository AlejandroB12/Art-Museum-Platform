// ============================================================
// Consulta: Filtrar obras por género
// Aggregation Framework — MongoDB
// ============================================================
// Descripción: Obtiene obras filtradas por género artístico.
// Muestra los detalles específicos de cada género.
// ============================================================

// --- FILTRAR POR PINTURA ---
db.obras.aggregate([
  {
    $match: {
      estado_obra: "Disponible",
      "genero.nombre": "Pintura"
    }
  },
  {
    $lookup: {
      from: "autores",
      localField: "autores",
      foreignField: "_id",
      as: "autores_info"
    }
  },
  {
    $addFields: {
      autor_principal: {
        $arrayElemAt: ["$autores_info", 0]
      }
    }
  },
  {
    $project: {
      _id: 1,
      nombre: 1,
      precio: 1,
      "genero.nombre": 1,
      "genero.detalles.tecnica_principal": 1,
      "genero.detalles.soporte_base": 1,
      "genero.detalles.requiere_enmarcado": 1,
      autor: { $concat: ["$autor_principal.nombre", " ", "$autor_principal.apellido"] }
    }
  },
  { $sort: { precio: 1 } }
]);

// --- FILTRAR POR ESCULTURA ---
db.obras.aggregate([
  {
    $match: {
      estado_obra: "Disponible",
      "genero.nombre": "Escultura"
    }
  },
  {
    $lookup: {
      from: "autores",
      localField: "autores",
      foreignField: "_id",
      as: "autores_info"
    }
  },
  {
    $addFields: {
      autor_principal: {
        $arrayElemAt: ["$autores_info", 0]
      }
    }
  },
  {
    $project: {
      _id: 1,
      nombre: 1,
      precio: 1,
      "genero.nombre": 1,
      "genero.detalles.material_predominante": 1,
      "genero.detalles.requiere_pedestal": 1,
      "genero.detalles.clasificacion_espacio": 1,
      autor: { $concat: ["$autor_principal.nombre", " ", "$autor_principal.apellido"] }
    }
  },
  { $sort: { precio: 1 } }
]);

// --- FILTRAR POR FOTOGRAFÍA ---
db.obras.aggregate([
  {
    $match: {
      estado_obra: "Disponible",
      "genero.nombre": "Fotografía"
    }
  },
  {
    $lookup: {
      from: "autores",
      localField: "autores",
      foreignField: "_id",
      as: "autores_info"
    }
  },
  {
    $addFields: {
      autor_principal: {
        $arrayElemAt: ["$autores_info", 0]
      }
    }
  },
  {
    $project: {
      _id: 1,
      nombre: 1,
      precio: 1,
      "genero.nombre": 1,
      "genero.detalles.formato_origen": 1,
      "genero.detalles.tipo_impresion_estandar": 1,
      "genero.detalles.requiere_revelado_quimico": 1,
      autor: { $concat: ["$autor_principal.nombre", " ", "$autor_principal.apellido"] }
    }
  },
  { $sort: { precio: 1 } }
]);

// --- FILTRAR POR ORFEBRERÍA ---
db.obras.aggregate([
  {
    $match: {
      estado_obra: "Disponible",
      "genero.nombre": "Orfebreria"
    }
  },
  {
    $lookup: {
      from: "autores",
      localField: "autores",
      foreignField: "_id",
      as: "autores_info"
    }
  },
  {
    $addFields: {
      autor_principal: {
        $arrayElemAt: ["$autores_info", 0]
      }
    }
  },
  {
    $project: {
      _id: 1,
      nombre: 1,
      precio: 1,
      "genero.nombre": 1,
      "genero.detalles.metal_base_dominante": 1,
      "genero.detalles.kilataje_estandar": 1,
      "genero.detalles.requiere_certificado_autenticidad": 1,
      autor: { $concat: ["$autor_principal.nombre", " ", "$autor_principal.apellido"] }
    }
  },
  { $sort: { precio: 1 } }
]);

// --- FILTRAR POR CERÁMICA ---
db.obras.aggregate([
  {
    $match: {
      estado_obra: "Disponible",
      "genero.nombre": "Ceramica"
    }
  },
  {
    $lookup: {
      from: "autores",
      localField: "autores",
      foreignField: "_id",
      as: "autores_info"
    }
  },
  {
    $addFields: {
      autor_principal: {
        $arrayElemAt: ["$autores_info", 0]
      }
    }
  },
  {
    $project: {
      _id: 1,
      nombre: 1,
      precio: 1,
      "genero.nombre": 1,
      "genero.detalles.tecnica_acabado": 1,
      "genero.detalles.tipo_arcilla_base": 1,
      "genero.detalles.temperatura_coccion_promedio_celsius": 1,
      autor: { $concat: ["$autor_principal.nombre", " ", "$autor_principal.apellido"] }
    }
  },
  { $sort: { precio: 1 } }
]);
