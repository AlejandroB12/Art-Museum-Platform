const { prisma } = require('../models');

async function findByUserId(idUsuario) {
    const comprador = await prisma.comprador.findUnique({
        where: { id_usuario: Number(idUsuario) }
    });
    return comprador ? [comprador] : [];
}

async function findShippingData(idUsuario) {
    const result = await prisma.$queryRawUnsafe(`
        SELECT u.Nombre, u.Apellido, c.Calle, p.nombre AS Parroquia, m.nombre AS Municipio
        FROM Comprador c
        INNER JOIN Usuario u ON c.id_usuario = u.id_usuario
        LEFT JOIN Parroquia p ON c.id_parroquia = p.id_parroquia
        LEFT JOIN Municipio m ON p.id_municipio = m.id_municipio
        WHERE c.id_usuario = ?
    `, Number(idUsuario));
    return result;
}

async function findPurchaseHistory(idUsuario) {
    const result = await prisma.$queryRawUnsafe(`
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
    `, Number(idUsuario), Number(idUsuario));
    return result;
}

async function create(data) {
    const parroquia = data.id_parroquia
        ? { connect: { id_parroquia: Number(data.id_parroquia) } }
        : undefined;
    await prisma.comprador.create({
        data: {
            Cedula: data.Cedula,
            Telefono: data.Telefono || null,
            CodigoVerificacion: data.CodigoVerificacion || null,
            Calle: data.Calle || null,
            PuedeAdquirir: true,
            usuario: { connect: { id_usuario: data.id_usuario } },
            ...(parroquia ? { parroquia } : {})
        }
    });
}

module.exports = { findByUserId, findShippingData, findPurchaseHistory, create };
