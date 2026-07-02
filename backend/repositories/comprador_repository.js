const { db } = require('../../config/database');
const { promisify } = require('util');
const query = promisify(db.query).bind(db);

async function findByUserId(idUsuario) {
    return query("SELECT * FROM Comprador WHERE id_usuario = ?", [idUsuario]);
}

async function findShippingData(idUsuario) {
    return query(`
        SELECT u.Nombre, u.Apellido, c.Calle, p.nombre AS Parroquia, m.nombre AS Municipio
        FROM Comprador c
        INNER JOIN Usuario u ON c.id_usuario = u.id_usuario
        LEFT JOIN Parroquia p ON c.id_parroquia = p.id_parroquia
        LEFT JOIN Municipio m ON p.id_municipio = m.id_municipio
        WHERE c.id_usuario = ?
    `, [idUsuario]);
}

async function findPurchaseHistory(idUsuario) {
    return query(`
        SELECT o.Nombre, o.Precio, f.Fecha_Venta AS Fecha_emision, g.Nombre AS Genero, 'Pagado' AS Estado
        FROM Factura f
        INNER JOIN Obra o ON f.id_obra = o.id_Obra
        INNER JOIN Comprador c ON f.id_comprador = c.id_usuario
        LEFT JOIN Genero g ON o.id_Genero = g.id_Genero
        WHERE c.id_usuario = ?
        UNION
        SELECT o.Nombre, o.Precio, r.Fecha_Reserva AS Fecha_emision, g.Nombre AS Genero, 'Reservado' AS Estado
        FROM Reserva r
        INNER JOIN Obra o ON r.id_obra = o.id_Obra
        LEFT JOIN Genero g ON o.id_Genero = g.id_Genero
        WHERE r.id_usuario = ?
        ORDER BY Fecha_emision DESC
    `, [idUsuario, idUsuario]);
}

async function create(data) {
    return query(
        "INSERT INTO Comprador (id_usuario, Cedula, Telefono, CodigoVerificacion, id_parroquia, Calle) VALUES (?, ?, ?, ?, ?, ?)",
        [data.id_usuario, data.Cedula, data.Telefono, data.CodigoVerificacion, data.id_parroquia, data.Calle]
    );
}

module.exports = { findByUserId, findShippingData, findPurchaseHistory, create };
