// ============================================================
// Consulta: Filtrar obras por precio
// Aggregation Framework — MongoDB
// ============================================================
// Descripción: Obtiene obras disponibles ordenadas por precio
// de forma ascendente o descendente.
// ============================================================

// --- ORDEN ASCENDENTE (menor a mayor precio) ---
db.obras.aggregate([
  {
    $match: { estado_obra: "Disponible" }
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
      fecha_creacion: 1,
      precio: 1,
      estado_obra: 1,
      fotografia: 1,
      "genero.nombre": 1,
      "genero.detalles": 1,
      autor_nombre: "$autor_principal.nombre",
      autor_apellido: "$autor_principal.apellido"
    }
  },
  {
    $sort: { precio: 1 }
  }
]);

// --- ORDEN DESCENDENTE (mayor a menor precio) ---
db.obras.aggregate([
  {
    $match: { estado_obra: "Disponible" }
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
      fecha_creacion: 1,
      precio: 1,
      estado_obra: 1,
      fotografia: 1,
      "genero.nombre": 1,
      "genero.detalles": 1,
      autor_nombre: "$autor_principal.nombre",
      autor_apellido: "$autor_principal.apellido"
    }
  },
  {
    $sort: { precio: -1 }
  }
]);

// --- RANGO DE PRECIO (obras entre 500,000 y 5,000,000 USD) ---
db.obras.aggregate([
  {
    $match: {
      estado_obra: "Disponible",
      precio: { $gte: 500000, $lte: 5000000 }
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
      fecha_creacion: 1,
      precio: 1,
      estado_obra: 1,
      fotografia: 1,
      genero: 1,
      autor_completo: {
        $concat: ["$autor_principal.nombre", " ", "$autor_principal.apellido"]
      }
    }
  },
  {
    $sort: { precio: 1 }
  }
]);
