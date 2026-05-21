// ============================================================
// Consulta: Filtrar obras por disponibilidad (estado)
// Aggregation Framework — MongoDB
// ============================================================
// Descripción: Obtiene obras según su estado actual:
// - Disponible: a la venta
// - Reservado: apartado por un comprador
// - Vendida: transacción completada
// ============================================================

// --- OBRAS DISPONIBLES ---
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
    $group: {
      _id: "$genero.nombre",
      total_obras: { $sum: 1 },
      precio_promedio: { $avg: "$precio" },
      precio_minimo: { $min: "$precio" },
      precio_maximo: { $max: "$precio" },
      obras: {
        $push: {
          _id: "$_id",
          nombre: "$nombre",
          precio: "$precio",
          autor: {
            $concat: ["$autor_principal.nombre", " ", "$autor_principal.apellido"]
          }
        }
      }
    }
  },
  {
    $sort: { _id: 1 }
  }
]);

// --- OBRAS RESERVADAS ---
db.obras.aggregate([
  {
    $match: { estado_obra: "Reservado" }
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
      fecha_creacion: 1,
      autor: { $concat: ["$autor_principal.nombre", " ", "$autor_principal.apellido"] },
      genero: "$genero.nombre"
    }
  },
  { $sort: { precio: -1 } }
]);

// --- OBRAS VENDIDAS ---
db.obras.aggregate([
  {
    $match: { estado_obra: "Vendida" }
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
      fecha_creacion: 1,
      autor_completo: {
        $concat: ["$autor_principal.nombre", " ", "$autor_principal.apellido"]
      },
      genero: "$genero.nombre"
    }
  },
  { $sort: { precio: -1 } }
]);

// --- RESUMEN GLOBAL POR ESTADO ---
db.obras.aggregate([
  {
    $group: {
      _id: "$estado_obra",
      cantidad: { $sum: 1 },
      valor_total: { $sum: "$precio" },
      precio_promedio: { $avg: "$precio" }
    }
  },
  {
    $project: {
      _id: 1,
      cantidad: 1,
      valor_total: { $round: ["$valor_total", 2] },
      precio_promedio: { $round: ["$precio_promedio", 2] }
    }
  },
  { $sort: { _id: 1 } }
]);
