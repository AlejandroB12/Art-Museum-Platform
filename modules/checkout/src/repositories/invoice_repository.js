const { query, queryRaw } = require('../config/database');

async function findById(idFactura) {
    return query(`
        SELECT f.*, u.Nombre, u.Apellido, u.Email,
               c.Cedula,
               COALESCE(NULLIF(f.NombreComprador,''), CONCAT(u.Nombre,' ',u.Apellido)) as CompradorNombre,
               COALESCE(NULLIF(f.EmailComprador,''), u.Email) as CompradorEmail,
               COALESCE(NULLIF(f.CedulaComprador,''), c.Cedula) as CompradorCedula,
               o.Nombre as nombre_obra, o.Precio
        FROM Factura f
        INNER JOIN Usuario u ON f.id_comprador = u.id_usuario
        LEFT JOIN Comprador c ON u.id_usuario = c.id_usuario
        INNER JOIN Obra o ON f.id_obra = o.id_Obra
        WHERE f.id_factura = ?
    `, [idFactura]);
}

async function create(data) {
    return query(
        `INSERT INTO Factura (Monto_Neto, IVA, Total_Pagado, Ganancia_Museo_USD, Porcentaje_Comision,
         id_obra, id_comprador, id_admin, NombreComprador, EmailComprador, CedulaComprador, Fecha_Venta)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [data.Monto_Neto, data.IVA, data.Total_Pagado, data.Ganancia_Museo_USD,
         data.Porcentaje_Comision, data.id_obra, data.id_comprador, data.id_admin,
         data.NombreComprador, data.EmailComprador, data.CedulaComprador, data.Fecha_Venta]
    );
}

async function updateObraStatus(idObra, estado) {
    return query("UPDATE Obra SET Estado_obra = ? WHERE id_Obra = ?", [estado, idObra]);
}

async function deleteReserva(idObra) {
    return query("DELETE FROM Reserva WHERE id_obra = ?", [idObra]);
}

async function findObraById(idObra) {
    return query("SELECT * FROM Obra WHERE id_Obra = ?", [idObra]);
}

async function upsertObra(idObra, nombre, fecha, precio, idGenero, fotografia) {
    return query(
        "INSERT INTO Obra (id_Obra, Nombre, Fecha_creacion, Precio, Estado_obra, id_Genero, Fotografia) VALUES (?, ?, ?, ?, 'Reservado', ?, ?) ON DUPLICATE KEY UPDATE Nombre = VALUES(Nombre), Precio = VALUES(Precio), Estado_obra = VALUES(Estado_obra)",
        [idObra, nombre, fecha, precio, idGenero, fotografia]
    );
}

async function obrasVendidasReport(fechaInicio, fechaFin) {
    return query(
        `SELECT f.id_factura, f.id_obra, o.Nombre AS Obra, f.Total_Pagado,
                COALESCE(DATE_FORMAT(f.Fecha_Venta, '%Y-%m-%d'), '—') AS Fecha
         FROM Factura f
         JOIN Obra o ON f.id_obra = o.id_Obra
         WHERE COALESCE(DATE(f.Fecha_Venta), CURDATE()) BETWEEN ? AND ?
         ORDER BY f.Fecha_Venta DESC`,
        [fechaInicio, fechaFin]
    );
}

async function facturacionResumen(fechaInicio, fechaFin) {
    return query(
        `SELECT f.id_factura, COALESCE(DATE_FORMAT(f.Fecha_Venta, '%Y-%m-%d'), '—') AS Fecha,
                o.Nombre AS Obra, f.Monto_Neto AS Precio_Obra,
                f.Porcentaje_Comision AS Porcentaje_Museo,
                f.Ganancia_Museo_USD AS Ganancia_Museo,
                f.Total_Pagado AS Total_Recaudado
         FROM Factura f
         JOIN Obra o ON f.id_obra = o.id_Obra
         WHERE COALESCE(DATE(f.Fecha_Venta), CURDATE()) BETWEEN ? AND ?
         ORDER BY f.Fecha_Venta DESC`,
        [fechaInicio, fechaFin]
    );
}

async function membresiasResumen(fechaInicio, fechaFin) {
    return query(
        `SELECT m.idMembresia, u.Email, DATE_FORMAT(m.FechaPago, '%Y-%m-%d') AS FechaPago, m.MontoPagado
         FROM Membresia m
         JOIN Usuario u ON m.id_usuario = u.id_usuario
         WHERE DATE(m.FechaPago) BETWEEN ? AND ?
         ORDER BY m.FechaPago DESC`,
        [fechaInicio, fechaFin]
    );
}

module.exports = {
    findById, create, updateObraStatus, deleteReserva, findObraById,
    upsertObra, obrasVendidasReport, facturacionResumen, membresiasResumen
};
